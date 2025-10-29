"""
TODO: Implement SQLAlchemy models for user authentication

Required features:
1. User model with fields:
   - id (primary key)
   - username (unique)
   - email (unique)
   - password (hashed)
   - is_active (boolean)
   - created_at (datetime)

2. Additional considerations:
   - Use SQLAlchemy declarative base
   - Add proper column types and constraints
   - Include indexes for performance
"""

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Index


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_users_username", "username"),
        Index("ix_users_email", "email"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} username={self.username!r} email={self.email!r}>"
