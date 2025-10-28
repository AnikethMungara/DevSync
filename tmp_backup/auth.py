from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError

# configure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# jwt settings
SECRET_KEY = "your-secret-key-keep-it-secret"  # move to config in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_password_hash(password: str) -> str:
    """hash a password for storing"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """verify a stored password against plaintext"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """create a jwt token with optional expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    """verify a jwt token and return payload if valid"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except InvalidTokenError:
        return None