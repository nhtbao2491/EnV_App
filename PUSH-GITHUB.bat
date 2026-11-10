@echo off
chcp 65001 >nul
cd /d "%~dp0"
where git >nul 2>nul || (echo Chua cai Git: https://git-scm.com & pause & exit /b 1)
if exist .git (echo Thu muc nay da la repo Git. Hay dung UPDATE-GITHUB.bat & pause & exit /b 0)
set /p URL=Dan link repo GitHub (vd https://github.com/ten/listening-app.git): 
git init -b main
git add .
git commit -m "Ban dau"
git remote add origin %URL%
git push -u origin main
pause
