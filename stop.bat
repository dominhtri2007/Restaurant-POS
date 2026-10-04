@echo off
title POS Restaurant - Stop All Services
chcp 65001 >nul

cd /d "%~dp0"
node scripts/stop-services.js
timeout /t 2 >nul
