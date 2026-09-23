from typing import List
from sqlalchemy.orm import Session
from ..schemas import PredictionItem, PredictionResponse
import math
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "model.pkl"

class PredictionService:
    def analyze(self, case: dict, locations: dict = None, db: Session = None) -> dict:
        raise NotImplementedError()

class MLPredictionService(PredictionService):
    def __init__(self):
        self.model = None
        try:
            if MODEL_PATH.exists():
                self.model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model: {e}")

    def analyze(self, case: dict, locations: dict = None, db: Session = None) -> dict:
        if locations is None:
            locations = {}
            
        case_id = case.get("case_id", "")
        dest_account = case.get("destination_account")
        
        if not dest_account:
            return {
                "case_id": case_id,
                "risk_level": "UNKNOWN",
                "predictions": [],
                "status": "INSUFFICIENT_DATA",
                "reason": "Case has no destination account to begin traversal.",
                "available_transaction_hops": 0,
                "required_transaction_hops": 2
            }
            
        from ..repositories.repository import Repository
        repo = Repository(db) if db else None
        
        if not repo:
             return {
                "case_id": case_id,
                "risk_level": "UNKNOWN",
                "predictions": [],
                "status": "ERROR",
                "reason": "Database session not provided to PredictionService.",
             }
        
        # 1. Transaction Traversal Intelligence
        hop_depth, terminal_accounts, transaction_path, graph_data = repo.get_downstream_accounts(dest_account, max_depth=5)
        
        if hop_depth < 2:
            return {
                "case_id": case_id,
                "risk_level": "UNKNOWN",
                "predictions": [],
                "status": "INSUFFICIENT_DATA",
                "reason": "Transaction graph is incomplete. Insufficient hops discovered.",
                "available_transaction_hops": hop_depth,
                "required_transaction_hops": 2,
                "transaction_path": transaction_path,
                "graph": graph_data
            }

        # 2. Historical Candidate Generation
        candidates_data = repo.get_historical_cashouts(terminal_accounts)
            
        if not candidates_data:
            return {
                "case_id": case_id,
                "risk_level": "UNKNOWN",
                "predictions": [],
                "status": "INSUFFICIENT_DATA",
                "reason": "No valid geographical candidate locations identified from historical patterns.",
                "available_transaction_hops": hop_depth,
                "required_transaction_hops": 2,
                "transaction_path": transaction_path,
                "graph": graph_data
            }

        # 3. ML Candidate Scoring
        amount = float(case.get("amount", 0))
        tx_time = case.get("transaction_time")
        hour = tx_time.hour if tx_time else 12
        
        # Feature: Transaction Graph Strength (0.0 to 1.0)
        transaction_graph_strength = round(min(hop_depth / 4.0, 1.0), 2)
        # Feature: Temporal Similarity (0.0 to 1.0)
        temporal_similarity = 0.9 if (hour >= 18 or hour <= 4) else 0.4

        items = []
        for loc_id, data in candidates_data.items():
            loc = locations.get(loc_id)
            if not loc:
                continue
                
            # Feature: Geographic Relevance maps to base_risk
            # DEMO LIMITATION: Victim origin coordinates do not exist in the dataset.
            # Using transparent fallback of 0.5.
            geographic_relevance = 0.5
            
            # Feature: Historical Association based on frequency (normalized to max 5)
            historical_association = round(min(data["frequency"] / 5.0, 1.0), 2)
            
            # Predict using retrained model: [transaction_graph_strength, historical_association, temporal_similarity, geographic_relevance]
            pred_score = 0.5
            if self.model:
                features_input = [[
                    transaction_graph_strength,
                    historical_association,
                    temporal_similarity,
                    geographic_relevance
                ]]
                pred_score = self.model.predict(features_input)[0]
            
            score = float(max(0.01, min(float(pred_score), 0.99)))
            
            feature_indicators = {
                "transaction_graph_strength": float(transaction_graph_strength),
                "historical_association": float(historical_association),
                "temporal_similarity": float(temporal_similarity),
                "geographic_relevance": float(geographic_relevance)
            }
            
            # Dynamically derive predicted time window from historical avg time
            avg_time = data["avg_time"]
            t_hour = int(avg_time.split(":")[0])
            end_hour = (t_hour + 2) % 24
            time_window = f"{t_hour:02d}:00 - {end_hour:02d}:00"

            items.append({
                "location_id": loc_id,
                "location_name": loc.get("name"),
                "risk_score": round(float(score), 3),
                "time_window": time_window,
                "features": feature_indicators,
            })

        # 4. Top-K Ranking
        items.sort(key=lambda x: x["risk_score"], reverse=True)
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
            "case_id": case_id,
            "risk_level": level,
            "predictions": items,
            "status": "COMPLETED",
            "transaction_path": transaction_path,
            "graph": graph_data
        }
