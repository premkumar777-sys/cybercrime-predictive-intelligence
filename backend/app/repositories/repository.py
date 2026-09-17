import json
import threading
from datetime import datetime
from typing import Dict, List
from pathlib import Path
from ..schemas import Case, Transaction, Location


class Repository:
    def __init__(self, data_file: str = "data_store.json"):
        self._lock = threading.Lock()
        self.data_file = Path(data_file)
        self.cases: Dict[str, dict] = {}
        self.transactions: Dict[str, dict] = {}
        self.locations: Dict[str, dict] = {}
        self.predictions: Dict[str, dict] = {}
        self.users: Dict[str, dict] = {}
        self.citizen_profiles: Dict[str, dict] = {}

    def load(self):
        if self.data_file.exists():
            try:
                with open(self.data_file, "r") as f:
                    raw = json.load(f)
                    self.cases = raw.get("cases", {})
                    self.transactions = raw.get("transactions", {})
                    self.locations = raw.get("locations", {})
                    self.predictions = raw.get("predictions", {})
                    self.users = raw.get("users", {})
                    self.citizen_profiles = raw.get("citizen_profiles", {})
            except Exception:
                # ignore corrupt store
                pass

    def save(self):
        with self._lock:
            self.data_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.data_file, "w") as f:
                json.dump({
                    "cases": self.cases,
                    "transactions": self.transactions,
                    "locations": self.locations,
                    "predictions": self.predictions,
                    "users": self.users,
                    "citizen_profiles": self.citizen_profiles,
                }, f, default=str, indent=2)

    def create_case(self, case_data: dict) -> dict:
        case_id = f"CASE{len(self.cases) + 1:03d}"
        now = datetime.utcnow().isoformat()
        case = {
            "case_id": case_id,
            "fraud_type": case_data["fraud_type"],
            "amount": case_data["amount"],
            "transaction_time": case_data["transaction_time"],
            "destination_account": case_data["destination_account"],
            "status": "CREATED",
            "created_at": now,
        }
        self.cases[case_id] = case
        self.save()
        return case

    def list_cases(self) -> List[dict]:
        return list(self.cases.values())

    def get_case(self, case_id: str) -> dict:
        return self.cases.get(case_id)

    def add_prediction(self, case_id: str, prediction: dict):
        self.predictions[case_id] = prediction
        # mark case as analyzed
        if case_id in self.cases:
            self.cases[case_id]["status"] = "ANALYZED"
        self.save()

    def get_prediction(self, case_id: str):
        return self.predictions.get(case_id)

    def seed_users(self):
        """Seed only demo identities. Authentication must always look up a user here."""
        sample_users = [
            ("citizen@gmail.com", "citizen", "Demo Citizen"),
            ("police@gmail.com", "police", "Demo Police Officer"),
            ("investigator@gmail.com", "investigator", "Demo Investigator"),
        ]
        changed = False
        for email, role, name in sample_users:
            if email not in self.users:
                self.users[email] = {"email": email, "role": role, "name": name}
                changed = True
        if changed:
            self.save()

    def get_user(self, email: str):
        return self.users.get(email.lower())

    def register_citizen(self, profile: dict) -> tuple[dict, bool]:
        """Return the stored profile and whether it is an exact returning-citizen match."""
        email = profile["email"].lower()
        profile_key = "|".join((profile["full_name"].strip().lower(), email, profile["identity_type"], profile["identity_number"].strip()))
        existing = self.citizen_profiles.get(profile_key)
        if existing:
            exact_match = all(existing.get(key) == profile.get(key) for key in ("full_name", "email", "identity_type", "identity_number"))
            return existing, exact_match
        stored = {**profile, "email": email}
        self.citizen_profiles[profile_key] = stored
        self.save()
        return stored, False

    def seed_locations(self):
        # simple synthetic locations
        sample = [
            ("ATM001", "Central ATM", 12.9716, 77.5946),
            ("ATM002", "Mall ATM", 12.9750, 77.5920),
            ("ATM003", "Station ATM", 12.9650, 77.6000),
            ("ATM004", "Airport ATM", 12.9550, 77.6300),
            ("ATM005", "Market ATM", 12.9820, 77.6050),
        ]
        for lid, name, lat, lon in sample:
            self.locations[lid] = {
                "location_id": lid,
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "location_type": "ATM",
            }
        self.save()

    def seed_sample_cases(self):
        # no-op for now
        self.save()
