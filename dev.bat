@echo off
title POS Restaurant - All-in-One Development Server
chcp 65001 >nul

echo =========================================================================
echo        KHOI DONG CHE DO PHAT TRIEN [1 CUA SO CMD DUY NHAT]
echo =========================================================================
echo  1. Backend API (Nodemon):       http://localhost:5000  [Nhan: BACKEND - Xanh]
echo  2. Web Order Khach Hang (Dev):  http://localhost:3000  [Nhan: ORDER - Xanh la]
echo  3. Web Admin POS (Dev):         http://localhost:3001  [Nhan: ADMIN - Tim hong]
echo =========================================================================
echo  * Ca 3 dich vu duoc gom chay trong dung 1 CUA SO CMD NAY.
echo  * Nhan to hop phim [Ctrl + C] de dung tat ca dich vu cung mot luc.
echo =========================================================================
echo.

cd /d "%~dp0"
call npm run dev
