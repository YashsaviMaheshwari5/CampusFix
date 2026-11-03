@echo off
cd /d "%~dp0"
title CampusFix Student Portal (Port 5173)
echo Starting CampusFix Student Portal on port 5173...
call npm.cmd run dev
pause
