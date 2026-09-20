# Pernas Solidárias

Sistema de gestão de duplas (cadeirante + condutor) para eventos de corrida.

Documentação do projeto: https://www.overleaf.com/read/djhbxgmdsdcw#7a23b3

## Stack

- **Backend:** Node.js + TypeScript + Express 5 + PostgreSQL (pg)
- **Frontend:** React 19 + Vite + TailwindCSS + Recharts
- **Autenticação:** JWT

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente

## Como rodar

### 1. Criar o banco

```sql
CREATE DATABASE pernas_solidarias;
```

### 2. Instalar as dependências

```bash
npm run install:all
```

Instala na raiz, no `backend/` e no `frontend/`.

### 3. Configurar as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Preencha `DB_USER`, `DB_PASSWORD` e `DB_NAME` com os dados do seu
PostgreSQL local, e gere um `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Criar as tabelas

```bash
cd backend
npm run db:init
```

Executa `src/database/init-database.sql`, criando as tabelas `"USER"`,
`CADEIRANTE`, `CONDUTOR`, `EVENTO` e `DUPLA`, e cadastra o coordenador
inicial caso ainda não exista nenhum usuário. As credenciais são exibidas
no terminal — **troque a senha no primeiro acesso.**

O script é idempotente: rodar de novo não apaga dados.

### 5. Subir a aplicação

```bash
npm run dev
```

Sobe backend e frontend em paralelo:

- API: http://localhost:3000/api
- Health check: http://localhost:3000/api/health
- Frontend: http://localhost:5173

No Windows, `dev.bat` e `dev.ps1` fazem o mesmo.

## Scripts

| Comando | Onde | O que faz |
|---|---|---|
| `npm run install:all` | raiz | Instala dependências dos três pacotes |
| `npm run dev` | raiz | Sobe backend e frontend juntos |
| `npm run dev:backend` | raiz | Sobe só a API |
| `npm run dev:frontend` | raiz | Sobe só o frontend |
| `npm run db:init` | backend | Cria tabelas e o usuário inicial |
| `npm run build` | backend | Compila o TypeScript para `dist/` |
| `npm start` | backend | Roda a versão compilada |

## Estrutura

```
backend/src/
  controllers/   Recebem a requisição e devolvem a resposta
  services/      Regras de negócio
  repositories/  Acesso ao banco (SQL)
  routes/        Definição dos endpoints
  middlewares/   Autenticação e tratamento de erros
  models/        Tipos TypeScript
  database/      Conexão, script SQL e seed

frontend/src/
  pages/         Telas
  components/    Componentes reutilizáveis
  services/      Chamadas à API
  context/       Autenticação e notificações
```