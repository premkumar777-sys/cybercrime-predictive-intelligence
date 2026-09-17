from datetime import datetime
from sqlalchemy.orm import Session
from ..models import CaseModel, LocationModel, PredictionModel
from ..schemas import CaseCreate

class Repository:
    def __init__(self, db: Session):
        self.db = db

    def create_case(self, case_data: dict) -> dict:
        # Determine the next case_id (simple hack for now)
        count = self.db.query(CaseModel).count()
        case_id = f"CASE{count + 1:03d}"
        
        now = datetime.utcnow()
        new_case = CaseModel(
            case_id=case_id,
            fraud_type=case_data["fraud_type"],
            amount=case_data["amount"],
            transaction_time=case_data["transaction_time"],
            destination_account=case_data["destination_account"],
            status="CREATED",
            created_at=now
        )
        self.db.add(new_case)
        self.db.commit()
        self.db.refresh(new_case)
        
        # Return dict matching expected output in main.py
        return {
            "case_id": new_case.case_id,
            "fraud_type": new_case.fraud_type,
            "amount": new_case.amount,
            "transaction_time": new_case.transaction_time,
            "destination_account": new_case.destination_account,
            "status": new_case.status,
            "created_at": new_case.created_at
        }

    def list_cases(self) -> list:
        cases = self.db.query(CaseModel).all()
        return [
            {
                "case_id": c.case_id,
                "fraud_type": c.fraud_type,
                "amount": c.amount,
                "transaction_time": c.transaction_time,
                "destination_account": c.destination_account,
                "status": c.status,
                "created_at": c.created_at
            }
            for c in cases
        ]

    def get_case(self, case_id: str) -> dict:
        c = self.db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
        if c:
            return {
                "case_id": c.case_id,
                "fraud_type": c.fraud_type,
                "amount": c.amount,
                "transaction_time": c.transaction_time,
                "destination_account": c.destination_account,
                "status": c.status,
                "created_at": c.created_at
            }
        return None

    def add_prediction(self, case_id: str, prediction: dict):
        pred_model = self.db.query(PredictionModel).filter(PredictionModel.case_id == case_id).first()
        if not pred_model:
            pred_model = PredictionModel(
                case_id=case_id,
                risk_level=prediction.get("risk_level", "LOW"),
                predictions=prediction.get("predictions", [])
            )
            self.db.add(pred_model)
        else:
            pred_model.risk_level = prediction.get("risk_level", "LOW")
            pred_model.predictions = prediction.get("predictions", [])
        
        # Update case status
        case = self.db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
        if case:
            case.status = "ANALYZED"
        
        self.db.commit()

    def get_prediction(self, case_id: str) -> dict:
        p = self.db.query(PredictionModel).filter(PredictionModel.case_id == case_id).first()
        if p:
            return {
                "case_id": p.case_id,
                "risk_level": p.risk_level,
                "predictions": p.predictions
            }
        return None

    def get_locations(self) -> dict:
        locs = self.db.query(LocationModel).all()
        result = {}
        for l in locs:
            result[l.location_id] = {
                "location_id": l.location_id,
                "name": l.name,
                "latitude": l.latitude,
                "longitude": l.longitude,
                "location_type": l.location_type
            }
        return result

    def seed_locations(self):
        sample = [
            ("ATM001", "Central ATM", 12.9716, 77.5946),
            ("ATM002", "Mall ATM", 12.9750, 77.5920),
            ("ATM003", "Station ATM", 12.9650, 77.6000),
            ("ATM004", "Airport ATM", 12.9550, 77.6300),
            ("ATM005", "Market ATM", 12.9820, 77.6050),
        ]
        
        for lid, name, lat, lon in sample:
            existing = self.db.query(LocationModel).filter(LocationModel.location_id == lid).first()
            if not existing:
                self.db.add(LocationModel(
                    location_id=lid,
                    name=name,
                    latitude=lat,
                    longitude=lon,
                    location_type="ATM"
                ))
        self.db.commit()

    def seed_sample_cases(self):
        pass
