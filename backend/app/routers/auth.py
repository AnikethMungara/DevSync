"""
Authentication router for user login and token management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
import hashlib
import uuid
from datetime import datetime

from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
    TokenResponse,
    TokenData,
    UserCredentials,
)
from app.middleware.rate_limit import rate_limiter

router = APIRouter()


# Simple in-memory user store (replace with database in production)
USERS_DB = {
    "demo": {
        "user_id": "user_001",
        "username": "demo",
        "email": "demo@devsync.local",
        "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),  # Simple hash - use bcrypt in production
        "created_at": datetime.utcnow().isoformat(),
    },
    "alice": {
        "user_id": "user_002",
        "username": "alice",
        "email": "alice@devsync.local",
        "password_hash": hashlib.sha256("alice123".encode()).hexdigest(),
        "created_at": datetime.utcnow().isoformat(),
    },
    "bob": {
        "user_id": "user_003",
        "username": "bob",
        "email": "bob@devsync.local",
        "password_hash": hashlib.sha256("bob123".encode()).hexdigest(),
        "created_at": datetime.utcnow().isoformat(),
    },
}


class RegisterRequest(BaseModel):
    """User registration request"""
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User profile response"""
    user_id: str
    username: str
    email: str
    created_at: str


def hash_password(password: str) -> str:
    """Hash password (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserCredentials):
    """
    Login endpoint - exchange credentials for JWT tokens

    Returns access and refresh tokens for authenticated users
    """
    # Rate limit login attempts
    allowed, error = await rate_limiter.check_rate_limit(
        credentials.username,
        limit_type="auth"
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=error
        )

    # Find user
    user = USERS_DB.get(credentials.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Create tokens
    token_data = {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=60 * 24  # 24 hours in minutes
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register new user endpoint

    Creates a new user account with hashed password
    """
    # Check if user already exists
    if request.username in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Create new user
    user_id = f"user_{str(uuid.uuid4())[:8]}"
    USERS_DB[request.username] = {
        "user_id": user_id,
        "username": request.username,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "created_at": datetime.utcnow().isoformat(),
    }

    return UserResponse(
        user_id=user_id,
        username=request.username,
        email=request.email,
        created_at=USERS_DB[request.username]["created_at"]
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token

    Generates a new access token without requiring re-authentication
    """
    # Verify refresh token
    token_data = verify_token(refresh_token)

    # Create new access token
    new_access_token = create_access_token({
        "user_id": token_data.user_id,
        "username": token_data.username,
        "email": token_data.email,
    })

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=refresh_token,  # Keep same refresh token
        token_type="bearer",
        expires_in=60 * 24
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: TokenData = Depends(get_current_user)):
    """
    Get current authenticated user profile

    Requires valid JWT token in Authorization header
    """
    # Find user in database
    user = next(
        (u for u in USERS_DB.values() if u["user_id"] == current_user.user_id),
        None
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(
        user_id=user["user_id"],
        username=user["username"],
        email=user["email"],
        created_at=user["created_at"]
    )


@router.post("/logout")
async def logout(current_user: TokenData = Depends(get_current_user)):
    """
    Logout endpoint (token invalidation)

    In production, add tokens to a blacklist in Redis
    """
    # TODO: Add token to Redis blacklist
    # await redis_manager.set_cache(f"blacklist:{token}", "1", expire=token_expiry)

    return {"message": "Successfully logged out"}


@router.get("/verify-token")
async def verify_user_token(current_user: TokenData = Depends(get_current_user)):
    """
    Verify if token is valid

    Returns token payload if valid, 401 if not
    """
    return {
        "valid": True,
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
    }
