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

class BlockchainAuditModel(Base):
    __tablename__ = "blockchain_audit_blocks"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, index=True)
    block_index = Column(Integer, index=True)
    event_type = Column(String) # e.g. CASE_REGISTERED, ML_PREDICTION_GENERATED, LEA_DISPATCH_TRIGGERED
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String, default="SYSTEM")
    payload_hash = Column(String) # SHA-256 of canonical event data
    previous_hash = Column(String) # SHA-256 of previous block
    block_hash = Column(String, unique=True, index=True) # SHA-256 of full block header
    event_data = Column(JSON) # Actual snapshot of recorded data for verification

