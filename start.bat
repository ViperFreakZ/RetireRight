@echo off
title FutureLoop RPG — Startup
color 0A

echo.
echo  ======================================================
echo   FutureLoop RPG — Unified Startup Script
echo   Frontend (Vite) + Backend (Express)
echo  ======================================================
echo.

:: ─────────────────────────────────────────
:: 1. CHECK NODE.JS
:: ─────────────────────────────────────────
echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo        Found Node.js %NODE_VER%

:: ─────────────────────────────────────────
:: 2. CHECK NPM
:: ─────────────────────────────────────────
echo [2/6] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo        Found npm v%NPM_VER%
echo.

:: ─────────────────────────────────────────
:: 3. SET PROJECT ROOT
:: ─────────────────────────────────────────
set "PROJECT_ROOT=%~dp0"

:: ─────────────────────────────────────────
:: 4. INSTALL FRONTEND DEPENDENCIES
:: ─────────────────────────────────────────
echo [3/6] Setting up Frontend environment...
if not exist "%PROJECT_ROOT%frontend\node_modules\" (
    echo        Installing frontend dependencies...
    cd /d "%PROJECT_ROOT%frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Frontend npm install failed!
        pause
        exit /b 1
    )
    echo        Frontend dependencies installed successfully.
) else (
    echo        Frontend dependencies already installed. Skipping.
)
echo.

:: ─────────────────────────────────────────
:: 5. INSTALL BACKEND DEPENDENCIES
:: ─────────────────────────────────────────
echo [4/6] Setting up Backend environment...
if not exist "%PROJECT_ROOT%backend\node_modules\" (
    echo        Installing backend dependencies...
    cd /d "%PROJECT_ROOT%backend"
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Backend npm install failed!
        pause
        exit /b 1
    )
    echo        Backend dependencies installed successfully.
) else (
    echo        Backend dependencies already installed. Skipping.
)

:: Copy .env from .env.example if not exists
if not exist "%PROJECT_ROOT%backend\.env" (
    echo        Creating .env from .env.example...
    copy "%PROJECT_ROOT%backend\.env.example" "%PROJECT_ROOT%backend\.env" >nul
)
echo.

:: ─────────────────────────────────────────
:: 6. LAUNCH BOTH SERVICES
:: ─────────────────────────────────────────
echo [5/6] Starting Backend (Express) on port 3000...
start "FutureLoop Backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && title FutureLoop Backend [port 3000] && color 0B && echo. && echo  Backend starting... && echo. && npm run dev"

:: Wait a moment for backend to boot before frontend
timeout /t 3 /nobreak >nul

echo [6/6] Starting Frontend (Vite) on port 5173...
start "FutureLoop Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && title FutureLoop Frontend [port 5173] && color 0D && echo. && echo  Frontend starting... && echo. && npm run dev"

echo.
echo  ======================================================
echo   All services launched!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3000
echo   Health:    http://localhost:3000/api/health
echo  ======================================================
echo.
echo  Two new terminal windows have been opened.
echo  Close them to stop the servers.
echo.
timeout /t 5 /nobreak >nul
