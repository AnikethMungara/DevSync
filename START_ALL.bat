@echo off
echo Killing all existing Python and Node processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Starting DevSync IDE Backend (port 8787)...
start "DevSync Backend" cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8787 --reload"

timeout /t 3 >nul

echo.
echo Starting AI Agent Service (port 9001)...
start "AI Agent Service" cmd /c "cd /d %~dp0agent-service && python main.py"

timeout /t 3 >nul

echo.
echo Starting Frontend (port 3000)...
start "Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo All services starting...
echo Backend: http://localhost:8787
echo Agent:   http://localhost:9001
echo Frontend: http://localhost:3000
echo.
pause
