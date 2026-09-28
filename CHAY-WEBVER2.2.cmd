@echo off
title WebVer2.2 Full
cd /d "%~dp0"
if not exist node_modules (
  echo Dang cai thu vien lan dau...
  call npm install
  if errorlevel 1 goto :error
)
echo WebVer2.2 dang chay tai http://localhost:3000
call npm run dev
goto :eof

:error
echo Khong the khoi dong website. Hay kiem tra Node.js va ket noi mang.
pause
