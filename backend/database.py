import os
import time

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/legaldb")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db(max_attempts: int = 15, delay_seconds: int = 2):
    last_error = None
    for _ in range(max_attempts):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            # Auto-created tables do not add new columns to existing PostgreSQL tables,
            # so we patch forward the schema on startup for older local databases.
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE analyses ADD COLUMN IF NOT EXISTS safety_score INTEGER"))
                connection.execute(text("ALTER TABLE analyses ADD COLUMN IF NOT EXISTS contract_type VARCHAR(64)"))
            return
        except Exception as exc:
            last_error = exc
            time.sleep(delay_seconds)
    raise last_error


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
