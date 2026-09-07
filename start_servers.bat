@echo off
title Chennai Municipal Solid Waste AI Platform Launcher
echo =========================================================================
echo   Automated Commercial Solid Waste Segregation Optimization Dashboard
echo   Municipal Recycling Plants - Greater Chennai Corporation (GCC)
echo =========================================================================
echo.
echo Starting FastAPI Backend on http://localhost:8000 ...
start "Chennai SWM Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Next.js Frontend on http://localhost:3000 ...
start "Chennai SWM Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo =========================================================================
echo   SERVICES LAUNCHED:
echo   - Frontend Website: http://localhost:3000
echo   - Backend REST API: http://localhost:8000/api
echo   - Interactive Docs: http://localhost:8000/docs
echo =========================================================================
echo Both services are now running in separate console windows.
pause