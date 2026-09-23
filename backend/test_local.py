import os
os.environ["IS_TEST_ENV"] = "true"

def test_local_registration(test_client):
    response = test_client.post("/citizens/register", json={
        "full_name": "Brand New",
        "phone": "999999999",
        "email": "brandnew@gmail.com",
        "identity_type": "Aadhaar",
        "identity_number": "999"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "brandnew@gmail.com"
