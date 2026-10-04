@echo off
title POS Restaurant - All-in-One Production Server
chcp 65001 >nul

echo =========================================================================
echo        KHOI DONG HE THONG POS RESTAURANT [1 CUA SO CMD DUY NHAT]
echo =========================================================================
echo.

set ROOT_DIR=%~dp0

set NEED_BUILD=0
if not exist "%ROOT_DIR%frontend\build\index.html" set NEED_BUILD=1
if not exist "%ROOT_DIR%admin-frontend\build\index.html" set NEED_BUILD=1
if "%1"=="--build" set NEED_BUILD=1
if "%1"=="build" set NEED_BUILD=1

if "%NEED_BUILD%"=="0" goto :START_SERVICES

echo [THONG BAO] Phat hien chua co ban build hoac co yeu cau build lai.
echo Dang tien hanh dong goi Production (Frontend, Admin)...
cd /d "%ROOT_DIR%"
call npm run build
if errorlevel 1 goto :BUILD_ERROR
echo [OK] Da dong goi Production thanh cong!
echo.
goto :START_SERVICES

:BUILD_ERROR
echo [LOI] Dong goi build that bai! Vui long kiem tra lai.
pause
exit /b 1

:START_SERVICES
cd /d "%ROOT_DIR%"
set NODE_ENV=production
call npm run start:prod
