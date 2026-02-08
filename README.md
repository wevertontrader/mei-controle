# MEI Controle

Sistema SaaS para gestão de MEIs (Microempreendedores Individuais).

## Localização do Banco de Dados

O banco de dados **SQLite** está em:

```
C:\laragon\www\meipro\server\database\meipro.sqlite
```

- **Pasta:** `server/database/`
- **Arquivo:** `meipro.sqlite`
- O banco é criado automaticamente na primeira execução do servidor.

## Funcionalidades

- **Visão Geral:** Dashboard com métricas financeiras e gráfico
- **Financeiro:** Entradas, Gastos, Custos, Poupança
- **Clientes:** Cadastro e Histórico de Vendas
- **Produtos:** Lista de Produtos
- **Estoque:** Visão Geral e Movimentações
- **Calculadora:** Precificação e Pró-labore
- **Tarefas:** Lista de tarefas com conclusão
- **Assinatura:** Planos e Histórico
- **Perfil:** Dados do usuário

## Como Rodar

### 1. Instalar dependências

```bash
# Frontend
npm install

# Backend (em outro terminal)
cd server
npm install
```

### 2. Iniciar o servidor (API)

```bash
cd server
npm start
```

O servidor roda em `http://localhost:3001`

### 3. Iniciar o frontend

```bash
npm run dev
```

O frontend roda em `http://localhost:5173`

### 4. Acessar

- **Landing:** http://localhost:5173
- **Login:** http://localhost:5173/login
- **Cadastro:** http://localhost:5173/cadastro (3 dias de teste grátis)

## Período de Teste

Ao se cadastrar, a empresa tem **3 dias de teste grátis** para usar o sistema completo.

## Super Admin

O sistema possui um super administrador que controla todo o sistema.

- **E-mail:** admin@meicontrole.com
- **Senha:** admin123
- **URL:** http://localhost:5174/admin (ou porta do frontend)

O super admin pode:
- Ver estatísticas gerais do sistema
- Listar todas as empresas cadastradas
- Ver detalhes de cada empresa
- Estender o período de teste das empresas
