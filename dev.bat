@echo off
title Pernas Solidarias - Dev Server
echo ===================================================
echo   Iniciando Pernas Solidarias (Backend + Frontend)
echo ===================================================
echo.

REM Inicia os containers via Docker Compose
docker compose up -d

echo Containers Docker iniciados com sucesso!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo Banco:    localhost:5432 (pernas_solidarias)
echo ===================================================
