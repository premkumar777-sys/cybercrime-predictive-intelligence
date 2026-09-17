from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .schemas import CaseCreate, PredictionResponse
from .container import predictor
from .database import get_db, Base, engine
from .repositories.repository import Repository
from .services.notification_service import notifier

app = FastAPI(title="Cybercrime Predictive Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Seed locations using a short-lived session
    from .database import SessionLocal
    db = SessionLocal()
    try:
        repo = Repository(db)
        repo.seed_locations()
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/cases")
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    data = payload.dict()
    repo = Repository(db)
    case = repo.create_case(data)
    return {"case_id": case["case_id"], "status": "CREATED"}


@app.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    repo = Repository(db)
    return repo.list_cases()


@app.get("/cases/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    repo = Repository(db)
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return case


@app.post("/cases/{case_id}/analyze")
def analyze_case(case_id: str, db: Session = Depends(get_db)):
    repo = Repository(db)
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="case not found")

    locations = repo.get_locations()
    pred = predictor.analyze(case, locations)
    repo.add_prediction(case_id, pred)
    
    # Trigger SIH Alert Mock
    notifier.trigger_alerts(case_id, pred)
    
    return pred


@app.get("/cases/{case_id}/predictions")
def get_predictions(case_id: str, db: Session = Depends(get_db)):
    repo = Repository(db)
    pred = repo.get_prediction(case_id)
    if not pred:
        raise HTTPException(status_code=404, detail="prediction not found")
    return pred


@app.get("/locations")
def list_locations(db: Session = Depends(get_db)):
    repo = Repository(db)
    locs = repo.get_locations()
    return list(locs.values())
