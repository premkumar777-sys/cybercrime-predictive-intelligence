from pydantic import BaseModel
from typing import Optional

class CitizenRegistration(BaseModel):
    full_name: str
    phone: str
    email: str
    password: Optional[str] = "password123"
    identity_type: str
    identity_number: str

obj = CitizenRegistration(full_name="a", phone="1", email="a@b.com", identity_type="b", identity_number="c")
print(obj.dict())
