@echo off
cd /d "%~dp0"
title CampusFix Backend (Port 4000)
echo Starting CampusFix Backend on port 4000...
call npm.cmd run dev
pause

