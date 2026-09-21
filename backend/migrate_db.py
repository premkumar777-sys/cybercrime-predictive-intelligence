import sys
from app.database import engine, Base
from app.models import PredictionModel, PredictionCandidateModel

def migrate():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    print("Done")

if __name__ == "__main__":
    migrate()
