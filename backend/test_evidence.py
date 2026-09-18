import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.repositories.repository import Repository
from app.services.storage_service import StorageService
import io

client = TestClient(app)

# setup_db fixture is now inherited safely from conftest.py

def get_token(email, password, role):
    response = client.post("/auth/login", json={"email": email, "password": password, "role": role})
    assert response.status_code == 200, f"Failed to login with {email}"
    return response.json()["access_token"]

# Valid test files (with magic numbers)
PDF_CONTENT = b"%PDF-1.4\n%...dummy content"
PNG_CONTENT = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...dummy"
JPG_CONTENT = b"\xFF\xD8\xFF\xE0\x00\x10JFIF...dummy"
MALICIOUS_EXE = b"MZ\x90\x00\x03\x00\x00\x00...dummy"
# Spoofed MIME test file
SPOOFED_CONTENT = b"MZ\x90\x00\x03\x00\x00\x00...dummy" # Claiming to be PDF

def test_1_unauthenticated_upload_denied():
    res = client.post(
        "/cases/CASE-A/evidence",
        files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")}
    )
    assert res.status_code in [401, 403]

def test_2_citizen_upload_to_own_case_allowed():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")}
    )
    assert res.status_code == 200
    assert "evidence_id" in res.json()

def test_3_citizen_upload_to_another_case_denied():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    res = client.post(
        "/cases/CASE-B/evidence", # CASE-B belongs to citizenb
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")}
    )
    assert res.status_code == 403

def test_4_list_evidence():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    res = client.get("/cases/CASE-A/evidence", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1

def test_5_download_evidence_idor_protection():
    # Citizen A uploaded evidence to CASE-A.
    # We will try to download it using Citizen B's token.
    token_a = get_token("citizena@gmail.com", "password123", "citizen")
    list_res = client.get("/cases/CASE-A/evidence", headers={"Authorization": f"Bearer {token_a}"})
    ev_id = list_res.json()[0]["evidence_id"]

    token_b = get_token("citizenb@gmail.com", "password123", "citizen")
    res = client.get(f"/cases/CASE-A/evidence/{ev_id}/download", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 403

def test_6_disallowed_file_type():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malware.exe", MALICIOUS_EXE, "application/x-msdownload")}
    )
    assert res.status_code == 415

def test_7_spoofed_mime_type():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    # Sending an EXE file but claiming it's a PDF
    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("fake.pdf", SPOOFED_CONTENT, "application/pdf")}
    )
    # Our manual magic number check should catch it
    assert res.status_code == 415
    assert "File signature does not match" in res.json()["detail"]

def test_8_file_size_limit():
    token = get_token("citizena@gmail.com", "password123", "citizen")
    # Generate 6MB file
    large_content = b"%PDF-1.4\n" + (b"0" * (6 * 1024 * 1024))
    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("large.pdf", large_content, "application/pdf")}
    )
    assert res.status_code == 413

def test_9_investigator_upload_denied_if_not_assigned():
    # investigator a tries to upload to case b
    token = get_token("investigatora@gmail.com", "password123", "investigator")
    res = client.post(
        "/cases/CASE-B/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.png", PNG_CONTENT, "image/png")}
    )
    assert res.status_code == 403

def test_10_upload_rollback_on_db_failure(monkeypatch):
    token = get_token("citizena@gmail.com", "password123", "citizen")
    
    # 1. Spy on StorageService.delete_evidence
    deleted_paths = []
    original_delete = StorageService.delete_evidence
    def mock_delete(self, path):
        deleted_paths.append(path)
        return original_delete(self, path)
        
    # 2. Mock Repository.add_evidence to raise an Exception (Simulate DB Failure)
    def mock_add_evidence(*args, **kwargs):
        raise Exception("Simulated DB Insert Failure")

    monkeypatch.setattr("app.services.storage_service.StorageService.delete_evidence", mock_delete)
    monkeypatch.setattr("app.repositories.repository.Repository.add_evidence", mock_add_evidence)

    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")}
    )
    
    # Should return a safe 5xx error
    assert res.status_code == 500
    assert "Upload rolled back" in res.json()["detail"]
    
    # Verify cleanup was called exactly once for the correct case
    assert len(deleted_paths) == 1
    assert deleted_paths[0].startswith("CASE-A/")

def test_11_rollback_failure_logging(monkeypatch, caplog):
    token = get_token("citizena@gmail.com", "password123", "citizen")
    
    def mock_add_evidence(*args, **kwargs):
        raise Exception("Simulated DB Insert Failure")
        
    def mock_delete_failure(self, path):
        raise Exception("Simulated Cleanup Failure")

    monkeypatch.setattr("app.repositories.repository.Repository.add_evidence", mock_add_evidence)
    monkeypatch.setattr("app.services.storage_service.StorageService.delete_evidence", mock_delete_failure)

    res = client.post(
        "/cases/CASE-A/evidence",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.pdf", PDF_CONTENT, "application/pdf")}
    )
    
    assert res.status_code == 500
    assert "Upload rolled back" in res.json()["detail"]
    
    # Verify the failure was logged safely for manual remediation
    assert any("CRITICAL: Orphaned evidence in storage: CASE-A/" in record.message for record in caplog.records)
    assert any("Cleanup failed: Simulated Cleanup Failure" in record.message for record in caplog.records)
