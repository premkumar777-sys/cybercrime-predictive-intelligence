import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

ML_DIR = Path(__file__).parent
CONTROLLED_MODEL_PATH = ML_DIR / "controlled_model.pkl"

def generate_controlled_dataset(num_records=5000):
    """
    Generates training data where features actually interact and vary.
    """
    np.random.seed(100)
    records = []
    
    for _ in range(num_records):
        # We need variance across all 4 features for the model to learn them
        tgs = np.random.uniform(0.1, 1.0)
        ha = np.random.uniform(0.0, 1.0)
        ts = np.random.uniform(0.0, 1.0)
        gr = np.random.uniform(0.1, 1.0)
        
        # Non-linear probability combination
        # High historical association is good, BUT only if temporal similarity is also decent
        score = (ha * 0.5) + (ts * 0.3) + (gr * 0.2)
        
        # Interaction: if transaction graph is very weak, historical association is less reliable
        if tgs < 0.3:
            score *= 0.5
            
        score += np.random.normal(0, 0.05)
        score = max(0.0, min(score, 1.0))
        
        records.append({
            "transaction_graph_strength": tgs,
            "historical_association": ha,
            "temporal_similarity": ts,
            "geographic_relevance": gr,
            "risk_score": score
        })
        
    df = pd.DataFrame(records)
    
    X = df[["transaction_graph_strength", "historical_association", "temporal_similarity", "geographic_relevance"]]
    y = df["risk_score"]
    
    model = RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X, y)
    joblib.dump(model, CONTROLLED_MODEL_PATH)
    return model

def generate_controlled_incidents(num_incidents=1000, seed=101):
    np.random.seed(seed)
    all_atms = [f"ATM_{i:03d}" for i in range(20)]
    incidents = []
    
    for i in range(num_incidents):
        actual_location = np.random.choice(all_atms)
        
        # Incident level feature
        tgs = np.random.uniform(0.1, 1.0) 
        
        true_location_in_candidates = np.random.rand() < 0.85
        num_candidates = np.random.randint(3, 8)
        candidates = list(np.random.choice(all_atms, size=num_candidates, replace=False))
        
        if true_location_in_candidates and actual_location not in candidates:
            candidates[0] = actual_location
        elif not true_location_in_candidates and actual_location in candidates:
            candidates.remove(actual_location)
            
        candidate_features = []
        
        # To make MRR valid, the TRUE candidate must probabilistically have HIGHER feature values
        for cand in candidates:
            is_true = (cand == actual_location)
            
            # Geographic relevance (varies per candidate)
            gr = np.random.uniform(0.1, 0.7)
            if is_true: gr += np.random.uniform(0.1, 0.3)
                
            # Historical association (varies per candidate)
            ha = np.random.uniform(0.0, 0.6)
            if is_true: ha += np.random.uniform(0.2, 0.4)
            
            # Temporal similarity (varies per candidate - e.g. does THIS atm match the time profile?)
            ts = np.random.uniform(0.0, 0.6)
            if is_true: ts += np.random.uniform(0.2, 0.4)
                
            candidate_features.append({
                "location_id": cand,
                "transaction_graph_strength": tgs, # Constant per incident
                "historical_association": min(ha, 1.0),
                "temporal_similarity": min(ts, 1.0),
                "geographic_relevance": min(gr, 1.0)
            })
            
        incidents.append({
            "incident_id": f"INC-{i}",
            "actual_location": actual_location,
            "candidates": candidate_features
        })
        
    return incidents

def calculate_mrr(predictions, actual_location):
    preds_sorted = sorted(predictions, key=lambda x: x["score"], reverse=True)
    ranked = [p["location_id"] for p in preds_sorted]
    if actual_location in ranked:
        return 1.0 / (ranked.index(actual_location) + 1)
    return 0.0

def run_controlled_benchmark():
    print("========================================")
    print("   CONTROLLED BENCHMARK & STRESS TESTS  ")
    print("========================================")
    
    model = generate_controlled_dataset()
    incidents = generate_controlled_incidents()
    
    N = len(incidents)
    
    # SYSTEM A: Candidate Generation Recall
    recall = sum(1 for inc in incidents if inc["actual_location"] in [c["location_id"] for c in inc["candidates"]]) / N
    print(f"[SYSTEM A] Candidate Gen Recall: {recall:.3f}")
    
    # SYSTEM B: Scoring
    base_mrr = 0
    ml_mrr = 0
    ml_no_hist_mrr = 0
    
    for inc in incidents:
        actual = inc["actual_location"]
        
        # Baseline: Hist only
        base_preds = [{"location_id": c["location_id"], "score": c["historical_association"]} for c in inc["candidates"]]
        base_mrr += calculate_mrr(base_preds, actual)
        
        # ML: All Features
        ml_preds = []
        for c in inc["candidates"]:
            score = model.predict([[c["transaction_graph_strength"], c["historical_association"], c["temporal_similarity"], c["geographic_relevance"]]])[0]
            ml_preds.append({"location_id": c["location_id"], "score": score})
        ml_mrr += calculate_mrr(ml_preds, actual)
        
        # ML: No Hist (Zeroed out)
        ml_no_hist_preds = []
        for c in inc["candidates"]:
            score = model.predict([[c["transaction_graph_strength"], 0.0, c["temporal_similarity"], c["geographic_relevance"]]])[0]
            ml_no_hist_preds.append({"location_id": c["location_id"], "score": score})
        ml_no_hist_mrr += calculate_mrr(ml_no_hist_preds, actual)
        
    print("\n[PART 7 & 8] END-TO-END MRR")
    print(f"Baseline (Hist Only) : {base_mrr/N:.3f}")
    print(f"ML (All Features)    : {ml_mrr/N:.3f}")
    print(f"ML (No Hist Feature) : {ml_no_hist_mrr/N:.3f}")
    
    print("\n[PART 10-12] STRESS TESTS")
    # Temporal Stress Test: Same Hist, Different Temp
    feat_A = [[0.8, 0.7, 0.9, 0.5]] # High Temp
    feat_B = [[0.8, 0.7, 0.3, 0.5]] # Low Temp
    print(f"Temporal Stress: High Temp Score = {model.predict(feat_A)[0]:.3f} vs Low Temp Score = {model.predict(feat_B)[0]:.3f}")

    # Geographic Stress Test
    feat_C = [[0.8, 0.7, 0.5, 0.9]] # High Geo
    feat_D = [[0.8, 0.7, 0.5, 0.3]] # Low Geo
    print(f"Geographic Stress: High Geo Score = {model.predict(feat_C)[0]:.3f} vs Low Geo Score = {model.predict(feat_D)[0]:.3f}")

    # Graph Stress Test: If graph is weak, score should drop
    feat_E = [[0.9, 0.7, 0.5, 0.5]] # Strong Graph
    feat_F = [[0.1, 0.7, 0.5, 0.5]] # Weak Graph
    print(f"Graph Stress: Strong Graph Score = {model.predict(feat_E)[0]:.3f} vs Weak Graph Score = {model.predict(feat_F)[0]:.3f}")

if __name__ == "__main__":
    run_controlled_benchmark()
