from typing import List
from ..schemas import PredictionItem, PredictionResponse
from ..repositories.repository import Repository
import math


class PredictionService:
    def analyze(self, case: dict) -> PredictionResponse:
        raise NotImplementedError()


class MockPredictionService(PredictionService):
    """Deterministic mock predictor.

    It ranks synthetic locations by a deterministic formula based on
    case amount and location_id so results are reproducible.
    """

    def __init__(self):
        # deterministic seed-like weights per location id
        self.base_weights = {
            "ATM001": 0.9,
            "ATM002": 0.72,
            "ATM003": 0.6,
            "ATM004": 0.4,
            "ATM005": 0.33,
        }

    def analyze(self, case: dict, locations: dict = None) -> dict:
        if locations is None:
            locations = {}

        amount = float(case.get("amount", 0))
        # simple score: base_weight * log(amount + 1) normalized
        items = []
        for lid, loc in locations.items():
            w = self.base_weights.get(lid, 0.2)
            score = w * math.log(amount + 1) / 5.0
            # clamp
            score = max(0.01, min(score, 0.99))
            items.append({
                "location_id": lid,
                "location_name": loc.get("name"),
                "risk_score": round(score, 3),
                "time_window": "18:00-20:00",
                "explanation": [
                    "Deterministic temporal heuristic",
                    "Geographic synthetic weight",
                    "Amount-driven severity"
                ],
            })

        # sort by descending score
        items.sort(key=lambda x: x["risk_score"], reverse=True)
        # assign ranks
        for i, it in enumerate(items, start=1):
            it["rank"] = i

        # coarse risk level
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
