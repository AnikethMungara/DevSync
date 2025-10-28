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

# TODO: Add User model class here