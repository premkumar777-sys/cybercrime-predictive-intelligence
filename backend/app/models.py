from sqlalchemy import Column, String, Float, DateTime, Integer, JSON
from .database import Base
from datetime import datetime

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    fraud_type = Column(String)
    amount = Column(Float)
    transaction_time = Column(DateTime)
    destination_account = Column(String)
    status = Column(String, default="CREATED")
    created_at = Column(DateTime, default=datetime.utcnow)

class LocationModel(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String, unique=True, index=True)
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    location_type = Column(String, default="ATM")

class PredictionModel(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    risk_level = Column(String)
    predictions = Column(JSON) # Store list of prediction items
