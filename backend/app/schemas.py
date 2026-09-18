from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CaseCreate(BaseModel):
    fraud_type: str
    amount: float
    transaction_time: datetime
    destination_account: str


class Case(BaseModel):
    case_id: str
    fraud_type: str
    amount: float
    transaction_time: datetime
    destination_account: str
    status: str
    created_at: datetime


class Transaction(BaseModel):
    transaction_id: str
    case_id: Optional[str]
    source_account: str
    destination_account: str
    amount: float
    timestamp: datetime
    transaction_type: str


class Location(BaseModel):
    location_id: str
    name: str
    latitude: float
    longitude: float
    location_type: Optional[str] = "ATM"


class PredictionItem(BaseModel):
    location_id: str
    location_name: str
    risk_score: float
    rank: int
    time_window: str
    features: dict


class PredictionResponse(BaseModel):
    case_id: str
    risk_level: str
    predictions: List[PredictionItem]
    status: Optional[str] = "COMPLETED"
    reason: Optional[str] = None
    transaction_path: Optional[List[str]] = []


class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class CitizenRegistration(BaseModel):
    full_name: str
    phone: str
    email: str
    password: str = "password123"
    identity_type: str
    identity_number: str


class CitizenRegistrationResponse(BaseModel):
    full_name: str
    phone: str
    email: str
    identity_type: str
    identity_number: str
    returning_citizen: bool

class EvidenceResponse(BaseModel):
    evidence_id: str
    case_id: str
    original_filename: str
    content_type: str
    file_size: int
    uploaded_at: datetime
    download_url: Optional[str] = None
