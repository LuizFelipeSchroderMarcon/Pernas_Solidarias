# Pernas Solidárias

Sistema de gestão de duplas (cadeirante + condutor) para eventos de corrida.

Documentação do projeto: https://www.overleaf.com/read/djhbxgmdsdcw#7a23b3

## Stack

- **Containerização:** Docker & Docker Compose
- **Backend:** Node.js 20 + TypeScript + Express 5 + PostgreSQL 16 (pg)
- **Frontend:** React 19 + Vite + TailwindCSS + Recharts
- **Autenticação:** JWT

---

## Pré-requisitos

Para rodar a aplicação, você só precisa de:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.
- *(Opcional)* [DBeaver](https://dbeaver.io/) ou outro cliente SQL para gerenciar o banco de dados.

> [!IMPORTANT]
> **Aviso para quem tem PostgreSQL instalado no Windows:**  
> Se você já tiver um serviço do PostgreSQL rodando localmente no Windows na porta `5432`, interrompa-o para evitar conflito com o contêiner do Docker:
> ```powershell
> Stop-Service postgresql-x64-17; Set-Service postgresql-x64-17 -StartupType Manual
> ```

---

## Como rodar com Docker (Recomendado)

A aplicação é 100% conteinerizada e dividida em três microsserviços: **Banco de Dados**, **Backend** e **Frontend**.

### 1. Iniciar os Serviços

Com o **Docker Desktop** aberto, execute na raiz do projeto:

```bash
docker compose up -d
```
*(ou simplesmente `npm run dev:d`)*

Isso irá:
1. Subir o contêiner do **PostgreSQL 16** com volume persistente (`postgres_data`).
2. Subir a API do **Backend**, executando automaticamente as migrações/criação de tabelas e o seed do usuário administrador inicial.
3. Subir a aplicação **Frontend** com suporte a *Hot Reload* (alterações no código refletem instantaneamente no navegador).

### 2. Acessar a Aplicação

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check da API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 3. Credenciais Padrão de Acesso

Ao inicializar o banco pela primeira vez, o coordenador padrão é criado:

- **E-mail:** `admin@pernassolidarias.org.br`
- **Senha:** `admin123`

---

## Conexão com o Banco de Dados no DBeaver

O PostgreSQL do Docker está exposto na porta padrão `5432`. Para conectar via **DBeaver**:

| Campo | Valor |
| :--- | :--- |
| **Driver** | `PostgreSQL` |
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `pernas_solidarias` |
| **Username** | `postgres` |
| **Password** | `postgres` |

---

## Comandos Úteis do Docker

Você pode utilizar tanto os comandos nativos do Docker quanto os atalhos configurados no `package.json`:

| Ação | Comando Docker | Atalho NPM |
|---|---|---|
| Iniciar em segundo plano | `docker compose up -d` | `npm run dev:d` |
| Iniciar com logs no terminal | `docker compose up` | `npm run dev` |
| Parar serviços (sem remover) | `docker compose stop` | `npm run stop` |
| Parar e remover contêineres | `docker compose down` | `npm run down` |
| Ver logs em tempo real | `docker compose logs -f` | `npm run logs` |
| Reconstruir as imagens | `docker compose build` | `npm run build` |
| Rodar migração manual do banco | `docker compose exec backend npm run db:init` | `npm run db:init` |

No Windows, os scripts [dev.bat](file:///d:/Pernas_Solidarias/dev.bat) e [dev.ps1](file:///d:/Pernas_Solidarias/dev.ps1) também iniciam o ambiente via Docker Compose automaticamente.

---

## Desenvolvimento Local Tradicional (Sem Docker)

Caso queira executar a aplicação diretamente na sua máquina fora do Docker (usando o PostgreSQL local do Windows):

1. **Instalar dependências:**
   ```bash
   npm run install:all
   ```

2. **Configurar as variáveis de ambiente (.env):**
   > Como o arquivo `.env` contém credenciais e é ignorado pelo Git, é **obrigatório** criá-lo manualmente no modo tradicional:
   ```bash
   # Copie o arquivo de exemplo
   cp backend/.env.example backend/.env
   # No Windows (CMD/PowerShell), você também pode usar:
   copy backend\.env.example backend\.env
   ```
   Abra `backend/.env` e ajuste `DB_USER`, `DB_PASSWORD` e `DB_NAME` conforme as credenciais do seu PostgreSQL local. Se desejar, gere um `JWT_SECRET` seguro:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. **Criar o banco e rodar as tabelas localmente:**
   No PostgreSQL local, crie a base `pernas_solidarias` e execute as migrações:
   ```bash
   npm run db:init --prefix backend
   ```

4. **Iniciar em modo local:**
   ```bash
   npm run dev:local
   ```
   *(Sobe o backend e frontend simultaneamente usando o concurrently)*

---

## Estrutura do Projeto

```
backend/
  Dockerfile       Configuração do container da API
  src/
    controllers/   Recebem a requisição e devolvem a resposta
    services/      Regras de negócio
    repositories/  Acesso ao banco (SQL)
    routes/        Definição dos endpoints
    middlewares/   Autenticação e tratamento de erros
    models/        Tipos TypeScript
    database/      Conexão, script SQL de tabelas e seed inicial

frontend/
  Dockerfile       Configuração do container do Frontend (Vite)
  src/
    pages/         Telas e fluxos
    components/    Componentes reutilizáveis
    services/      Chamadas à API (Axios)
    context/       Autenticação e notificações globais

docker-compose.yml Orquestração dos 3 microsserviços (db, backend, frontend)
```