# Arquitetura e Modelo de Dados

## Arquitetura de Software

O projeto adota arquitetura **Client-Server em Camadas** com separação estrita de responsabilidades:

- **Frontend (SPA React + Nginx):** páginas, componentes reutilizáveis, contextos (`Auth`, `Theme`, `Toast`) e camada de serviços Axios apontando para `/api` (mesma origem via proxy reverso do Nginx, eliminando problemas de CORS).
- **Backend (Node.js + Express em camadas):**
  - `routes/` → mapeamento de endpoints REST;
  - `middlewares/` → autenticação JWT, métricas Prometheus e tratamento centralizado de erros;
  - `controllers/` → validação de entrada e serialização HTTP;
  - `services/` → regras de negócio (priorização de duplas, exportação Excel, analytics);
  - `repositories/` → acesso ao PostgreSQL com SQL parametrizado.

---

## Arquitetura de Produção (C4 — Nível 2)

```text
Usuário ──HTTPS──► Cloudflare Edge ══Cloudflare Tunnel══► tunnel (cloudflared)
                                                            ├─ pernassolidarias.social.br ──► frontend (Nginx:80)
                                                            │                                   ├─ /      (SPA React/Vite)
                                                            │                                   └─ /api/* ──► backend (Express:3000) ──► db (PostgreSQL 16)
                                                            └─ monitor.pernassolidarias.social.br ──► grafana (:3000) ──► prometheus (:9090) ──► backend (/metrics)
```

- Nenhuma porta HTTP/HTTPS/DB fica exposta na AWS EC2 (apenas SSH restrito por IPv4 no Security Group).
- Os arquivos PlantUML completos (Níveis 1, 2 e 3) estão versionados em [`RFC/DIAGRAMAS_C4/`](https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias/tree/main/RFC/DIAGRAMAS_C4).

---

## Modelo de Dados (PostgreSQL 16)

Definido de forma idempotente em [`backend/src/database/init-database.sql`](https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias/blob/main/backend/src/database/init-database.sql):

- **`"USER"`:** `cd_user` (PK), `email` (UNIQUE), `senha` (bcrypt), `tentativas_falhas`, `bloqueado_ate` (`TIMESTAMPTZ`), `created_at`.
- **`EVENTO`:** `cd_evento` (PK), `nm_evento`, `dt_evento`, `created_at`.
- **`CADEIRANTE`:** `cd_cadeirante` (PK), `nm_cadeirante`, `cpf` (`CHAR(11)` UNIQUE), `telefone`, `tam_camisa`, `data_nascimento`, `sexo`, `possui_cadeira_propria`, `ativo`, `created_at`.
- **`CONDUTOR`:** `cd_condutor` (PK), `nm_condutor`, `cpf` (`CHAR(11)` UNIQUE), `telefone`, `tam_camisa`, `data_nascimento`, `sexo`, `ativo`, `created_at`.
- **`DUPLA`:** `cd_dupla` (PK), `cd_evento` (FK `ON DELETE CASCADE`), `cd_cadeirante` (FK `ON DELETE RESTRICT`), `cd_condutor` (FK `ON DELETE RESTRICT`), com restrições `UNIQUE (cd_evento, cd_cadeirante)` e `UNIQUE (cd_evento, cd_condutor)`.
- **Triggers de integridade:** `trg_check_cpf_cadeirante` e `trg_check_cpf_condutor` garantem unicidade de CPF entre as duas tabelas.
