# CI/CD, Qualidade e Observabilidade

## Pipeline de CI/CD (GitHub Actions + GHCR)

```text
PR para dev/main ──► CI (build, db:init/reset, testes unitários + cobertura, testes de integração, SonarCloud)
merge na dev     ──► CD (reutiliza CI + publica imagens GHCR com tags dev e dev-sha-<commit>)
merge na main    ──► CD (reutiliza CI + publica imagens GHCR com tags latest e sha-<commit>)
EC2 (cron 5 min) ──► deploy/atualizar.sh (pull GHCR → backup → restart → health check → rollback se falhar)
```

### Integração Contínua (`.github/workflows/ci.yml`)
- **Backend:** compila TypeScript, testa `npm run db:init` e `npm run db:reset` em PostgreSQL 16 limpo, executa testes unitários com cobertura (`vitest --coverage`) e testes de integração End-to-End (`vitest` + `supertest` + PostgreSQL).
- **Frontend:** valida tipagem (`tsc -b`), gera build de produção Vite e executa testes unitários com cobertura (`vitest --coverage`).
- **SonarCloud:** analisa qualidade, manutenibilidade, segurança e cobertura de código (relatórios `lcov.info` de backend e frontend).

### Entrega Contínua (`.github/workflows/cd.yml` + `deploy/atualizar.sh`)
- Modelo *pull-based* sem credenciais AWS no GitHub e sem deploy manual via SSH/FTP.
- Proteção contra execuções concorrentes (`flock`), backup preventivo automático antes de cada atualização, validação de `/api/health` por até 4 minutos, rollback automático e marcação da imagem rejeitada para evitar loops de rollback.

---

## Observabilidade (Prometheus + Grafana)

- **Instrumentação (`prom-client`):** middleware em `backend/src/middlewares/metricsMiddleware.ts` coleta métricas padrão do Node.js (CPU, memória RSS/Heap, event loop lag) e métricas HTTP (`http_requests_total` e `http_request_duration_seconds` por método, rota e status).
- **Segurança:** o endpoint `/metrics` fica fora de `/api` (não é encaminhado pelo Nginx), acessível exclusivamente ao Prometheus dentro da rede interna do Docker.
- **Prometheus:** configurado em `deploy/monitoring/prometheus.yml` com scrape a cada 15s, retenção de 7 dias / 512 MB e limite de memória (`192m`).
- **Grafana:** acessível em [https://monitor.pernassolidarias.social.br](https://monitor.pernassolidarias.social.br) via Cloudflare Tunnel (protegido por login, sign-up desabilitado), com datasource e dashboard **"Pernas Solidárias — Observabilidade API"** provisionados automaticamente como código em `deploy/monitoring/grafana/provisioning/`.
