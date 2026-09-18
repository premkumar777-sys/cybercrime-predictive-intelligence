import os
import sys
import csv
import argparse
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import AccountModel, LocationModel, TransactionModel

CSV_PATH = os.path.join(
    os.environ.get("USERPROFILE", ""),
    ".gemini", "antigravity-ide", "brain",
    "26bb42df-e0c1-4221-849d-abd29822cba1", ".user_uploaded", "media_1789651077032.csv"
)

# Deterministic zone mapping
ZONE_COORDS = {
    "Hyderabad_Central": (17.3850, 78.4867),
    "Madhapur": (17.4483, 78.3915),
    "Gachibowli": (17.4401, 78.3489),
    "Kukatpally": (17.4850, 78.4057),
    "LB_Nagar": (17.3457, 78.5522),
    "Secunderabad": (17.4399, 78.4983),
}

def get_account_id(name):
    # Deterministic account ID generator
    return f"ACC-{name.upper()}"

def run_ingestion(db=None, dry_run=False, csv_path=None):
    if csv_path is None:
        csv_path = CSV_PATH

    print(f"Starting ingestion from {csv_path}")
    print(f"Dry run mode: {dry_run}")
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    try:
        if not os.path.exists(csv_path):
            print(f"Error: CSV file not found at {csv_path}")
            return
            
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        total_rows = len(rows)
        print(f"Rows read: {total_rows}")
        
        # 1. Accounts
        unique_entities = set()
        for r in rows:
            unique_entities.add(r['sender'])
            unique_entities.add(r['receiver'])
            
        print(f"Unique entities found: {len(unique_entities)}")
        
        accounts_inserted = 0
        for name in sorted(unique_entities):
            acc_id = get_account_id(name)
            if not dry_run:
                existing = db.query(AccountModel).filter(AccountModel.id == acc_id).first()
                if not existing:
                    db.add(AccountModel(id=acc_id, display_name=name))
                    accounts_inserted += 1
            else:
                accounts_inserted += 1 # Simulation
                
        if not dry_run:
            db.commit()
            
        # 2. Locations
        unique_zones = set()
        for r in rows:
            unique_zones.add(r['sender_zone'])
            unique_zones.add(r['receiver_zone'])
            
        print(f"Unique zones found: {len(unique_zones)}")
        
        locations_inserted = 0
        for zone in sorted(unique_zones):
            loc_id = f"LOC-{zone.upper()}"
            lat, lon = ZONE_COORDS.get(zone, (17.4, 78.4)) # fallback dummy
            if not dry_run:
                existing = db.query(LocationModel).filter(LocationModel.location_id == loc_id).first()
                if not existing:
                    db.add(LocationModel(
                        location_id=loc_id,
                        name=f"{zone} Zone",
                        latitude=lat,
                        longitude=lon,
                        location_type="ZONE"
                    ))
                    locations_inserted += 1
            else:
                locations_inserted += 1
                
        if not dry_run:
            db.commit()

        # 3. Transactions
        transactions_inserted = 0
        cashout_count = 0
        fraud_count = 0
        duplicates = 0
        
        # Synthetic timestamp generation (starts Jan 1 2024, adds 5 min per row)
        base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
        
        for idx, r in enumerate(rows):
            txn_id = int(r['transaction_id'])
            sender_id = get_account_id(r['sender'])
            receiver_id = get_account_id(r['receiver'])
            txn_type = r['type']
            amount = float(r['amount'])
            sender_zone = r['sender_zone']
            receiver_zone = r['receiver_zone']
            is_fraud = bool(int(r['is_fraud']))
            
            if txn_type == "CASH_OUT":
                cashout_count += 1
            if is_fraud:
                fraud_count += 1
                
            synthetic_time = base_time + timedelta(minutes=5 * idx)
            
            if not dry_run:
                existing = db.query(TransactionModel).filter(TransactionModel.id == txn_id).first()
                if not existing:
                    db.add(TransactionModel(
                        id=txn_id,
                        case_id=None, # Cannot infer reliable case boundaries
                        sender_id=sender_id,
                        receiver_id=receiver_id,
                        type=txn_type,
                        amount=amount,
                        sender_zone=sender_zone,
                        receiver_zone=receiver_zone,
                        timestamp=synthetic_time,
                        is_fraud=is_fraud
                    ))
                    transactions_inserted += 1
                else:
                    duplicates += 1
            else:
                transactions_inserted += 1
                
        if not dry_run:
            db.commit()
            
        print("--- INGESTION REPORT ---")
        print(f"Accounts inserted: {accounts_inserted}")
        print(f"Locations inserted: {locations_inserted}")
        print(f"Transactions inserted: {transactions_inserted}")
        print(f"Duplicate transactions skipped: {duplicates}")
        print(f"CASH_OUT transactions: {cashout_count}")
        print(f"Fraud transactions: {fraud_count}")
        print(f"Case assignment: All NULL (could not infer boundaries)")
        print(f"Timestamp strategy: Deterministic +5min intervals starting 2024-01-01")
        
    except Exception as e:
        print(f"Error during ingestion: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Fraud Dataset")
    parser.add_argument("--dry-run", action="store_true", help="Run without mutating DB")
    parser.add_argument("--csv", type=str, help="Path to CSV dataset")
    args = parser.parse_args()
    
    run_ingestion(dry_run=args.dry_run, csv_path=args.csv)
