@echo off
REM Start MySQL server
start /B "MySQL" "C:\tools\mysql\bin\mysqld" --datadir="C:\tools\mysql\data"
echo MySQL started on port 3306
echo Connect with: root / apple123
echo Database: apple_music
