import pandas as pd
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
    
    # We will train a regressor to output a risk score between 0 and 1
    # Features: amount, hour_of_day, base_atm_risk
    # Target: risk_score (since we want a probability/score, not just binary)
    X = df[["amount", "hour_of_day", "base_atm_risk"]]
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
