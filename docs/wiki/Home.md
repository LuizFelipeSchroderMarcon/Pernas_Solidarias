# Pernas Solidárias — Wiki do Projeto

Bem-vindo à documentação oficial do **Pernas Solidárias**, sistema web desenvolvido para apoiar a gestão de eventos esportivos inclusivos, cadastro de participantes (cadeirantes e condutores), formação inteligente de duplas, acompanhamento histórico e exportação de planilhas.

## Endereços em Produção

- **Aplicação Web:** [https://pernassolidarias.social.br](https://pernassolidarias.social.br)
- **Health Check da API:** [https://pernassolidarias.social.br/api/health](https://pernassolidarias.social.br/api/health)
- **Monitoramento (Grafana):** [https://monitor.pernassolidarias.social.br](https://monitor.pernassolidarias.social.br)

## Índice da Documentação

1. [[Requisitos e Casos de Uso|Requisitos-e-Casos-de-Uso]] — escopo funcional, regras de negócio e fluxos principais.
2. [[Arquitetura e Modelo de Dados|Arquitetura-e-Modelo-de-Dados]] — arquitetura em camadas, diagramas C4 e esquema PostgreSQL.
3. [[CI/CD, Qualidade e Observabilidade|CI-CD-Qualidade-e-Observabilidade]] — GitHub Actions, testes (unitários + integração), SonarCloud, Prometheus e Grafana.
4. [[Deploy em Produção (AWS EC2)|Deploy-em-Producao]] — infraestrutura na AWS, Cloudflare Tunnel, backups e rollback automático.

## Resumo da Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Nginx 1.27 |
| Backend | Node.js 20, TypeScript, Express 5, `pg`, `bcrypt`, JWT, ExcelJS, `prom-client` |
| Banco de Dados | PostgreSQL 16 Alpine |
| Infraestrutura | AWS EC2 (Ubuntu 24.04), Docker Compose, Cloudflare Tunnel |
| Qualidade & CI/CD | GitHub Actions, GHCR, Vitest, Supertest, SonarCloud |
| Observabilidade | Prometheus v2.55 + Grafana OSS 11.3 |
