from app.main import app
from fastapi.testclient import TestClient

with TestClient(app) as client:
    response = client.post("/citizens/register", json={
        "full_name": "Brand New",
        "phone": "999999999",
        "email": "brandnew@gmail.com",
        "identity_type": "Aadhaar",
        "identity_number": "999"
    })
    print(response.status_code)
    print(response.json())
