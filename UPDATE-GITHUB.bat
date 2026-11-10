@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p MSG=Noi dung thay doi: 
if "%MSG%"=="" set MSG=Cap nhat
git add .
git commit -m "%MSG%"
git push
echo.
set /p REL=Phat hanh ban .exe moi? Nhap so phien ban (vd 1.0.1) hoac Enter de bo qua: 
if "%REL%"=="" goto end
call npm version %REL% --no-git-tag-version
git add package.json
git commit -m "v%REL%"
git tag v%REL%
git push
git push origin v%REL%
:end
pause
