# Como instalar o MEI Controle na Hostinger

Este guia explica como colocar o sistema em produção na **Hostinger**, usando o plano **Web Apps** (Node.js).

---

## 1. O que você precisa na Hostinger

- **Plano com suporte a Node.js**: Hostinger **Web Apps** (Business ou Cloud Startup) ou **VPS**.
- **Domínio** (pode ser o domínio grátis da Hostinger ou um que você já tenha).
- **Conta no GitHub** (para conectar o repositório).

Se você estiver na hospedagem **shared** (apenas PHP/cPanel), não é possível rodar Node.js; será preciso **Web Apps** ou **VPS**.

---

## 1.1 Instalação rápida na VPS (terminal)

Se você tem uma **VPS Linux** com SSH, pode instalar tudo com um instalador:

```bash
# Conectar na VPS (ssh usuario@ip-da-vps), depois:
git clone https://github.com/wevertontrader/mei-controle.git
cd mei-controle
# Confirme que está na pasta certa (deve listar install.sh, server/, package.json):
ls
chmod +x install.sh
./install.sh
```

**Importante:** rode `./install.sh` na pasta do repositório (a que contém `install.sh`, `package.json` e a pasta `server`). Se estiver em `mei-controle/mei-controle`, volte com `cd ..`.

**Se aparecer erro** `bad interpreter: /bin/bash^M` (fim de linha Windows), corrija no servidor:
```bash
sed -i 's/\r$//' install.sh
./install.sh
```
(O repositório já tem `.gitattributes` para que novos clones usem fim de linha Unix.)

O script `install.sh` (VPS):
- Verifica o Node.js 18+
- Executa **`npm run install:production -- --base-url=...`**, que instala dependências na raiz, gera o `dist/`, instala o `server/` com `--omit=dev`, cria `.env` se ainda não existir (com `JWT_SECRET` aleatório) e valida o build
- Se tiver PM2 instalado, inicia a aplicação com PM2

**Instalador único (recomendado também no build da Hostinger):**

```bash
npm run install:production
```

Na Hostinger, se **todas** as variáveis (`NODE_ENV`, `JWT_SECRET`, `BASE_URL`, etc.) estiverem só no painel e você **não** quiser criar arquivo `.env` no servidor de build, use:

```bash
npm run install:production -- --skip-env
```

Depois da instalação, se precisar alterar a URL, edite `BASE_URL` no `.env`. Configure Nginx (ou proxy) para a porta **3001**.

### 1.2 Configurar Nginx na VPS (evitar 404)

Se ao acessar o domínio (ex.: `mei.digitalavance.com.br`) aparecer **404 Not Found** do Nginx, é porque ele ainda não está repassando as requisições para o app na porta 3001. Faça o seguinte **na VPS**:

1. **Criar o arquivo de configuração do site** (troque `mei.digitalavance.com.br` pelo seu domínio):

```bash
sudo nano /etc/nginx/sites-available/mei-controle
```

Cole o conteúdo abaixo (ajuste o `server_name` se for outro domínio):

```nginx
server {
    listen 80;
    server_name mei.digitalavance.com.br;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Salve (Ctrl+O, Enter, Ctrl+X no nano).

2. **Ativar o site e recarregar o Nginx:**

```bash
sudo ln -sf /etc/nginx/sites-available/mei-controle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Confirmar que o app está rodando na porta 3001:**

```bash
pm2 status
# ou, se não usa PM2:
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001
# deve retornar 200 ou 302
```

Se `pm2 status` não mostrar o app rodando, inicie de novo a partir da pasta do projeto:

```bash
cd ~/mei-controle
NODE_ENV=production pm2 start server/index.js --name mei-controle
pm2 save
```

