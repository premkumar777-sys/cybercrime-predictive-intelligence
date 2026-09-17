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
        amount = np.random.exponential(scale=15000) # Fraud amounts are usually high
        hour = np.random.randint(0, 24)
        
        # Heuristics for the synthetic target variable
        # High risk if: late night (18-04) OR amount > 25k AND base risk is high
        time_risk = 0.8 if (hour >= 18 or hour <= 4) else 0.2
        amount_risk = 0.9 if amount > 25000 else 0.3
        
        # Combine risk factors
        total_risk_score = (atm['base_risk'] * 0.4) + (time_risk * 0.4) + (amount_risk * 0.2)
        
        # Add some noise
        total_risk_score += np.random.normal(0, 0.1)
        total_risk_score = max(0, min(total_risk_score, 1))
        
        # Target variable
        is_high_risk = 1 if total_risk_score > 0.65 else 0
        
        records.append({
            "amount": amount,
            "hour_of_day": hour,
            "location_id": atm["location_id"],
            "base_atm_risk": atm["base_risk"],
            "is_high_risk": is_high_risk,
            "risk_score": total_risk_score
        })
        
    df = pd.DataFrame(records)
    df.to_csv(output_file, index=False)
    print(f"Generated {num_records} records to {output_file}")

if __name__ == "__main__":
    generate_data()
