@echo off
echo Starting DevSync Python Backend...
cd /d "%~dp0"
python -m uvicorn main:app --host 0.0.0.0 --port 8787 --reload