Depois disso, acesse de novo `http://mei.digitalavance.com.br` (ou o seu domínio). Para usar **HTTPS**, depois de funcionar em HTTP você pode instalar o Certbot e gerar o certificado:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mei.digitalavance.com.br
```

---

## 2. Preparar o projeto para deploy

### 2.1 Enviar o código para o GitHub

1. Crie um repositório no GitHub (ex.: `mei-controle`).
2. No seu computador, na pasta do projeto, execute:

```bash
git init
git add .
git commit -m "Projeto MEI Controle"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mei-controle.git
git push -u origin main
```

**Importante:** Não envie o banco de dados nem senhas. No `.gitignore` devem estar, por exemplo:

- `node_modules/`
- `server/node_modules/`
- `server/database/*.sqlite*`
- `.env`
- `dist/`

### 2.2 Variáveis de ambiente (produção)

O backend usa variáveis de ambiente. Na Hostinger você vai configurá-las no painel (veja passo 4). Valores sugeridos:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Sempre `production` em produção | `production` |
| `PORT` | Porta (a Hostinger pode definir automaticamente) | Deixe em branco ou use a que o painel indicar |
| `JWT_SECRET` | Chave secreta para tokens (invente uma string longa e aleatória) | Ex: `minhaChaveSecretaMuitoSegura2024!` |
| `BASE_URL` | URL pública do seu site (sem barra no final) | `https://meicontrole.seudominio.com.br` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token do Mercado Pago (se for usar pagamentos) | Obtenha em developers.mercadopago.com |
| `CORS_ORIGIN` | (Opcional) URL do front se for outro domínio | Normalmente não precisa |

---

## 3. Build do projeto no seu PC (teste local)

Antes de subir, vale testar o build e o servidor em modo produção no seu computador:

```bash
# Na raiz do projeto — instala tudo e gera dist/ (cria .env se não existir)
npm run install:production

# Ou, se já tiver .env configurado:
npm run install:production -- --skip-env

# Subir o servidor (API + arquivos estáticos do React)
set NODE_ENV=production
node server/index.js
```

No Windows (PowerShell) use: `$env:NODE_ENV="production"; node server/index.js`

Acesse `http://localhost:3001`. Se a tela de login e a API funcionarem, o projeto está pronto para a Hostinger.

---

## 4. Deploy na Hostinger (Web Apps – Node.js)

### 4.1 Acessar o painel

1. Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com) e faça login.
2. No menu, procure por **“Aplicações”** ou **“Web Apps”** / **“Node.js”** (o nome pode variar conforme o plano).

### 4.2 Criar nova aplicação

1. Clique em **“Criar aplicação”** ou **“Adicionar aplicação”**.
2. **Conectar repositório:**
   - Escolha **GitHub** e autorize a Hostinger.
   - Selecione o repositório do MEI Controle (ex.: `mei-controle`).
   - Branch: `main` (ou a que você usa).

### 4.3 Configurar build e start

A Hostinger costuma pedir **comando de build** e **comando de start**. Use o instalador unificado:

- **Comando de build (Build command):**
  ```bash
  npm run install:production -- --skip-env
  ```
  O `--skip-env` evita criar um `.env` no ambiente de build quando você já configurou `JWT_SECRET`, `BASE_URL`, etc. no painel (o `dotenv` não sobrescreve variáveis que o painel já injetou em tempo de execução).

  Se preferir o fluxo manual (equivalente):
  ```bash
  npm install && npm run build && cd server && npm install --omit=dev && cd ..
  ```

- **Comando de start (Start command / Run command):**
  ```bash
  NODE_ENV=production node server/index.js
  ```
  Se o painel não aceitar `NODE_ENV=production` na mesma linha, configure `NODE_ENV=production` como variável de ambiente no painel e use apenas:
  ```bash
  node server/index.js
  ```

- **Diretório raiz (Root directory):** deixe em branco ou `.` (raiz do repositório).

- **Porta:** muitas vezes a Hostinger define sozinha (ex.: `PORT=3001`). Se pedir, use a porta que eles indicarem ou `3001`.

### 4.4 Variáveis de ambiente no painel

No painel da aplicação, abra **“Variáveis de ambiente”** / **“Environment variables”** e cadastre:

- `NODE_ENV` = `production`
- `JWT_SECRET` = (sua chave secreta forte)
- `BASE_URL` = `https://seu-dominio.com` (ou a URL que a Hostinger der)
- `MERCADOPAGO_ACCESS_TOKEN` = (seu token do Mercado Pago, se for usar)
- `PORT` = só se o painel pedir

Salve as variáveis.

### 4.5 Deploy

1. Clique em **“Deploy”** / **“Publicar”**.
2. Aguarde o build e o start. A Hostinger deve mostrar a URL da aplicação (ex.: `https://sua-app.hostinger.com` ou seu domínio customizado).

### 4.6 Banco de dados (SQLite)

- O projeto usa **SQLite** em `server/database/meipro.sqlite`.
- Na primeira execução, o backend cria as tabelas e um usuário admin.
- Em Web Apps, o sistema de arquivos costuma ser persistente; o arquivo do SQLite fica no servidor. Faça backups pelo painel de arquivos ou por algum recurso de backup da Hostinger, se disponível.

**Admin padrão (após primeiro deploy):**

- E-mail: `admin@meicontrole.com`  
- Senha: `admin123`  

**Altere a senha do admin assim que fizer o primeiro login em produção.**

---

## 5. Domínio e SSL

- Se usar um **domínio da Hostinger**, associe-o à aplicação no painel (geralmente em “Domínios” ou “Configuração da aplicação”).
- **SSL (HTTPS)** costuma ser ativado automaticamente. Mantenha `BASE_URL` em HTTPS (ex.: `https://meicontrole.seudominio.com.br`).

---

## 6. Depois do deploy

1. Acesse a URL da aplicação e faça login com o admin.
2. Altere a senha do admin em **Perfil** ou pela funcionalidade de alteração de senha.
3. Em **Admin > Configurações**, confira **BASE_URL** (e Mercado Pago, se usar).
4. Crie um usuário “empresa” para testar o fluxo normal (cadastro/convite, conforme seu sistema).

---

## 7. Atualizar o sistema (novo deploy)

Sempre que mudar o código:

1. Envie as alterações para o GitHub:
   ```bash
   git add .
   git commit -m "Descrição da atualização"
   git push
   ```
2. No painel da Hostinger, na sua aplicação Node.js, clique em **“Redeploy”** / **“Deploy”** para rodar o build e o start de novo.

---

## 8. Resumo rápido

| Etapa | O que fazer |
|-------|---------------------|
| 1 | Ter plano Hostinger com Node.js (Web Apps ou VPS) |
| 2 | Subir o código no GitHub (sem `.env`, sem `node_modules`, sem SQLite no repositório) |
| 3 | Criar aplicação Node.js na Hostinger e conectar o repositório |
| 4 | Build: `npm run install:production -- --skip-env` (ou sem `--skip-env` se quiser gerar `.env` na primeira vez) |
| 5 | Start: `NODE_ENV=production node server/index.js` |
| 6 | Configurar variáveis: `NODE_ENV`, `JWT_SECRET`, `BASE_URL`, e opcionalmente Mercado Pago |
| 7 | Fazer o primeiro deploy e trocar a senha do admin |

Se o seu plano for **VPS**, em vez de Web Apps, o processo é: conectar por SSH, instalar Node.js, clonar o repositório, configurar as variáveis de ambiente, rodar os mesmos comandos de build/start e usar um gerenciador de processos (ex.: **PM2**) e, se quiser, **Nginx** na frente. Se precisar, posso detalhar o passo a passo para VPS em outro guia.
