import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.repositories.repository import Repository

client = TestClient(app)

# setup_db fixture is now inherited safely from conftest.py

def test_1_no_auth_header():
    response = client.post("/cases/CASE-A/analyze")
    assert response.status_code in [401, 403]

def test_2_x_user_role_citizen():
    response = client.post("/cases/CASE-A/analyze", headers={"X-User-Role": "citizen"})
    assert response.status_code in [401, 403]

def test_3_x_user_role_investigator():
    # This should fail now because X-User-Role is ignored, requires Bearer
    response = client.post("/cases/CASE-A/analyze", headers={"X-User-Role": "investigator"})
    assert response.status_code in [401, 403]

def test_4_invalid_role():
    response = client.post("/cases/CASE-A/analyze", headers={"X-User-Role": "admin"})
    assert response.status_code in [401, 403]

def test_5_proper_login():
    response = client.post("/auth/login", json={"email": "investigator@gmail.com", "password": "password123", "role": "investigator"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_6_valid_jwt_investigator():
    # Login as investigator
    res = client.post("/auth/login", json={"email": "investigator@gmail.com", "password": "password123", "role": "investigator"})
    token = res.json()["access_token"]
    
    # Analyze case (CASE-C is assigned to investigator@gmail.com)
    analyze_res = client.post("/cases/CASE-C/analyze", headers={"Authorization": f"Bearer {token}"})
    assert analyze_res.status_code == 200

def test_7_valid_jwt_police_forbidden():
    # Login as police
    res = client.post("/auth/login", json={"email": "police@gmail.com", "password": "password123", "role": "police"})
    token = res.json()["access_token"]
    
    # Analyze case (Should fail, requires investigator)
    analyze_res = client.post("/cases/CASE-C/analyze", headers={"Authorization": f"Bearer {token}"})
    assert analyze_res.status_code == 403

def test_8_manipulated_case_id():
    res = client.post("/auth/login", json={"email": "investigator@gmail.com", "password": "password123", "role": "investigator"})
    token = res.json()["access_token"]
    
    analyze_res = client.post("/cases/CASE-999/analyze", headers={"Authorization": f"Bearer {token}"})
    assert analyze_res.status_code in [403, 404]

def test_9_wrong_password():
    response = client.post("/auth/login", json={"email": "investigator@gmail.com", "password": "wrongpassword", "role": "investigator"})
    assert response.status_code == 401

def test_10_register_citizen():
    payload = {
        "full_name": "New Citizen",
        "phone": "9999999999",
        "email": "newcitizen@gmail.com",
        "password": "mypassword",
        "identity_type": "Aadhaar",
        "identity_number": "123456789012"
    }
    response = client.post("/citizens/register", json=payload)
    assert response.status_code == 200
    
    # Try to login with citizen
    login_response = client.post("/auth/login", json={"email": "newcitizen@gmail.com", "password": "mypassword", "role": "citizen"})
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_11_prediction_database_driven():
    # Login as investigator
    res = client.post("/auth/login", json={"email": "investigatora@gmail.com", "password": "password123", "role": "investigator"})
    token = res.json()["access_token"]
    
    # CASE-TEST is seeded in conftest setup_db -> seed_test_graph
    # It has a graph: ACC-101 -> ACC-205 -> ACC-301 -> ACC-CASH_OUT
    analyze_res = client.post("/cases/CASE-TEST/analyze", headers={"Authorization": f"Bearer {token}"})
    assert analyze_res.status_code == 200
    
    data = analyze_res.json()
    assert data["case_id"] == "CASE-TEST"
    assert data.get("status") != "INSUFFICIENT_DATA"
    
    preds = data["predictions"]
    assert len(preds) == 2 # TEST_ZONE_A and TEST_ZONE_B
    
    # Ensure they have features from DB
    for p in preds:
        assert p["location_id"] in ["LOC-TEST_ZONE_A", "LOC-TEST_ZONE_B"]
        assert "risk_score" in p
        feats = p["features"]
        assert feats["historical_association"] > 0
        assert feats["transaction_graph_strength"] > 0

    path = data.get("transaction_path", [])
    assert path == ["ACC-101", "ACC-205", "ACC-301", "ACC-CASH_OUT"]
    assert "ACC-GANESH" not in path
