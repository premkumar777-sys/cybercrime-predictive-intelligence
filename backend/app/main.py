from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import CaseCreate, CitizenRegistration, CitizenRegistrationResponse, LoginRequest, LoginResponse, PredictionResponse
from .container import repo, predictor
from pathlib import Path

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
    # ensure data dir and seed locations
    repo.load()
    if not repo.locations:
        repo.seed_locations()
    repo.seed_users()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    role = payload.role.strip().lower()
    if role not in {"citizen", "police", "investigator"}:
        raise HTTPException(status_code=400, detail="invalid role")
    if not email.endswith("@gmail.com"):
        raise HTTPException(status_code=401, detail="Please use a valid Gmail address.")
    user = repo.get_user(email)
    if not user or user["role"] != role:
        raise HTTPException(status_code=401, detail="This email is not registered for the selected role.")
    return user


@app.post("/citizens/register", response_model=CitizenRegistrationResponse)
def register_citizen(payload: CitizenRegistration):
    profile, returning_citizen = repo.register_citizen(payload.dict())
    return {**profile, "returning_citizen": returning_citizen}


@app.post("/cases")
def create_case(payload: CaseCreate):
    data = payload.dict()
    # pydantic will ensure types
    case = repo.create_case(data)
    return {"case_id": case["case_id"], "status": "CREATED"}


@app.get("/cases")
def list_cases():
    return repo.list_cases()


@app.get("/cases/{case_id}")
def get_case(case_id: str):
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="case not found")
    return case


@app.post("/cases/{case_id}/analyze")
def analyze_case(case_id: str):
    case = repo.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="case not found")

    pred = predictor.analyze(case, repo.locations)
    repo.add_prediction(case_id, pred)
    return pred


@app.get("/cases/{case_id}/predictions")
def get_predictions(case_id: str):
    pred = repo.get_prediction(case_id)
    if not pred:
        raise HTTPException(status_code=404, detail="prediction not found")
    return pred


@app.get("/locations")
def list_locations():
    return list(repo.locations.values())
