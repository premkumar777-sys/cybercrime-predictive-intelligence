import pytest
import os
import sys

from conftest import TestingSessionLocal
from scripts.seed_dataset import run_ingestion, CSV_PATH
from app.models import AccountModel, LocationModel, TransactionModel

def test_ingestion_dry_run():
    # Execute dry run
    db = TestingSessionLocal()
    try:
        initial_accounts = db.query(AccountModel).count()
        initial_locations = db.query(LocationModel).count()
        
        run_ingestion(db=db, dry_run=True, csv_path=CSV_PATH)
        
        # Verify nothing was inserted
        assert db.query(AccountModel).count() == initial_accounts
        assert db.query(LocationModel).count() == initial_locations
        
        # 4 setup_db transactions for the test graph
        assert db.query(TransactionModel).count() == 4 
    finally:
        db.close()

def test_ingestion_live_run():
    db = TestingSessionLocal()
    try:
        initial_accounts = db.query(AccountModel).count()
        initial_locations = db.query(LocationModel).count()
        
        run_ingestion(db=db, dry_run=False, csv_path=CSV_PATH)
        
        # Senders + receivers + CASH_OUT = 8 unique entities in CSV.
        # But ACC-CASH_OUT already exists in the test graph!
        # Thus 7 net new accounts.
        assert db.query(AccountModel).count() == initial_accounts + 7
        
        # 6 synthetic zones inserted
        assert db.query(LocationModel).count() == initial_locations + 6
        
        # 70 rows in CSV = 70 transactions + 4 existing
        assert db.query(TransactionModel).count() == 74
        
        # CASH_OUT count should be 6 from CSV + 2 from test graph = 8
        cashouts = db.query(TransactionModel).filter(TransactionModel.type == "CASH_OUT").count()
        assert cashouts == 8 
        
    finally:
        db.close()

def test_ingestion_idempotency():
    db = TestingSessionLocal()
    try:
        accounts = db.query(AccountModel).count()
        locations = db.query(LocationModel).count()
        
        # Run it a SECOND time
        run_ingestion(db=db, dry_run=False, csv_path=CSV_PATH)
        
        # Counts should remain exactly the same as after the first run
        assert db.query(AccountModel).count() == accounts
        assert db.query(LocationModel).count() == locations
        assert db.query(TransactionModel).count() == 74
        
    finally:
        db.close()
