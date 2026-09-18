import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# We use the transaction pooler URL for general connections (psycopg2 works fine if prepared statements are handled correctly)
# SQLAlchemy's default behavior might conflict with PgBouncer in transaction mode if pool_pre_ping is true and statement caching is used.
# Since Supabase provides session mode on port 5432, we can just use DIRECT_URL to avoid issues, or configure for pgbouncer.
# Let's just use DIRECT_URL for simplicity in the hackathon to avoid prepared statement issues.
# HARD REQUIREMENT: LIVE DATABASE PROTECTION
# Prevent test suite from silently inheriting DIRECT_URL and wiping the production DB.
if os.environ.get("IS_TEST_ENV") == "true":
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    SQLALCHEMY_DATABASE_URL = os.environ.get("DIRECT_URL") or f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'cybercrime.db')}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
