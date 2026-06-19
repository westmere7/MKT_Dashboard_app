@echo off
setlocal
title RMIT Marketing Dashboard - dev server

REM Launches the dashboard dev server from this folder.
cd /d "%~dp0"

set "PORT=5173"

if not exist "node_modules" (
  echo Installing dependencies ^(first run only, may take a minute^)...
  call npm install
)

echo.
echo   Dashboard:  http://localhost:%PORT%/
echo   Config:     http://localhost:%PORT%/admin
echo.
echo   Press Ctrl+C in this window to stop the server.
echo.

REM open the browser a few seconds after the server starts
start "" cmd /c "timeout /t 4 >nul & start "" http://localhost:%PORT%/"

call npm run dev -- --port %PORT% --host

endlocal
