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
from app.routers import files, execution, problems, projects, agent_proxy, git, search
from app.database import Database
from app.utils.logger import setup_logger

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

    # Initialize database
    db = Database(settings.DATABASE_PATH)
    await db.initialize()
    app.state.db = db

    # Ensure workspace directory exists
    workspace_path = Path(settings.WORKSPACE_DIR)
    workspace_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Workspace directory: {workspace_path.absolute()}")

    yield

    # Shutdown
    logger.info("Shutting down DevSync backend")
    if db:
        await db.close()


# Create FastAPI app
app = FastAPI(
    title="DevSync Backend",
    description="Backend API for DevSync collaborative IDE",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(execution.router, prefix="/api/execution", tags=["execution"])
app.include_router(problems.router, prefix="/api/problems", tags=["problems"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(agent_proxy.router, prefix="/api/agent", tags=["agent"])
app.include_router(git.router, prefix="/api/git", tags=["git"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

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
