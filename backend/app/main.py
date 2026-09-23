from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .schemas import CaseCreate, CitizenRegistration, CitizenRegistrationResponse, LoginRequest, LoginResponse, PredictionResponse
from .container import predictor
from .database import get_db, Base, engine
from . import models
from .models import CaseModel
from .repositories.repository import Repository
from .services.notification_service import notifier
from .services.blockchain_service import blockchain_service
from .services.auth_service import verify_password, create_access_token, decode_access_token

app = FastAPI(title="Cybercrime Predictive Intelligence API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    repo = Repository(db)
    user = repo.get_user(email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def get_optional_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)), db: Session = Depends(get_db)):
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        return None
    email: str = payload.get("sub")
    if email is None:
        return None
    repo = Repository(db)
    user = repo.get_user(email)
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return current_user
    return role_checker

@app.on_event("startup")
def startup_event():
    # Create tables if they don't exist
    from . import models
    Base.metadata.create_all(bind=engine)

    # Seed locations using a short-lived session
    from .database import SessionLocal
    db = SessionLocal()
    try:
        repo = Repository(db)
        repo.seed_locations()
        repo.seed_users()
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    repo = Repository(db)
    email = payload.email.strip().lower()
    
    user = repo.get_user(email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }


@app.post("/citizens/register", response_model=CitizenRegistrationResponse)
def register_citizen(payload: CitizenRegistration, db: Session = Depends(get_db)):
    repo = Repository(db)
    profile, returning_citizen = repo.register_citizen(payload.dict())
    return {**profile, "returning_citizen": returning_citizen}


@app.post("/cases")
def create_case(payload: CaseCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_optional_current_user)):
    data = payload.dict()
    repo = Repository(db)
    case = repo.create_case(data, current_user)
    return {"case_id": case["case_id"], "status": "CREATED"}


@app.get("/cases")
def list_cases(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = Repository(db)
    return repo.list_cases(current_user)


@app.get("/cases/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized or case not found")
    return case


@app.post("/cases/{case_id}/analyze")
def analyze_case(case_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["investigator", "police"]))):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized or case not found")

    # Atomic Lock state
    locked = repo.set_prediction_status(case_id, "RUNNING", triggered_by=f"{current_user['email']} (API)")
    if not locked:
        raise HTTPException(status_code=409, detail="Analysis is already running for this case.")

    locations = repo.get_locations()
    pred = predictor.analyze(case, locations, db)
    repo.add_prediction(case_id, pred)
    
    # Trigger SIH Alert & dispatch
    notifier.trigger_alerts(case_id, pred, db=db)
    
    return pred


@app.get("/cases/{case_id}/predictions")
def get_predictions(case_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_role(["investigator", "police"]))):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized or case not found")
        
    pred = repo.get_prediction(case_id)
    if not pred:
        raise HTTPException(status_code=404, detail="prediction not found")
    return pred


@app.get("/cases/{case_id}/audit-trail")
def get_case_audit_trail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return blockchain_service.get_audit_trail(db, case_id)


@app.post("/cases/{case_id}/verify-audit")
def verify_case_audit_trail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return blockchain_service.verify_audit_trail(db, case_id)

from fastapi import File, UploadFile
from .services.storage_service import StorageService

@app.post("/cases/{case_id}/evidence")
async def upload_evidence(case_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized to upload evidence to this case")

    storage_svc = StorageService()
    metadata = await storage_svc.upload_evidence(case_id, file)

    import logging
    try:
        ev = repo.add_evidence(case_id, current_user["email"], metadata)
        return ev
    except Exception as e:
        storage_path = metadata["storage_path"]
        try:
            storage_svc.delete_evidence(storage_path)
            logging.info(f"Successfully rolled back storage object: {storage_path}")
        except Exception as cleanup_err:
            logging.error(f"CRITICAL: Orphaned evidence in storage: {storage_path}. Cleanup failed: {str(cleanup_err)}")
        
        raise HTTPException(status_code=500, detail="Failed to save evidence metadata. Upload rolled back.")


@app.get("/cases/{case_id}/evidence")
def list_evidence(case_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized to view this case")

    return repo.get_all_evidence(case_id)


@app.get("/cases/{case_id}/evidence/{evidence_id}/download")
def download_evidence(case_id: str, evidence_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    repo = Repository(db)
    case = repo.get_case(case_id, current_user)
    if not case:
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    ev = repo.get_single_evidence(case_id, evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    storage_svc = StorageService()
    url = storage_svc.get_signed_url(ev["storage_path"])
    
    ev["download_url"] = url
    return ev


@app.get("/locations")
def list_locations(db: Session = Depends(get_db)):
    repo = Repository(db)
    locs = repo.get_locations()
    return list(locs.values())

