from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# use sqlite for simplicity
SQLALCHEMY_DATABASE_URL = "sqlite:///./devsync.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """dependency to get db session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()