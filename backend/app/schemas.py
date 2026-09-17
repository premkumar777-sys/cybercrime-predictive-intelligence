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
    explanation: List[str]


class PredictionResponse(BaseModel):
    case_id: str
    risk_level: str
    predictions: List[PredictionItem]


class LoginRequest(BaseModel):
    email: str
    role: str


class LoginResponse(BaseModel):
    email: str
    name: str
    role: str


class CitizenRegistration(BaseModel):
    full_name: str
    phone: str
    email: str
    identity_type: str
    identity_number: str


class CitizenRegistrationResponse(CitizenRegistration):
    returning_citizen: bool
