# Script para iniciar servidores em janelas separadas
Write-Host "🚀 Iniciando servidores do Inclua-AI..." -ForegroundColor Cyan

# Inicia servidor Python HTTP (porta 8080)
Write-Host "📂 Iniciando servidor HTTP na porta 8080..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\12265587630\Inclua-AI'; python -m http.server 8080"

# Aguarda 2 segundos
Start-Sleep -Seconds 2

# Inicia servidor Node.js (porta 3000)
Write-Host "🤖 Iniciando servidor API Node.js na porta 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\12265587630\Inclua-AI\servidor'; node server.js"

# Aguarda 3 segundos
Start-Sleep -Seconds 3

# Abre o navegador
Write-Host "🌐 Abrindo aplicação no navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:8080/index.html"

Write-Host ""
Write-Host "✅ Servidores iniciados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   API:      http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Para parar os servidores, feche as janelas do PowerShell" -ForegroundColor Yellow
