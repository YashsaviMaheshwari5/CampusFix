@echo off
cd /d "%~dp0"
title CampusFix Staff Portal (Port 5174)
echo Starting CampusFix Staff Portal on port 5174...
call npm.cmd run dev
pause

