#!/bin/bash
# MEI Controle - Instalador para VPS (Linux)
# Uso: git clone https://github.com/wevertontrader/mei-controle.git && cd mei-controle && chmod +x install.sh && ./install.sh

set -e
echo "=========================================="
echo "  MEI Controle - Instalação VPS"
echo "=========================================="
echo ""

# Perguntar o endereço do site (será usado no .env como BASE_URL)
echo "Em qual endereço o site vai ficar?"
echo "Exemplo: https://meicontrole.seudominio.com.br (use https:// e sem barra no final)"
echo ""
read -p "URL do site: " BASE_URL_INPUT
# Remove barra no final se o usuário digitou
BASE_URL_INPUT="${BASE_URL_INPUT%/}"
if [ -z "$BASE_URL_INPUT" ]; then
    BASE_URL_INPUT="https://seu-dominio.com"
    echo "Nenhum endereço informado. Será usado: $BASE_URL_INPUT (edite o .env depois se precisar)"
fi
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo ""
    echo "Node.js não encontrado. Instale com:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    echo "Ou use NVM:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "  source ~/.bashrc && nvm install 20"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Node.js 18+ é necessário. Atual: $(node -v)"
    exit 1
fi
echo "[OK] Node.js $(node -v)"

# 2–5. Dependências, build, server e .env (script Node multiplataforma)
echo ""
npm run install:production -- --base-url="$BASE_URL_INPUT"

# 6. PM2 (opcional) - mantém o app rodando e reinicia se cair
echo ""
if command -v pm2 &> /dev/null; then
    echo "PM2 encontrado. Iniciando aplicação..."
    export NODE_ENV=production
    pm2 delete mei-controle 2>/dev/null || true
    pm2 start server/index.js --name mei-controle
    pm2 save 2>/dev/null || true
    echo "[OK] Aplicação iniciada com PM2. Comandos: pm2 status | pm2 logs mei-controle | pm2 restart mei-controle"
else
    echo "PM2 não instalado. Para instalar e usar:"
    echo "  npm install -g pm2"
    echo "  NODE_ENV=production pm2 start server/index.js --name mei-controle"
    echo "  pm2 startup   # manter rodando após reiniciar o servidor"
    echo ""
    echo "Para rodar sem PM2 (terminal):"
    echo "  NODE_ENV=production node server/index.js"
fi

echo ""
echo "=========================================="
echo "  Instalação concluída"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "  1. Se o endereço do site mudar, edite BASE_URL no .env"
echo "  2. Se usar Mercado Pago, preencha MERCADOPAGO_ACCESS_TOKEN no .env"
echo "  3. Configure Nginx (ou outro proxy) para apontar para a porta 3001"
echo "  4. Acesse o site e faça login: admin@meicontrole.com / admin123 (troque a senha depois)"
echo ""
echo "Banco de dados: server/database/meipro.sqlite (criado automaticamente)"
echo ""
