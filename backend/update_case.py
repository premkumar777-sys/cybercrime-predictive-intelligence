from app.database import SessionLocal
from app.models import CaseModel

def update_case():
    db = SessionLocal()
    case = db.query(CaseModel).filter(CaseModel.case_id == "CASE-A").first()
    if case:
        case.destination_account = "ACC-BHANU"
        db.commit()
        print("Updated CASE-A to ACC-BHANU")
    else:
        print("CASE-A not found")

if __name__ == "__main__":
    update_case()
