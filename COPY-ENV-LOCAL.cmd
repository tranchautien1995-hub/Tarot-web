@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if exist ".env.local" (
  echo .env.local da co san trong Tarot-1.1.
  pause
  exit /b 0
)

for %%D in ("..\tarot-practice-v2.34.3" "..\tarot-practice-v2.34.2" "..\tarot-practice-v2.34.1" "..\tarot-practice-v2.34" "..\tarot-practice-v2.33") do (
  if exist "%%~fD\.env.local" (
    copy /Y "%%~fD\.env.local" ".env.local" >nul
    echo Da copy .env.local tu %%~fD
    pause
    exit /b 0
  )
)

echo Khong tim thay .env.local trong cac thu muc ban cu ben canh.
echo Hay copy file .env.local hien co cua ban vao thu muc Tarot-1.1.
pause
