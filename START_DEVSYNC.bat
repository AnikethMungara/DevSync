@echo off
echo ========================================
echo Starting DevSync Backend and Frontend
echo ========================================
echo.

REM Check if backend workspace exists
if not exist "backend\workspace" (
    echo Creating backend workspace directory...
    mkdir backend\workspace
)

REM Check if sample project exists
if not exist "backend\workspace\sample-project" (
    echo No sample project found. Creating one...
    node setup-test-project.js
    echo.
)

REM Start backend in new window
echo Starting Python FastAPI backend server...
start "DevSync Backend" cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8787 --reload"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend dev server...
start "DevSync Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo DevSync is starting!
echo ========================================
echo Backend: http://localhost:8787
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
