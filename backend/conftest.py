import os
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# 1. Enforce IS_TEST_ENV immediately
os.environ["IS_TEST_ENV"] = "true"

from app.database import Base, get_db
from app.main import app
from app.repositories.repository import Repository
from fastapi.testclient import TestClient

# 2. Create isolated SQLite test database
engine = create_engine(
    "sqlite:///:memory:", 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Override FastAPI dependencies
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def test_client():
    return TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # 4. Perform setup strictly against the in-memory engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    repo = Repository(db)
    repo.seed_users()
    repo.seed_locations()
    repo.seed_sample_cases()
    repo.seed_test_graph()
    db.close()
    yield
