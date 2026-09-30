import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if os.getenv("TESTING") == "True":
        DATABASE_URL = "sqlite:///:memory:"
    else:
        # We must explicitly fail if PostgreSQL URL is missing rather than falling back to SQLite
        raise ValueError("DATABASE_URL environment variable is not set. A PostgreSQL database is required.")

# SQLAlchemy expects 'postgresql://' instead of 'postgres://' (which some hosts provide)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
