import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

load_dotenv()

default_sqlite_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'cybercrime.db')}"

if os.environ.get("IS_TEST_ENV") == "true":
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    target_url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL") or default_sqlite_url
    if target_url.startswith("sqlite"):
        SQLALCHEMY_DATABASE_URL = target_url
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        try:
            temp_engine = create_engine(target_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with temp_engine.connect() as conn:
                pass
            SQLALCHEMY_DATABASE_URL = target_url
            engine = temp_engine
        except Exception as e:
            print(f"[Database] Remote DB unreachable ({e}). Falling back to local SQLite.")
            SQLALCHEMY_DATABASE_URL = default_sqlite_url
            engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
