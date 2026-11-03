@echo off
cd /d "%~dp0"
echo ========================================================
echo   Launching CampusFix Ecosystem
echo   1. Backend API (Port 4000)
echo   2. Student Portal (Port 5173)
echo   3. Staff Portal (Port 5174)
echo ========================================================

start "CampusFix Backend" cmd /c "cd /d "%~dp0backend" && start-backend.bat"
start "CampusFix Student Portal" cmd /c "cd /d "%~dp0frontend" && start-student-portal.bat"
start "CampusFix Staff Portal" cmd /c "cd /d "%~dp0staff-portal" && start-staff-portal.bat"

echo All three servers have been launched in separate windows!
timeout /t 3 /nobreak >nul
start http://localhost:5173
start http://localhost:5174

