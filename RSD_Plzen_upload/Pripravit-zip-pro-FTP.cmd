@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Priprava RSD_Plzen_upload.zip (Quartz build + slozka pro MONSTA)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pack-for-ftp.ps1"
if errorlevel 1 (
  echo.
  echo Build selhal — zkontroluj vystup vyse.
  pause
  exit /b 1
)
echo.
echo Hotovo. Soubor: %~dp0RSD_Plzen_upload.zip
echo Ten rozbal a obsah nahraj do MONSTA (/data/rsd_web).
pause
exit /b 0
