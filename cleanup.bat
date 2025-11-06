@echo off
REM DevSync Cleanup Script
REM Removes unnecessary files from the repository

echo.
echo ========================================
echo   DevSync Cleanup Script
echo ========================================
echo.
echo This script will remove:
echo   - Redundant documentation files
echo   - Old startup scripts
echo   - Development database files
echo   - Duplicate configuration files
echo.
echo Files to be removed:
echo   1. AGENT_INTEGRATION_SUMMARY.md
echo   2. AI_AGENT_IMPLEMENTATION.md
echo   3. PROCESS_MANAGEMENT.md
echo   4. .env.example (root - duplicate)
echo   5. START_ALL.bat
echo   6. START_SAFE.bat
echo   7. backend/database.db
echo   8. agent-service/database.db
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Removing files...

REM Remove redundant documentation
if exist "AGENT_INTEGRATION_SUMMARY.md" (
    del "AGENT_INTEGRATION_SUMMARY.md"
    echo   - Removed AGENT_INTEGRATION_SUMMARY.md
)

if exist "AI_AGENT_IMPLEMENTATION.md" (
    del "AI_AGENT_IMPLEMENTATION.md"
    echo   - Removed AI_AGENT_IMPLEMENTATION.md
)

if exist "PROCESS_MANAGEMENT.md" (
    del "PROCESS_MANAGEMENT.md"
    echo   - Removed PROCESS_MANAGEMENT.md
)

if exist ".env.example" (
    del ".env.example"
    echo   - Removed .env.example (duplicate)
)

REM Remove redundant startup scripts
if exist "START_ALL.bat" (
    del "START_ALL.bat"
    echo   - Removed START_ALL.bat
)

if exist "START_SAFE.bat" (
    del "START_SAFE.bat"
    echo   - Removed START_SAFE.bat
)

REM Remove development databases
if exist "backend\database.db" (
    del "backend\database.db"
    echo   - Removed backend/database.db
)

if exist "agent-service\database.db" (
    del "agent-service\database.db"
    echo   - Removed agent-service/database.db
)

echo.
echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo Removed 8 unnecessary files.
echo.
echo Your repository is now cleaner!
echo Databases will be recreated automatically when you start DevSync.
echo.
pause
