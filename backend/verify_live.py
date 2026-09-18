from app.database import SessionLocal
from app.repositories.repository import Repository
from app.container import predictor
import json

def verify():
    db = SessionLocal()
    repo = Repository(db)
    
    # In live database, CASE-A should be mapped to ACC-BHANU via the seeds we ran
    case = repo.get_case("CASE-A", {"role": "investigator", "email": "investigatora@gmail.com"})
    
    if not case:
        print("CASE-A not found in database!")
        return

    print("--- LIVE DB PREDICTION VERIFICATION ---")
    print(f"Case ID: {case['case_id']}")
    print(f"Destination Account: {case['destination_account']}")
    print("---------------------------------------")
    
    locations = repo.get_locations()
    
    pred_result = predictor.analyze(case, locations, db)
    
    print(json.dumps(pred_result, indent=2))
    
if __name__ == "__main__":
    verify()
