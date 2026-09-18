"""
train_candidate_scorer.py

SIH Problem Statement 26184
This script trains a Candidate Ranking System using RandomForestRegressor.
Crucially, this is NOT a coordinate-regression model. It scores and ranks 
candidate locations (ATMs/Accounts) based on geographic relevance, temporal 
proximity, and transaction-hop features to produce Top-K likely cash-out targets.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib
from pathlib import Path

def train():
    data_path = Path(__file__).parent / "synthetic_dataset.csv"
    model_path = Path(__file__).parent / "model.pkl"
    
    if not data_path.exists():
        print("Dataset not found. Run generate_dataset.py first.")
        return
        
    df = pd.read_csv(data_path)
    
    # Features: transaction_graph_strength, historical_association, temporal_similarity, geographic_relevance
    # Target: risk_score (ranking score)
    features = [
        "transaction_graph_strength", 
        "historical_association", 
        "temporal_similarity", 
        "geographic_relevance"
    ]
    X = df[features]
    y = df["risk_score"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    print(f"Model MSE: {mse:.4f}")
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train()
