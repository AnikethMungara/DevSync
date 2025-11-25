"""
DevSync Backend - FastAPI Implementation
Main application entry point
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
import asyncio
import sys
from pathlib import Path

from app.config import settings
from app.routers import files, execution, problems, projects, agent_proxy, git, search, collaboration, terminal, checkpoints, auth, yjs_collaboration
from app.database import Database
from app.utils.logger import setup_logger
from app.config.redis_config import redis_manager
from app.middleware.rate_limit import rate_limiter

# Fix for Windows asyncio subprocess issue
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Setup logging
logger = setup_logger(__name__)

# Database instance
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db

    # Startup
    logger.info("Starting DevSync backend")

    # Initialize Redis
    await redis_manager.connect()
    app.state.redis = redis_manager
    rate_limiter.redis_manager = redis_manager

    # Initialize database
    db = Database(settings.DATABASE_PATH)
    await db.initialize()
    app.state.db = db

    # Ensure workspace directory exists
    workspace_path = Path(settings.WORKSPACE_DIR)
    workspace_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Workspace directory: {workspace_path.absolute()}")

    # Start background task for cleanup
    async def cleanup_task():
        while True:
            await asyncio.sleep(3600)  # Run every hour
            await rate_limiter.cleanup_old_entries()
            logger.info("Cleaned up rate limiter entries")

    cleanup = asyncio.create_task(cleanup_task())

    yield

    # Shutdown
    logger.info("Shutting down DevSync backend")
    cleanup.cancel()
    if db:
        await db.close()
    await redis_manager.disconnect()


# Create FastAPI app
app = FastAPI(
    title="DevSync Backend",
    description="Backend API for DevSync collaborative IDE",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
# Allow both localhost and network IP for development
cors_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# In development, also allow all origins from local network
# This enables access from other devices on the same network
if settings.HOST == "0.0.0.0":
    # Allow any origin in development mode (when bound to 0.0.0.0)
    # For production, configure specific allowed origins
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(execution.router, prefix="/api/execution", tags=["execution"])
app.include_router(problems.router, prefix="/api/problems", tags=["problems"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(agent_proxy.router, prefix="/api/agent", tags=["agent"])
app.include_router(git.router, prefix="/api/git", tags=["git"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(collaboration.router, prefix="/api/collaboration", tags=["collaboration"])
app.include_router(yjs_collaboration.router, prefix="/api/collaboration", tags=["yjs-collaboration"])
app.include_router(terminal.router, prefix="/api/terminal", tags=["terminal"])
app.include_router(checkpoints.router, prefix="/api/checkpoints", tags=["checkpoints"])

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "2.0.0",
        "workspace": settings.WORKSPACE_DIR
    }


# WebSocket endpoint (for future real-time features)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for real-time updates"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
        log_level="info",
        loop="asyncio"  # Use asyncio loop (works with ProactorEventLoopPolicy on Windows)
    )
