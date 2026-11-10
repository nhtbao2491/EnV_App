@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Dong goi EnV thanh .exe ===
where node >nul 2>nul || (echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi chay lai. & pause & exit /b 1)
echo [1/2] Cai thu vien (can Internet lan dau)...
call npm install || (echo npm install loi. & pause & exit /b 1)
echo [2/2] Dong goi .exe...
call npm run dist || (echo Dong goi loi. & pause & exit /b 1)
echo.
echo XONG! File .exe nam trong thu muc dist\
start "" "%~dp0dist"
pause
