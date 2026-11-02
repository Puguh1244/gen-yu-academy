@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Pasang Node.js versi 22.12 atau lebih baru terlebih dahulu.
 pause
 exit /b 1
)
node --env-file-if-exists=.env scripts/build.mjs
if errorlevel 1 (
 pause
 exit /b 1
)
echo Buka http://127.0.0.1:3000 di Google Chrome.
echo Biarkan jendela ini terbuka selama menggunakan website.
node --env-file-if-exists=.env server/index.js
pause
