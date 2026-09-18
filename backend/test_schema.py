import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from datetime import datetime

from app.models import (
    Base, AccountModel, CaseModel, TransactionModel, LocationModel,
    PredictionModel, PredictionCandidateModel
)

# Use SQLite in-memory for schema constraint testing to avoid wiping real DB
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_transaction_account_fk(db):
    # Try inserting transaction without account
    tx = TransactionModel(
        id=1, sender_id="ACC1", receiver_id="ACC2", type="TRANSFER", 
        amount=100.0, sender_zone="Z1", receiver_zone="Z2", timestamp=datetime.utcnow()
    )
    db.add(tx)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

def test_duplicate_transaction_rejection(db):
    acc1 = AccountModel(id="ACC1", display_name="A")
    acc2 = AccountModel(id="ACC2", display_name="B")
    db.add_all([acc1, acc2])
    db.commit()
    
    tx1 = TransactionModel(
        id=1, sender_id="ACC1", receiver_id="ACC2", type="TRANSFER", 
        amount=100.0, sender_zone="Z1", receiver_zone="Z2", timestamp=datetime.utcnow()
    )
    db.add(tx1)
    db.commit()
    
    tx2 = TransactionModel(
        id=1, sender_id="ACC2", receiver_id="ACC1", type="TRANSFER", 
        amount=50.0, sender_zone="Z1", receiver_zone="Z2", timestamp=datetime.utcnow()
    )
    db.add(tx2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

def test_multiple_prediction_runs_and_fk(db):
    case = CaseModel(id=1, case_id="CASE1")
    db.add(case)
    db.commit()
    
    run1 = PredictionModel(id=1, case_id="CASE1")
    run2 = PredictionModel(id=2, case_id="CASE1")
    db.add_all([run1, run2])
    db.commit() # Should succeed
    
    # Test prediction run -> case FK invalid
    run3 = PredictionModel(id=3, case_id="INVALID")
    db.add(run3)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

def test_prediction_candidate_run_fk(db):
    loc = LocationModel(id=1, location_id="LOC1")
    db.add(loc)
    db.commit()
    
    cand = PredictionCandidateModel(id=1, run_id=999, location_id="LOC1", rank=1, candidate_score=0.9)
    db.add(cand)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

def test_prediction_candidate_location_fk(db):
    case = CaseModel(id=1, case_id="CASE1")
    db.add(case)
    db.commit()
    run = PredictionModel(id=1, case_id="CASE1")
    db.add(run)
    db.commit()
    
    cand = PredictionCandidateModel(id=1, run_id=1, location_id="INVALID", rank=1, candidate_score=0.9)
    db.add(cand)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

def test_transaction_case_fk(db):
    acc1 = AccountModel(id="ACC1", display_name="A")
    acc2 = AccountModel(id="ACC2", display_name="B")
    db.add_all([acc1, acc2])
    db.commit()
    
    # Test valid (nullable case_id)
    tx_null = TransactionModel(
        id=1, sender_id="ACC1", receiver_id="ACC2", type="TRANSFER", 
        amount=100.0, sender_zone="Z1", receiver_zone="Z2", timestamp=datetime.utcnow()
    )
    db.add(tx_null)
    db.commit()
    
    # Test invalid case_id
    tx_invalid = TransactionModel(
        id=2, case_id="INVALID", sender_id="ACC1", receiver_id="ACC2", type="TRANSFER", 
        amount=100.0, sender_zone="Z1", receiver_zone="Z2", timestamp=datetime.utcnow()
    )
    db.add(tx_invalid)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
