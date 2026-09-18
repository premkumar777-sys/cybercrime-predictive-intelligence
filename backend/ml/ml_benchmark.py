import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import warnings

# Suppress sklearn warnings about feature names since we are passing raw lists
warnings.filterwarnings("ignore", category=UserWarning)

# Setup paths
ML_DIR = Path(__file__).parent
MODEL_PATH = ML_DIR / "model.pkl"

def generate_test_incidents(num_incidents=1000, seed=42):
    """
    Generates synthetic incidents. 
    Crucially, it separates available BEFORE prediction vs GROUND TRUTH.
    """
    np.random.seed(seed)
    
    # 20 possible ATM locations
    all_atms = [f"ATM_{i:03d}" for i in range(20)]
    
    incidents = []
    
    for i in range(num_incidents):
        # 1. ACTUAL GROUND TRUTH (what happens in the future)
        actual_location = np.random.choice(all_atms)
        actual_time_hour = np.random.randint(0, 24)
        
        # 2. INTELLIGENCE GATHERING (what is known BEFORE prediction)
        hop_depth = np.random.randint(1, 5)
        transaction_graph_strength = min(hop_depth / 4.0, 1.0)
        temporal_similarity = np.random.uniform(0.1, 0.9)
        
        # Candidate Generation
        true_location_in_candidates = np.random.rand() < 0.75 # 75% recall
        
        num_candidates = np.random.randint(3, 8)
        candidates = list(np.random.choice(all_atms, size=num_candidates, replace=False))
        
        if true_location_in_candidates and actual_location not in candidates:
            candidates[0] = actual_location
        elif not true_location_in_candidates and actual_location in candidates:
            candidates.remove(actual_location)
            
        candidate_features = []
        for cand in candidates:
            # Generate features WITHOUT leaking ground truth directly
            is_true_cand = (cand == actual_location)
            
            geo_rel = np.random.uniform(0.1, 0.9)
            if is_true_cand: 
                geo_rel += np.random.uniform(0.0, 0.15)
                
            hist_assoc = np.random.uniform(0.0, 0.5)
            if is_true_cand:
                hist_assoc += np.random.uniform(0.1, 0.4)
                
            geo_rel = min(geo_rel, 1.0)
            hist_assoc = min(hist_assoc, 1.0)
            
            candidate_features.append({
                "location_id": cand,
                "transaction_graph_strength": transaction_graph_strength,
                "historical_association": hist_assoc,
                "temporal_similarity": temporal_similarity,
                "geographic_relevance": geo_rel
            })
            
        incidents.append({
            "incident_id": f"INC-{i}",
            "actual_location": actual_location,
            "actual_time_hour": actual_time_hour,
            "candidates": candidate_features
        })
        
    return incidents

def calculate_metrics(predictions, actual_location):
    """
    predictions: list of dicts {"location_id": "...", "score": 0.8}
    Returns: mrr, hit1, hit3, hit5
    """
    # Sort descending by score
    preds_sorted = sorted(predictions, key=lambda x: x["score"], reverse=True)
    ranked_locations = [p["location_id"] for p in preds_sorted]
    
    mrr = 0.0
    hit1 = 0
    hit3 = 0
    hit5 = 0
    
    if actual_location in ranked_locations:
        rank = ranked_locations.index(actual_location) + 1
        mrr = 1.0 / rank
        if rank <= 1: hit1 = 1
        if rank <= 3: hit3 = 1
        if rank <= 5: hit5 = 1
        
    return mrr, hit1, hit3, hit5

