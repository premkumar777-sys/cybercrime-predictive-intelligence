"""
Script to seed the Supabase PostgreSQL database with initial data.
Run this once to populate users, locations, cases, and test graph.
"""
import os
import sys

# Load .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.repositories.repository import Repository

def main():
    print("Connecting to database:", os.environ.get("DIRECT_URL", "sqlite fallback"))
    
    print("\n1. Creating all tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    print("   Tables created OK.")
    
    db = SessionLocal()
    try:
        repo = Repository(db)
        
        print("\n2. Seeding locations...")
        repo.seed_locations()
        print("   Locations seeded OK.")
        
        print("\n3. Seeding users...")
        repo.seed_users()
        print("   Users seeded OK.")
        
        print("\n4. Seeding sample cases...")
        repo.seed_sample_cases()
        print("   Cases seeded OK.")
        
        print("\n5. Seeding test graph...")
        repo.seed_test_graph()
        print("   Test graph seeded OK.")
        
        print("\n✅ All seeding complete. Supabase DB is ready!")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
