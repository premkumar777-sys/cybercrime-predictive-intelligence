import pandas as pd
import numpy as np
from pathlib import Path
import os

# Create ML directory if it doesn't exist
Path(__file__).parent.mkdir(parents=True, exist_ok=True)
output_file = Path(__file__).parent / "synthetic_dataset.csv"

# Real-ish coordinates for Bangalore ATM cluster
ATMS = [
    {"location_id": "ATM001", "name": "Central ATM", "lat": 12.9716, "lon": 77.5946, "base_risk": 0.8},
    {"location_id": "ATM002", "name": "Mall ATM", "lat": 12.9750, "lon": 77.5920, "base_risk": 0.4},
    {"location_id": "ATM003", "name": "Station ATM", "lat": 12.9650, "lon": 77.6000, "base_risk": 0.7},
    {"location_id": "ATM004", "name": "Airport ATM", "lat": 12.9550, "lon": 77.6300, "base_risk": 0.2},
    {"location_id": "ATM005", "name": "Market ATM", "lat": 12.9820, "lon": 77.6050, "base_risk": 0.5},
]

def generate_data(num_records=5000):
    np.random.seed(42)
    records = []
    
    for _ in range(num_records):
        atm = np.random.choice(ATMS)
        
        # We synthesize the 4 core prototype features
        transaction_graph_strength = np.random.uniform(0.1, 1.0)
        historical_association = np.random.uniform(0.0, 1.0)
        temporal_similarity = np.random.uniform(0.0, 1.0)
        geographic_relevance = atm["base_risk"] + np.random.normal(0, 0.1)
        geographic_relevance = max(0.0, min(geographic_relevance, 1.0))
        
        # Combine risk factors to generate the target ranking score
        # A real model would learn these weights from historical outcome data
        # For our prototype, we enforce logical relationships
        total_risk_score = (
            (transaction_graph_strength * 0.2) + 
            (historical_association * 0.4) + 
            (temporal_similarity * 0.2) + 
            (geographic_relevance * 0.2)
        )
        
        # Add some noise
        total_risk_score += np.random.normal(0, 0.05)
        total_risk_score = max(0.0, min(total_risk_score, 1.0))
        
        records.append({
            "transaction_graph_strength": transaction_graph_strength,
            "historical_association": historical_association,
            "temporal_similarity": temporal_similarity,
            "geographic_relevance": geographic_relevance,
            "risk_score": total_risk_score
        })
        
    df = pd.DataFrame(records)
    df.to_csv(output_file, index=False)
    print(f"Generated {num_records} records to {output_file}")

if __name__ == "__main__":
    generate_data()
