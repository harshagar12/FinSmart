import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use Postgres if provided (Supabase), otherwise fallback to local SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./simulator.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Avoid blocking startup indefinitely when remote DB is unreachable.
    engine_kwargs["connect_args"] = {"connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "10"))}
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """Safe incremental migrations — adds new columns/tables without destroying data."""
    with engine.connect() as conn:
        is_pg = not DATABASE_URL.startswith("sqlite")
        # Add avg_cost_at_sale column to transactions if it doesn't exist
        try:
            if is_pg:
                conn.execute(text(
                    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS avg_cost_at_sale FLOAT"
                ))
            else:
                # SQLite doesn't support IF NOT EXISTS on ALTER TABLE
                cols = [r[1] for r in conn.execute(text("PRAGMA table_info(transactions)")).fetchall()]
                if "avg_cost_at_sale" not in cols:
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN avg_cost_at_sale FLOAT"))
            conn.commit()
        except Exception:
            conn.rollback()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
