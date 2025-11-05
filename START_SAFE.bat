@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Starting DevSync (File Explorer Only)
echo AI Agent disabled until system reboot
echo ========================================
echo.

REM Kill any existing processes first
echo Cleaning up existing processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check if backend workspace exists
if not exist "backend\workspace" (
    echo Creating backend workspace directory...
    mkdir backend\workspace
)

REM Temporarily disable agent proxy in main.py
echo Disabling AI agent proxy temporarily...
powershell -Command "(Get-Content backend\main.py) -replace '^from app.routers import files, execution, problems, projects, agent_proxy', '# Agent disabled\nfrom app.routers import files, execution, problems, projects' | Set-Content backend\main.py.tmp"
powershell -Command "(Get-Content backend\main.py.tmp) -replace '^app.include_router\(agent_proxy.router', '# app.include_router(agent_proxy.router' | Set-Content backend\main.py.tmp"
move /Y backend\main.py.tmp backend\main.py >nul

REM Start backend
echo Starting Python FastAPI backend server...
start "DevSync Backend [DO NOT CLOSE]" cmd /c "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8787 --reload"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend dev server...
start "DevSync Frontend [DO NOT CLOSE]" cmd /c "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo DevSync is running (Safe Mode)
echo ========================================
echo Backend:  http://localhost:8787
echo Frontend: http://localhost:3000
echo.
echo AI Agent: DISABLED (requires system reboot)
echo File Explorer: WORKING
echo Code Execution: WORKING
echo.
echo Two windows have opened (Backend and Frontend).
echo To stop servers: Close both windows or type "end" here.
echo ========================================
echo.

:wait_for_input
set /p user_input="> "
if /i "%user_input%"=="end" (
    echo.
    echo Stopping all servers...
    taskkill /F /IM python.exe >nul 2>&1
    taskkill /F /IM node.exe >nul 2>&1
    echo All servers stopped.
    timeout /t 1 /nobreak >nul
    exit /b 0
)
echo Invalid input. Type "end" to stop servers.
goto wait_for_input
