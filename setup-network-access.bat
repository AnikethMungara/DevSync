@echo off
REM Setup script for network access to DevSync
REM This script helps configure DevSync for access from other devices

echo.
echo ========================================
echo   DevSync Network Access Setup
echo ========================================
echo.

REM Get local IP address
echo Detecting your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)

:found
REM Trim leading spaces
for /f "tokens=* delims= " %%a in ("%IP%") do set IP=%%a

echo.
echo Your computer's IP address is: %IP%
echo.
echo This IP will be used to configure DevSync for network access.
echo Other devices on your network can access DevSync at:
echo   Frontend: http://%IP%:3000
echo   Backend:  http://%IP%:8787
echo.

pause

echo.
echo Updating configuration files...
echo.

REM Update backend .env
echo Updating backend/.env...
(
    echo # Server Settings
    echo PORT=8787
    echo HOST=0.0.0.0
    echo FRONTEND_URL=http://%IP%:3000
    echo.
    echo # Workspace Settings
    echo WORKSPACE_DIR=workspace
    echo WRITE_DEBOUNCE_MS=300
    echo.
    echo # Database Settings
    echo DATABASE_PATH=database.db
    echo.
    echo # Execution Settings
    echo EXECUTION_TIMEOUT=30
    echo MAX_OUTPUT_SIZE=1048576
    echo.
    echo # Logging
    echo LOG_LEVEL=INFO
    echo.
    echo # AI Agent Settings
    echo AI_PROVIDER=openai
    echo AI_MODEL=gpt-4o-mini
    echo ALLOWED_MODELS=gpt-4o-mini,gpt-4o,claude-3-5-sonnet-20241022,gemini-1.5-pro
    echo.
    echo # API Keys - REPLACE WITH YOUR ACTUAL KEYS
    echo OPENAI_API_KEY=sk-proj-your-openai-key-here
    echo ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
    echo GOOGLE_API_KEY=your-google-ai-key-here
    echo.
    echo # Agent Limits
    echo AGENT_MAX_TOKENS=2000
    echo AGENT_MAX_RUN_SECONDS=60
    echo AGENT_MAX_OUTPUT_CHARS=200000
    echo AGENT_RATE_RPS=2
    echo AGENT_ALLOW_TOOLS=fs,exec,http,search
    echo.
    echo # Sandbox Settings
    echo WORKSPACE_ROOT=./workspace
    echo DISABLE_NETWORK=false
) > backend\.env

REM Create frontend .env.local
echo Creating frontend/.env.local...
(
    echo # Frontend environment variables for network access
    echo NEXT_PUBLIC_BACKEND_URL=http://%IP%:8787
) > frontend\.env.local

REM Update package.json to allow network access
echo Updating frontend/package.json...
powershell -Command "(Get-Content frontend\package.json) -replace '\"dev\": \"next dev\"', '\"dev\": \"next dev -H 0.0.0.0\"' | Set-Content frontend\package.json"

echo.
echo ========================================
echo   Configuration Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Configure Windows Firewall (if needed)
echo   2. Restart DevSync servers
echo   3. Access from other devices at: http://%IP%:3000
echo.
echo Would you like to add firewall rules? (Requires Administrator)
echo.

pause

echo.
echo Adding Windows Firewall rules...
echo (You may see a UAC prompt - click Yes)
echo.

REM Add firewall rules (requires admin)
netsh advfirewall firewall add rule name="DevSync Frontend" dir=in action=allow protocol=TCP localport=3000 2>nul
netsh advfirewall firewall add rule name="DevSync Backend" dir=in action=allow protocol=TCP localport=8787 2>nul
netsh advfirewall firewall add rule name="DevSync Agent" dir=in action=allow protocol=TCP localport=9001 2>nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Firewall rules added successfully!
) else (
    echo.
    echo Note: Failed to add firewall rules automatically.
    echo You may need to run this script as Administrator,
    echo or manually add firewall rules for ports 3000, 8787, and 9001.
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Configuration Summary:
echo   - Your IP: %IP%
echo   - Frontend URL: http://%IP%:3000
echo   - Backend URL: http://%IP%:8787
echo.
echo Access DevSync from other devices:
echo   1. Connect to the same Wi-Fi network
echo   2. Open browser and go to: http://%IP%:3000
echo.
echo To start DevSync, run: START.bat
echo.
pause
