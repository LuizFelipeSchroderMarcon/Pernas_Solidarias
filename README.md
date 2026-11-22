# Pernas Solidárias

Sistema web para gestão de eventos de corrida, cadastro de participantes (cadeirantes e condutores), formação automática/manual de duplas com priorização por histórico, dashboard analítico e exportação de planilhas Excel.

## Links do Projeto

- **Aplicação em Produção:** [https://pernassolidarias.social.br](https://pernassolidarias.social.br)
- **Health Check da API:** [https://pernassolidarias.social.br/api/health](https://pernassolidarias.social.br/api/health)
- **Observabilidade (Grafana):** [https://monitor.pernassolidarias.social.br](https://monitor.pernassolidarias.social.br)
- **Wiki do Projeto:** [GitHub Wiki](https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias/wiki)
- **Guia de Deploy em Produção (AWS EC2 + Cloudflare Tunnel):** [deploy/DEPLOY-AWS.md](./deploy/DEPLOY-AWS.md)
- **Documentação Acadêmica (RFC / LaTeX):** [RFC/](./RFC/) · [Overleaf](https://www.overleaf.com/read/djhbxgmdsdcw#7a23b3)

---

## Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Recharts (servido por Nginx 1.27 Alpine)
- **Backend:** Node.js 20 + TypeScript + Express 5 + PostgreSQL 16 (`pg`) + ExcelJS + `prom-client`
- **Autenticação e Segurança:** JWT, `bcrypt`, bloqueio temporário após tentativas falhas, HTTPS via Cloudflare Tunnel
- **Infraestrutura e Deploy:** AWS EC2 + Docker Compose + Cloudflare Tunnel + GHCR
- **Qualidade e CI/CD:** GitHub Actions (CI + CD), Vitest + Supertest (testes unitários e de integração), SonarCloud
- **Observabilidade:** Prometheus + Grafana OSS (dashboards provisionados como código)

---

## Engenharia: CI/CD, Qualidade e Observabilidade

- **CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)):** build TypeScript/Vite, validação de `db:init` e `db:reset` em PostgreSQL 16 limpo, testes unitários com cobertura (`vitest --coverage`), testes de integração (`supertest` + PostgreSQL) e análise estática + cobertura no **SonarCloud**.
- **CD ([`.github/workflows/cd.yml`](./.github/workflows/cd.yml)):** no merge em `main` (produção) ou `dev` (homologação), executa o CI e publica imagens multi-stage no **GitHub Container Registry (GHCR)**. Na EC2, [`deploy/atualizar.sh`](./deploy/atualizar.sh) puxa novas imagens, faz backup automático do PostgreSQL, valida `/api/health` e aplica rollback automático com proteção contra loop em caso de falha.
- **Observabilidade ([`deploy/monitoring/`](./deploy/monitoring/)):** o backend expõe métricas em `/metrics` apenas na rede interna do Docker; o **Prometheus** coleta métricas HTTP e do runtime Node.js a cada 15s (retenção de 7 dias / 512 MB) e o **Grafana** disponibiliza o dashboard **"Pernas Solidárias — Observabilidade API"** em `https://monitor.pernassolidarias.social.br`.

---

## Pré-requisitos (Desenvolvimento Local)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.
- *(Opcional)* [DBeaver](https://dbeaver.io/) ou outro cliente SQL para inspecionar o banco de dados.

> [!IMPORTANT]
> **Aviso para quem tem PostgreSQL instalado no Windows:**  
> Se já houver um serviço do PostgreSQL rodando localmente na porta `5432`, interrompa-o para evitar conflito com o container do Docker:
> ```powershell
> Stop-Service postgresql-x64-17; Set-Service postgresql-x64-17 -StartupType Manual
> ```

---

## Como rodar localmente com Docker (Recomendado)

A aplicação é 100% conteinerizada:

### 1. Iniciar os Serviços

Na raiz do projeto:

```bash
docker compose up -d
```
*(ou `npm run dev:d`)*

Isso irá:
1. Subir o container do **PostgreSQL 16** com volume persistente (`postgres_data`).
2. Subir a API do **Backend**, executando automaticamente a criação/migração das tabelas e o seed do coordenador inicial.
3. Subir a aplicação **Frontend** com *Hot Reload*.

### 2. Acessar Localmente

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check da API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Métricas Prometheus (local):** [http://localhost:3000/metrics](http://localhost:3000/metrics)

### 3. Credenciais Padrão (Desenvolvimento)

- **E-mail:** `admin@pernassolidarias.org.br`
- **Senha:** `admin123`

---

## Comandos Úteis

| Ação | Comando Docker | Atalho NPM |
|---|---|---|
| Iniciar em segundo plano | `docker compose up -d` | `npm run dev:d` |
| Iniciar com logs no terminal | `docker compose up` | `npm run dev` |
| Parar serviços (sem remover) | `docker compose stop` | `npm run stop` |
| Parar e remover containers | `docker compose down` | `npm run down` |
| Ver logs em tempo real | `docker compose logs -f` | `npm run logs` |
| Reconstruir as imagens | `docker compose build` | `npm run build` |
| Rodar migração manual do banco | `docker compose exec backend npm run db:init` | `npm run db:init` |

No Windows, os scripts [`dev.bat`](./dev.bat) e [`dev.ps1`](./dev.ps1) também iniciam o ambiente via Docker Compose automaticamente.

---

## Desenvolvimento Local Tradicional (Sem Docker)

1. **Instalar dependências:**
   ```bash
   npm run install:all
   ```
2. **Configurar variáveis de ambiente:**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Ajuste `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `JWT_SECRET` em `backend/.env`.
3. **Inicializar banco e rodar aplicação:**
   ```bash
   npm run db:init --prefix backend
   npm run dev:local
   ```

---

## Testes Automatizados

```bash
# Backend — unitários com cobertura e integração
npm --prefix backend run test:coverage
npm --prefix backend run test:integration

# Frontend — unitários com cobertura
npm --prefix frontend run test:coverage
```

---

## Estrutura do Projeto

```text
backend/
  Dockerfile.prod          Build multi-stage de produção (Node 20 Alpine)
  src/
    controllers/           Recebem requisições e retornam respostas HTTP
    services/              Regras de negócio (duplas, eventos, participantes, exportação)
    repositories/          Consultas SQL parametrizadas (PostgreSQL)
    routes/                Definição dos endpoints REST
    middlewares/           Autenticação JWT, métricas Prometheus e tratamento de erros
    database/              Conexão, script SQL idempotente e seed inicial
  tests/
    unit/                  Testes unitários (Vitest)
    integration/           Testes de integração End-to-End (Vitest + Supertest + PostgreSQL)

frontend/
  Dockerfile.prod          Build Vite + Nginx 1.27 Alpine
  nginx.conf               SPA routing + proxy reverso /api/* + headers de segurança
  src/                     Páginas, componentes reutilizáveis, serviços Axios e contextos
  tests/                   Testes unitários de componentes, serviços e utilitários

deploy/
  DEPLOY-AWS.md            Guia completo de deploy em produção/homologação na AWS
  env.producao.example     Modelo das variáveis de ambiente de produção
  backup.sh                Backup diário e pré-deploy do PostgreSQL
  atualizar.sh             Deploy pull-based com backup, health check e rollback automático
  monitoring/              Configurações do Prometheus e provisioning do Grafana

docs/wiki/                 Páginas prontas para publicação na Wiki do GitHub
RFC/                       Diagramas C4, modelo de dados, casos de uso e documento acadêmico
docker-compose.yml         Orquestração para desenvolvimento local
docker-compose.prod.yml    Orquestração de produção (db, backend, frontend, tunnel, prometheus, grafana)
```
