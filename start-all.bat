@echo off
title Apple Music - 启动中
cd /d "%~dp0"

:: Start MySQL
echo [1/3] Starting MySQL...
start /B "MySQL" "C:\tools\mysql\bin\mysqld" --datadir="C:\tools\mysql\data"
timeout /t 5 /nobreak >nul

:: Start Backend
echo [2/3] Starting Backend (port 4000)...
start /B "Backend" cmd /c "cd /d backend && node dist/app.js"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [3/3] Starting Frontend (port 3001)...
start /B "Frontend" cmd /c "cd /d frontend && node node_modules\next\dist\bin\next dev -p 3001"
timeout /t 15 /nobreak >nul

echo ========================================
echo All services started!
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:4000
echo MySQL:    localhost:3306 / root / 123456
echo ========================================
pause
