# Inclua-AI - Script de Desenvolvimento
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INCLUA-AI - Iniciar Servidores" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
$pythonExists = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonExists) {
    Write-Host "❌ Python não encontrado!" -ForegroundColor Red
    Write-Host "Instale Python ou use outra opção (veja LOCAL_SERVER.md)" -ForegroundColor Yellow
    exit 1
}

# Verificar se Node está instalado
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Instale Node.js em https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Python e Node.js encontrados" -ForegroundColor Green
Write-Host ""

# Navegar para o diretório do projeto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "[1/2] Iniciando servidor estático (porta 8080)..." -ForegroundColor Yellow
$staticServer = Start-Process python -ArgumentList "-m", "http.server", "8080" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 1

Write-Host "[2/2] Iniciando servidor de API (porta 3000)..." -ForegroundColor Yellow
Set-Location "$projectPath\servidor"
$apiServer = Start-Process node -ArgumentList "server.js" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 2

Set-Location $projectPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Servidores Iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host "  API:      " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Abrindo navegador..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

Start-Process "http://localhost:8080/index.html"

Write-Host ""
Write-Host "Pressione Ctrl+C para parar os servidores..." -ForegroundColor Yellow
Write-Host ""

# Manter o script rodando
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Parando servidores..." -ForegroundColor Yellow
    Stop-Process -Id $staticServer.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $apiServer.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Servidores parados" -ForegroundColor Green
}