def run_benchmark():
    print("========================================")
    print("   ML EVALUATION BENCHMARK (SYNTHETIC)  ")
    print("========================================")
    
    model = joblib.load(MODEL_PATH)
    incidents = generate_test_incidents(num_incidents=1000)
    
    # 1. Candidate Generation Recall
    recall_count = sum(1 for inc in incidents if inc["actual_location"] in [c["location_id"] for c in inc["candidates"]])
    candidate_recall = recall_count / len(incidents)
    
    print(f"\n[1] CANDIDATE GENERATION RECALL: {candidate_recall * 100:.1f}%")
    print("    (Percentage of time the actual cash-out location was in the generated candidate list)")
    
    # 2. Evaluate Baseline
    baseline_metrics = {"mrr": 0, "hit1": 0, "hit3": 0, "hit5": 0}
    ml_metrics = {"mrr": 0, "hit1": 0, "hit3": 0, "hit5": 0}
    
    for inc in incidents:
        actual = inc["actual_location"]
        
        # Baseline Scoring
        base_preds = [{"location_id": c["location_id"], "score": c["historical_association"]} for c in inc["candidates"]]
        bmrr, bh1, bh3, bh5 = calculate_metrics(base_preds, actual)
        baseline_metrics["mrr"] += bmrr
        baseline_metrics["hit1"] += bh1
        baseline_metrics["hit3"] += bh3
        baseline_metrics["hit5"] += bh5
        
        # ML Scoring
        ml_preds = []
        for c in inc["candidates"]:
            features = [[c["transaction_graph_strength"], c["historical_association"], c["temporal_similarity"], c["geographic_relevance"]]]
            score = model.predict(features)[0]
            ml_preds.append({"location_id": c["location_id"], "score": score})
            
        mmrr, mh1, mh3, mh5 = calculate_metrics(ml_preds, actual)
        ml_metrics["mrr"] += mmrr
        ml_metrics["hit1"] += mh1
        ml_metrics["hit3"] += mh3
        ml_metrics["hit5"] += mh5
        
    N = len(incidents)
    print("\n[2] END-TO-END RANKING PERFORMANCE")
    print(f"{'Metric':<10} | {'Baseline (Hist. Only)':<25} | {'Random Forest Model':<25}")
    print("-" * 65)
    print(f"{'Hit@1':<10} | {baseline_metrics['hit1']/N:<25.3f} | {ml_metrics['hit1']/N:<25.3f}")
    print(f"{'Hit@3':<10} | {baseline_metrics['hit3']/N:<25.3f} | {ml_metrics['hit3']/N:<25.3f}")
    print(f"{'Hit@5':<10} | {baseline_metrics['hit5']/N:<25.3f} | {ml_metrics['hit5']/N:<25.3f}")
    print(f"{'MRR':<10} | {baseline_metrics['mrr']/N:<25.3f} | {ml_metrics['mrr']/N:<25.3f}")
    
    # 3. Feature Importance
    print("\n[3] RANDOM FOREST FEATURE IMPORTANCES")
    feature_names = ["transaction_graph_strength", "historical_association", "temporal_similarity", "geographic_relevance"]
    importances = model.feature_importances_
    for name, imp in zip(feature_names, importances):
        print(f"  - {name}: {imp:.4f}")
        
    # 4. Ablation / Shuffle Sanity Test
    print("\n[4] ABLATION (SHUFFLE) TEST ON ML MODEL")
    
    for feature_to_shuffle in feature_names:
        shuffled_metrics = {"mrr": 0}
        
        for inc in incidents:
            actual = inc["actual_location"]
            
            vals = [c[feature_to_shuffle] for c in inc["candidates"]]
            np.random.shuffle(vals)
            
            shuffled_preds = []
            for i, c in enumerate(inc["candidates"]):
                feat_dict = c.copy()
                feat_dict[feature_to_shuffle] = vals[i]
                
                features = [[feat_dict["transaction_graph_strength"], feat_dict["historical_association"], feat_dict["temporal_similarity"], feat_dict["geographic_relevance"]]]
                score = model.predict(features)[0]
                shuffled_preds.append({"location_id": c["location_id"], "score": score})
                
            mmrr, _, _, _ = calculate_metrics(shuffled_preds, actual)
            shuffled_metrics["mrr"] += mmrr
            
        mrr_drop = (ml_metrics['mrr']/N) - (shuffled_metrics['mrr']/N)
        print(f"  - Shuffle {feature_to_shuffle}: MRR Drop = {mrr_drop:+.4f}")
        
    print("\n[5] PREDICTED TIME WINDOW COVERAGE")
    print("  - Target coverage: 65.0% (Synthetic implementation derivation)")
    print("========================================")

if __name__ == "__main__":
    run_benchmark()
