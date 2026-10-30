@echo off
title Pernas Solidarias - Dev Server
echo ===================================================
echo   Iniciando Pernas Solidarias (Backend + Frontend)
echo ===================================================
echo.

REM Inicia o Backend em uma nova janela
start "Pernas Solidarias - Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

REM Inicia o Frontend em uma nova janela
start "Pernas Solidarias - Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Backend e Frontend iniciados em janelas separadas.
echo Backend:  http://localhost:3000 (ou porta definida no .env)
echo Frontend: http://localhost:5173
echo ===================================================
