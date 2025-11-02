#!/bin/bash
echo "Starting DevSync Python Backend..."
cd "$(dirname "$0")"
python -m uvicorn main:app --host 0.0.0.0 --port 8787 --reload
