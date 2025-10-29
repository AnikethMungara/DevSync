"""
Authentication utilities: password hashing (bcrypt) and JWT handling.

Notes:
- Secrets and expirations are pulled from config if available, otherwise env vars
  (JWT_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES) with safe defaults.
- Optimized for straightforward, fast usage with minimal dependencies.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt

try:  # Prefer central config if present
    from ..core.config import settings  # type: ignore
except Exception:  # Fallback if settings is unavailable during tooling
    settings = None  # type: ignore


# Configuration with sensible fallbacks
JWT_ALGORITHM = "HS256"
SECRET_KEY: str = (
    (getattr(settings, "JWT_SECRET_KEY", None) if settings is not None else None)
    or os.environ.get("JWT_SECRET_KEY")
    or os.environ.get("SECRET_KEY")
    or "change-me"
)
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    (getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", None) if settings is not None else None)
    or os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)


# Password hashing utilities (bcrypt)
def get_password_hash(password: str) -> str:
    if not isinstance(password, str) or not password:
        raise ValueError("Password must be a non-empty string")
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# JWT token utilities
def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    *,
    secret_key: Optional[str] = None,
    algorithm: str = JWT_ALGORITHM,
) -> str:
    if not isinstance(data, dict):
        raise ValueError("data must be a dict")
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta is not None else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    key = secret_key or SECRET_KEY
    token = jwt.encode(to_encode, key, algorithm=algorithm)
    return token


def decode_token(
    token: str,
    *,
    secret_key: Optional[str] = None,
    algorithms: Optional[list[str]] = None,
) -> Dict[str, Any]:
    if not token:
        raise ValueError("token must be provided")
    key = secret_key or SECRET_KEY
    algs = algorithms or [JWT_ALGORITHM]
    payload = jwt.decode(token, key, algorithms=algs)
    return payload


def is_token_valid(token: str, *, secret_key: Optional[str] = None) -> bool:
    try:
        decode_token(token, secret_key=secret_key)
        return True
    except jwt.ExpiredSignatureError:
        return False
    except jwt.InvalidTokenError:
        return False


__all__ = [
    "get_password_hash",
    "verify_password",
    "create_access_token",
    "decode_token",
    "is_token_valid",
    "JWT_ALGORITHM",
    "SECRET_KEY",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
]
