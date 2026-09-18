import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.repositories.repository import Repository

client = TestClient(app)

# setup_db fixture is now inherited safely from conftest.py

def get_token(email, password, role):
    response = client.post("/auth/login", json={"email": email, "password": password, "role": role})
    assert response.status_code == 200, f"Failed to login with {email}"
    return response.json()["access_token"]

def test_idor_investigator_access():
    token_a = get_token("investigatora@gmail.com", "password123", "investigator")
    token_b = get_token("investigatorb@gmail.com", "password123", "investigator")
    
    # Investigator A -> CASE-A (PASS)
    res = client.get("/cases/CASE-A", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    
    # Investigator B -> CASE-B (PASS)
    res = client.get("/cases/CASE-B", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 200
    
    # Investigator A -> CASE-B (FAIL)
    res = client.get("/cases/CASE-B", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 403

def test_idor_citizen_access():
    token_cit_a = get_token("citizena@gmail.com", "password123", "citizen")
    token_cit_b = get_token("citizenb@gmail.com", "password123", "citizen")
    
    # Citizen A -> CASE-A (PASS)
    res = client.get("/cases/CASE-A", headers={"Authorization": f"Bearer {token_cit_a}"})
    assert res.status_code == 200
    
    # Citizen A -> CASE-B (FAIL)
    res = client.get("/cases/CASE-B", headers={"Authorization": f"Bearer {token_cit_a}"})
    assert res.status_code == 403
    
    # Citizen B -> CASE-A (FAIL)
    res = client.get("/cases/CASE-A", headers={"Authorization": f"Bearer {token_cit_b}"})
    assert res.status_code == 403

def test_idor_related_resources():
    token_a = get_token("investigatora@gmail.com", "password123", "investigator")
    token_b = get_token("investigatorb@gmail.com", "password123", "investigator")
    
    # Trigger prediction for CASE-A as Investigator A
    client.post("/cases/CASE-A/analyze", headers={"Authorization": f"Bearer {token_a}"})
    
    # Investigator A gets predictions (PASS)
    res = client.get("/cases/CASE-A/predictions", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    
    # Investigator B tries to get CASE-A predictions (FAIL)
    res = client.get("/cases/CASE-A/predictions", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 403

def test_list_cases_isolation():
    token_cit_a = get_token("citizena@gmail.com", "password123", "citizen")
    
    # Citizen A should only see their own cases (CASE-A and CASE-E)
    res = client.get("/cases", headers={"Authorization": f"Bearer {token_cit_a}"})
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) == 2
    assert all(c["case_id"] in ["CASE-A", "CASE-E"] for c in cases)

def test_unauthenticated_access_denied():
    res = client.get("/cases")
    assert res.status_code in [401, 403]
    
    res = client.get("/cases/CASE-A")
    assert res.status_code in [401, 403]
