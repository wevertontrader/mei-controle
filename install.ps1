# MEI Controle - Instalador para Windows (PowerShell) - ambiente local ou preparar pasta antes do deploy
# Uso: na raiz do projeto:  powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MEI Controle - Instalacao (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = Read-Host "URL publica do site (ex: https://meicontrole.seudominio.com.br, sem barra no final)"
$baseUrl = $baseUrl.Trim().TrimEnd('/')
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "https://seu-dominio.com"
    Write-Host "Usando placeholder: $baseUrl (edite .env depois se precisar)" -ForegroundColor Yellow
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js nao encontrado. Instale Node 18+ de https://nodejs.org/" -ForegroundColor Red
    exit 1
}

$ver = (node -v) -replace '^v(\d+)\..*', '$1'
if ([int]$ver -lt 18) {
    Write-Host "Node.js 18+ e necessario. Atual: $(node -v)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js $(node -v)" -ForegroundColor Green

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

npm run install:production -- --base-url="$baseUrl"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Opcional: PM2 no Windows (npm i -g pm2)" -ForegroundColor DarkGray
Write-Host "  pm2 start server/index.js --name mei-controle" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Rodar agora: `$env:NODE_ENV='production'; node server/index.js" -ForegroundColor Cyan
Write-Host "Acesse http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin: admin@meicontrole.com / admin123 (troque a senha)" -ForegroundColor Yellow
Write-Host ""
