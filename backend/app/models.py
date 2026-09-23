from sqlalchemy import Column, String, Float, DateTime, Integer, JSON, Boolean, ForeignKey, UniqueConstraint, Index
from .database import Base
from datetime import datetime

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = Column(Boolean, default=True)

class CitizenProfileModel(Base):
    __tablename__ = "citizen_profiles"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    identity_type = Column(String, nullable=False)
    identity_number = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AccountModel(Base):
    __tablename__ = "accounts"
    
    id = Column(String, primary_key=True, index=True)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    
    citizen_email = Column(String, index=True, nullable=True)
    police_email = Column(String, index=True, nullable=True)
    investigator_email = Column(String, index=True, nullable=True)

class TransactionModel(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="SET NULL"), nullable=True, index=True)
    sender_id = Column(String, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    receiver_id = Column(String, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    sender_zone = Column(String, nullable=False)
    receiver_zone = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    is_fraud = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("ix_transactions_sender_type", "sender_id", "type"),
        Index("ix_transactions_receiver_type", "receiver_id", "type"),
    )

class LocationModel(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String, unique=True, index=True)
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    location_type = Column(String, default="ATM")

class PredictionModel(Base):
    __tablename__ = "prediction_runs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="PENDING")
    triggered_by = Column(String, nullable=True)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    model_version = Column(String, nullable=True)
    data_snapshot = Column(DateTime, nullable=True)
    # Keeping these for backward compatibility
    risk_level = Column(String, nullable=True) 
    reason = Column(String, nullable=True)
    predictions = Column(JSON, nullable=True)

class PredictionCandidateModel(Base):
    __tablename__ = "prediction_candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("prediction_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(String, ForeignKey("locations.location_id", ondelete="RESTRICT"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    candidate_score = Column(Float, nullable=False)
    features = Column(JSON, nullable=True)
    
    __table_args__ = (
        UniqueConstraint("run_id", "location_id", name="uq_run_location"),
    )

class EvidenceModel(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String, unique=True, index=True, nullable=False)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), index=True, nullable=False)
    uploader_email = Column(String, index=True, nullable=False)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

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
