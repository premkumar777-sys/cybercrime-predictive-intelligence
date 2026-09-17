from typing import List
from ..schemas import PredictionItem, PredictionResponse
import math
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "model.pkl"

class PredictionService:
    def analyze(self, case: dict, locations: dict = None) -> dict:
        raise NotImplementedError()

class MockPredictionService(PredictionService):
    def analyze(self, case: dict, locations: dict = None) -> dict:
        # Fallback dummy logic...
        return {"case_id": case.get("case_id"), "risk_level": "LOW", "predictions": []}

class MLPredictionService(PredictionService):
    def __init__(self):
        self.model = None
        try:
            if MODEL_PATH.exists():
                self.model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model: {e}")
            
        # Hardcoded base risks (normally this would be queried from DB or historical stats)
        self.base_weights = {
            "ATM001": 0.8,
            "ATM002": 0.4,
            "ATM003": 0.7,
            "ATM004": 0.2,
            "ATM005": 0.5,
        }

    def analyze(self, case: dict, locations: dict = None) -> dict:
        if locations is None:
            locations = {}
            
        if not self.model:
            # Fallback to a mock if model isn't trained yet
            print("Model not loaded, falling back to mock")
            mock = MockPredictionService()
            return mock.analyze(case, locations)

        amount = float(case.get("amount", 0))
        tx_time = case.get("transaction_time")
        hour = tx_time.hour if tx_time else 12

        items = []
        for lid, loc in locations.items():
            base_risk = self.base_weights.get(lid, 0.5)
            
            # Predict using model: [amount, hour_of_day, base_atm_risk]
            features = [[amount, hour, base_risk]]
            pred_score = self.model.predict(features)[0]
            
            # Clamp to 0-1
            score = max(0.01, min(pred_score, 0.99))
            
            # Generate explainability based on the factors
            explanation = []
            if hour >= 18 or hour <= 4:
                explanation.append("High-risk time window (late night)")
            if amount > 25000:
                explanation.append("High transaction amount anomaly")
            if base_risk > 0.6:
                explanation.append("Historically targeted ATM cluster")
                
            if not explanation:
                explanation.append("Baseline risk profile")

            items.append({
                "location_id": lid,
                "location_name": loc.get("name"),
                "risk_score": round(score, 3),
                "time_window": "18:00-20:00",
                "explanation": explanation,
            })

        # Sort by descending score
        items.sort(key=lambda x: x["risk_score"], reverse=True)
        # Assign ranks
        for i, it in enumerate(items, start=1):
            it["rank"] = i

        top = items[0]["risk_score"] if items else 0
        if top > 0.7:
            level = "HIGH"
        elif top > 0.4:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "case_id": case.get("case_id"),
            "risk_level": level,
            "predictions": items,
        }
