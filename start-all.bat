@echo off
cd /d "%~dp0"
echo ========================================================
echo   Launching CampusFix Ecosystem
echo   1. Backend API (Port 4000) - Connected to MongoDB
echo   2. Student Portal (Port 5173)
echo   3. Staff Portal (Port 5174)
echo ========================================================

start "CampusFix Backend (Port 4000)" cmd /k "cd /d ""%~dp0backend"" && call npm.cmd run dev"
start "CampusFix Student Portal (Port 5173)" cmd /k "cd /d ""%~dp0frontend"" && call npm.cmd run dev"
start "CampusFix Staff Portal (Port 5174)" cmd /k "cd /d ""%~dp0staff-portal"" && call npm.cmd run dev"

echo All three servers are launching in separate command windows.
timeout /t 3 /nobreak >nul
start http://localhost:5173
start http://localhost:5174

