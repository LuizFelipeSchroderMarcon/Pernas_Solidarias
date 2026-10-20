Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Pernas Solidarias (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Inicia os microsservicos no Docker
docker compose up -d

Write-Host "Containers Docker iniciados com sucesso!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "Banco:    localhost:5432 (pernas_solidarias)" -ForegroundColor Gray
Write-Host "===================================================" -ForegroundColor Cyan
