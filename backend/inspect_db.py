import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DIRECT_URL")
if not db_url:
    print("NO_DB_URL")
    sys.exit(0)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("--- TABLES ---")
        tables_res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).fetchall()
        for row in tables_res:
            print(row[0])
            
        print("--- COLUMNS AND CONSTRAINTS ---")
        uniq_res = conn.execute(text("""
            SELECT tc.table_name, tc.constraint_name, kcu.column_name 
            FROM information_schema.table_constraints tc 
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name 
            WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
        """)).fetchall()
        for row in uniq_res:
            print(f"UNIQUE: {row[0]}.{row[2]} ({row[1]})")

        print("--- FOREIGN KEYS ---")
        fk_res = conn.execute(text("""
            SELECT
                tc.table_name, kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY';
        """)).fetchall()
        for row in fk_res:
            print(f"FK: {row[0]}.{row[1]} -> {row[2]}.{row[3]}")
            
        print("--- INDEXES ---")
        idx_res = conn.execute(text("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'")).fetchall()
        for row in idx_res:
            print(f"INDEX: {row[0]} -> {row[1]}")
            
        print("--- COUNTS ---")
        for t in ['users', 'cases', 'locations', 'evidence', 'predictions', 'prediction_runs', 'accounts', 'transactions', 'prediction_candidates']:
            try:
                # We need a new connection/transaction block for each count to avoid aborted transactions killing the script
                with engine.connect() as conn2:
                    count = conn2.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
                    print(f"COUNT {t}: {count}")
            except Exception as e:
                pass
except Exception as e:
    print(f"CONNECTION_FAILED: {str(e)}")
