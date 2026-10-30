Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Pernas Solidarias (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Inicia o Backend em um novo processo do PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$rootDir\backend'; Write-Host '--- INICIANDO BACKEND ---' -ForegroundColor Yellow; npm run dev"

# Inicia o Frontend em um novo processo do PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$rootDir\frontend'; Write-Host '--- INICIANDO FRONTEND ---' -ForegroundColor Green; npm run dev"

Write-Host "Backend e Frontend foram iniciados em janelas separadas!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "===================================================" -ForegroundColor Cyan
