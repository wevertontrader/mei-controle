# Como instalar o MEI Controle na Hostinger

Este guia explica como colocar o sistema em produção na **Hostinger**, usando o plano **Web Apps** (Node.js).

---

## 1. O que você precisa na Hostinger

- **Plano com suporte a Node.js**: Hostinger **Web Apps** (Business ou Cloud Startup) ou **VPS**.
- **Domínio** (pode ser o domínio grátis da Hostinger ou um que você já tenha).
- **Conta no GitHub** (para conectar o repositório).

Se você estiver na hospedagem **shared** (apenas PHP/cPanel), não é possível rodar Node.js; será preciso **Web Apps** ou **VPS**.

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
# Na raiz do projeto (pasta meipro)
npm install
npm run build

# Instalar dependências do servidor
cd server
npm install
cd ..

# Rodar em modo produção (servidor serve o frontend + API)
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

A Hostinger costuma pedir **comando de build** e **comando de start**. Use algo assim:

- **Comando de build (Build command):**
  ```bash
  npm install && npm run build && cd server && npm install && cd ..
  ```
  (Instala dependências da raiz, gera o frontend em `dist/` e instala dependências do `server`.)

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
| 4 | Build: `npm install && npm run build && cd server && npm install && cd ..` |
| 5 | Start: `NODE_ENV=production node server/index.js` |
| 6 | Configurar variáveis: `NODE_ENV`, `JWT_SECRET`, `BASE_URL`, e opcionalmente Mercado Pago |
| 7 | Fazer o primeiro deploy e trocar a senha do admin |

Se o seu plano for **VPS**, em vez de Web Apps, o processo é: conectar por SSH, instalar Node.js, clonar o repositório, configurar as variáveis de ambiente, rodar os mesmos comandos de build/start e usar um gerenciador de processos (ex.: **PM2**) e, se quiser, **Nginx** na frente. Se precisar, posso detalhar o passo a passo para VPS em outro guia.
