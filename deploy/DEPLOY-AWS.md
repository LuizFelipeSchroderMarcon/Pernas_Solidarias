# Deploy na AWS (EC2) com Cloudflare Tunnel — Pernas Solidárias

Passo a passo para publicar o **Pernas Solidárias** numa instância EC2 com Docker Compose, com acesso público e HTTPS passando pela Cloudflare e entrega contínua via GitHub Actions + GHCR.

| Endereço | Serviço |
|---|---|
| `https://pernassolidarias.social.br` | Frontend de **produção** (React 19 + Vite servido pelo Nginx) |
| `https://pernassolidarias.social.br/api` | API Backend de **produção** (Node.js 20 + Express 5), via proxy reverso do Nginx; health check em `/api/health` |
| `https://www.pernassolidarias.social.br` | Redireciona para `https://pernassolidarias.social.br` |
| `https://monitor.pernassolidarias.social.br` | Observabilidade (**Grafana + Prometheus**), protegido por login, via Cloudflare Tunnel |
| `https://hml.pernassolidarias.social.br` *(opcional)* | Ambiente de **homologação** (branch `dev`, mesma arquitetura isolada — ver seção 10) |

**Por que sem Caddy e sem subdomínio `api.` separado:** o container `frontend` já usa **Nginx (`nginx:1.27-alpine`)** para servir a SPA. Configurando o próprio Nginx para encaminhar `/api/*` para `backend:3000`, o projeto roda com apenas **4 containers** (`tunnel`, `frontend`, `backend`, `db`), evita erros de CORS (mesma origem) e permite compilar o frontend uma única vez com `VITE_API_URL=/api` (imagem independente de domínio no GHCR).

**Como o acesso funciona:** o container `tunnel` (`cloudflared`) abre uma conexão de **saída** da EC2 até a Cloudflare. Quem acessa o site fala com a Cloudflare, que encerra o HTTPS e envia a requisição pelo túnel até o Nginx (`frontend:80`). Por isso **nenhuma porta de entrada fica aberta na EC2** (nem 80, nem 443, nem 3000) e o IP do servidor não fica exposto.

```text
Usuário ──HTTPS──► Cloudflare ══túnel══► tunnel ──► frontend (Nginx:80) ──► backend (Express:3000) ──► db (Postgres 16)
                                                     ├─ /      (SPA React/Vite)
                                                     └─ /api/* (proxy reverso → backend:3000)
                                          (tudo dentro da EC2, rede interna do Docker)
```

### Arquivos envolvidos no repositório

**Configurados para este deploy:**
- `docker-compose.prod.yml`: sem `ports:` expostas no host, nomes de container parametrizados por `${AMBIENTE:-prod}` (permite rodar produção e homologação sem conflito), serviço `tunnel` (`cloudflared` com `TUNNEL_TOKEN`), `healthcheck` no `backend` (via `node -e "fetch(...)"`, sem depender de `curl`) e no `frontend` (via `wget`), além das imagens do GHCR com suporte à variável opcional `TAG_IMAGEM` e fallback de `build:`;
- `frontend/nginx.conf`: bloco `location ^~ /api/` com `resolver 127.0.0.11 valid=10s` (evita `502` quando o IP interno do `backend` muda após recriação), `proxy_pass` preservando `Content-Disposition` e cabeçalhos de proxy/segurança;
- `backend/Dockerfile.prod`: comando `CMD ["sh", "-c", "node dist/database/setup.js && exec node dist/server.js"]`, garantindo inicialização idempotente do schema/seed e repasse correto de `SIGTERM` ao Node;
- `.github/workflows/ci.yml`: pipeline de CI reutilizável (`workflow_call`) com build, `db:init`, `db:reset` e testes unitários Vitest de backend e frontend;
- `.github/workflows/cd.yml`: executa o CI no merge em `main` (tags `latest` / `sha-<commit>`) e em `dev` (tags `dev` / `dev-sha-<commit>`) e publica as imagens no GHCR (`permissions: packages: write`);
- `deploy/env.producao.example`: modelo do `.env` de produção/homologação;
- `deploy/backup.sh`: backup diário/pré-deploy do PostgreSQL por ambiente com `pg_dump --clean --if-exists` e rotação de 7 dias;
- `deploy/atualizar.sh`: atualização automática (modelo *pull*) protegida com `flock` por ambiente, backup pré-deploy, reload do Nginx, validação de `/api/health`, limpeza de imagens antigas, rollback automático e marcação da imagem com falha como rejeitada (evitando loop de rollback).

---

## 1. Domínio na Cloudflare

O domínio continua registrado no Registro.br (ou outro registrador); só o **DNS** passa para a Cloudflare.

1. No painel da Cloudflare: **Adicionar um domínio** → `pernassolidarias.social.br` → plano **Free**.
2. A Cloudflare mostra **dois servidores de nomes** (algo como `xxx.ns.cloudflare.com`). Anote.
3. No Registro.br: abra o domínio → **Alterar servidores DNS** → troque pelos dois servidores da Cloudflare e salve.
4. Aguarde a Cloudflare mostrar o domínio como **Ativo** (leva de alguns minutos a algumas horas).

Não crie registros `A` nem `CNAME` manualmente: o túnel cria os registros sozinho no passo 5.

---

## 2. Criar a instância EC2

No console da AWS, vá em **EC2 → Executar instância**.

> **Escolha da região e LGPD:** diferente de sistemas que guardam apenas dados operacionais, o Pernas Solidárias armazena **dados pessoais** (nome, CPF, telefone, data de nascimento, sexo) e **dados sensíveis relacionados à deficiência** (condição de cadeirante e cadeira própria).
> - **Recomendado:** **América do Sul (São Paulo) `sa-east-1`** — menor latência (~10–30 ms) e dados mantidos em território brasileiro, simplificando a conformidade com a LGPD.
> - **Alternativa econômica / Free Tier restrito:** **Estados Unidos (Ohio) `us-east-2`** — cerca de 30–40% mais barato (latência ~120–150 ms, amenizada pelo cache de estáticos na Cloudflare). Caso use Ohio, mantenha o volume EBS criptografado e documente a transferência internacional conforme a LGPD (art. 33).

| Campo | Valor |
|---|---|
| Nome | `pernas-solidarias-prod` |
| Imagem (AMI) | Ubuntu Server 24.04 LTS (64-bit x86) |
| Tipo | `t3.micro` (2 vCPUs, 1 GB RAM). A stack (Postgres 16 + Express + Nginx estático + cloudflared) é leve e o build das imagens roda no GitHub Actions; o passo 3 cria 2 GB de swap para folga. Se quiser mais margem, use `t3.small` (2 GB) |
| Par de chaves | Crie um novo (`pernas-solidarias-prod`, tipo ED25519, formato `.pem`) e guarde em local seguro |
| Armazenamento | 20 GB, `gp3`, com **criptografia EBS habilitada** (o banco é puramente relacional, sem upload de mídia) |

Em **Configurações de rede → Editar**:
- **Atribuir IP público automaticamente:** **Habilitar** (a EC2 precisa de acesso de saída para baixar pacotes/imagens e conectar à Cloudflare);
- Crie um grupo de segurança `pernas-solidarias-prod-sg` com **uma única** regra de entrada:

| Tipo | Porta | Origem | Motivo |
|---|---|---|---|
| SSH | 22 | **Meu IP** | Acesso administrativo ao servidor, restrito ao seu IP |

**Não abra** as portas 80, 443, 3000, 5173 nem 5432: com o túnel, nada precisa entrar diretamente na EC2.

> **Sem Elastic IP:** o IP público pode mudar se a instância for parada e religada, mas a aplicação não depende dele (o túnel se reconecta automaticamente). Só o comando de SSH muda para o novo IP exibido no console.

---

## 3. Preparar o servidor

Acesse por SSH (no Windows, via PowerShell ou Git Bash) usando o IP público da instância:

```bash
ssh -i pernas-solidarias-prod.pem ubuntu@IP_PUBLICO
```

Dentro do servidor:

```bash
# Atualizações e fuso horário de Brasília
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone America/Sao_Paulo

# Docker e Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Swap de 2 GB (garante estabilidade na t3.micro, inclusive em builds emergenciais)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Saia (`exit`) e entre novamente por SSH para aplicar o grupo `docker`.

---

## 4. Baixar o código

Clone o repositório na EC2:

```bash
git clone https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias.git
cd Pernas_Solidarias
git switch main
```

---

## 5. Criar o túnel na Cloudflare

1. Painel da Cloudflare → **Zero Trust** (na primeira vez peça o plano **Free**).
2. **Networks → Tunnels → Criar um túnel** → tipo **Cloudflared** → nome `pernas-solidarias-prod`.
3. Na tela de instalação, escolha **Docker** e copie **apenas o token** (o texto depois de `--token eyJ...`). Trate esse token como senha: nunca commite nem compartilhe.
4. Em **Public Hostnames**, crie duas entradas apontando para o Nginx do container `frontend`:

| Subdomínio | Domínio | Serviço |
|---|---|---|
| *(vazio)* | `pernassolidarias.social.br` | `http://frontend:80` |
| `www` | `pernassolidarias.social.br` | `http://frontend:80` |
| `monitor` | `pernassolidarias.social.br` | `http://grafana:3000` |

A Cloudflare cria os registros DNS automaticamente. Para padronizar o endereço, crie em **Rules → Redirect Rules** uma regra usando o modo **Wildcard pattern**, redirecionando `https://www.pernassolidarias.social.br/*` (status `301`) para `https://pernassolidarias.social.br/${1}` com **Preserve query string** marcado.

---

## 6. Configurar o `.env`

No servidor, na raiz do projeto:

```bash
cp deploy/env.producao.example .env
nano .env
```

Preencha com valores de produção (**nunca** reutilize segredos ou senhas de desenvolvimento):

```env
# Identificação do ambiente (prod para produção, hml para homologação)
AMBIENTE=prod

# Banco de dados PostgreSQL
DB_USER=postgres
DB_PASSWORD=GERE_COM_openssl_rand_-hex_24
DB_NAME=pernas_solidarias

# Autenticação JWT e CORS
JWT_SECRET=GERE_COM_openssl_rand_-hex_32
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://pernassolidarias.social.br

# Coordenador inicial (seed na primeira subida)
INITIAL_ADMIN_EMAIL=admin@pernassolidarias.org.br
INITIAL_ADMIN_PASSWORD=SENHA_FORTE_E_NOVA

# Frontend (proxy reverso no mesmo domínio via Nginx)
VITE_API_URL=/api

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=SEU_TOKEN_DO_PASSO_5

# Tag das imagens no GHCR (opcional — padrão: latest; use sha-<commit> para rollback manual)
# TAG_IMAGEM=latest
```

Gere as chaves aleatórias diretamente no servidor:

```bash
openssl rand -hex 24   # usar em DB_PASSWORD
openssl rand -hex 32   # usar em JWT_SECRET
```

Restrinja a permissão do arquivo:

```bash
chmod 600 .env
```

---

## 7. Subir o sistema e validar

No primeiro deploy (ou antes de ativar o CD no GHCR):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Acompanhe a inicialização (o `backend` executa `setup.js` automaticamente para criar tabelas, índices, triggers de CPF e o coordenador inicial):

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f tunnel frontend backend
```

No painel da Cloudflare, o túnel deve aparecer como **Healthy**.

### Checklist de validação

1. `https://pernassolidarias.social.br/api/health` responde `200 OK` com `{"status":"ok","timestamp":"..."}`;
2. `https://pernassolidarias.social.br` abre a tela de login com cadeado HTTPS válido;
3. `https://www.pernassolidarias.social.br` redireciona para `https://pernassolidarias.social.br`;
4. Login com `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` funciona;
5. Cadastro de evento/participante, formação de duplas e exportação de planilha Excel (`/api/export`) funcionam normalmente (download com nome do arquivo preservado).

### Ajustes recomendados na Cloudflare

- **SSL/TLS → Edge Certificates:** ative **Always Use HTTPS**;
- **Security → Settings:** mantenha **Bot Fight Mode** ativo;
- **Caching:** não faça cache de `/api/*` (crie uma Cache Rule dando *Bypass cache* quando o URI Path começar com `/api/`).

---

## 8. Backup automático do banco

Como o banco guarda cadastros de eventos, cadeirantes, condutores e duplas, configure backups diários:

```bash
mkdir -p ~/backups
crontab -e
```

Adicione a linha (backup diário às 3h, mantendo os últimos 7 dias):

```cron
0 3 * * * /bin/bash /home/ubuntu/Pernas_Solidarias/deploy/backup.sh >> /home/ubuntu/backups/backup.log 2>&1
```

Teste manualmente uma vez: `bash deploy/backup.sh`.

Para cópia fora do servidor, crie snapshots periódicos do volume em **EC2 → Volumes → Ações → Criar snapshot** ou baixe um dump pontual:

```bash
scp -i pernas-solidarias-prod.pem ubuntu@IP_PUBLICO:~/backups/pernas_solidarias_prod_AAAA-MM-DD_030000.sql.gz .
```

**Restaurar um backup** (substitui os dados atuais — os dumps gerados por `deploy/backup.sh` já usam `--clean --if-exists`):

```bash
source .env
docker compose -f docker-compose.prod.yml stop backend
gunzip -c ~/backups/ARQUIVO.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -v ON_ERROR_STOP=1 -U "${DB_USER:-postgres}" -d "${DB_NAME:-pernas_solidarias}"
docker compose -f docker-compose.prod.yml start backend
```

---

## 9. CI/CD: atualização automática e rollback

O fluxo elimina deploy manual via SSH/FTP: o GitHub Actions valida e publica as imagens, e a EC2 puxa novas versões automaticamente.

```text
PR para dev/main ──► CI (.github/workflows/ci.yml: build, db:init/reset, testes Vitest)
merge na dev  ─────► CD (.github/workflows/cd.yml): roda CI + publica imagens GHCR (dev e dev-sha-<commit>)
merge na main ─────► CD (.github/workflows/cd.yml): roda CI + publica imagens GHCR (latest e sha-<commit>)
EC2 (cron, 5 min) ─► deploy/atualizar.sh: puxa imagens novas ─► backup ─►
                     troca containers ─► valida /api/health ─► (falhou? rollback + rejeita imagem)
```

- **CI (`.github/workflows/ci.yml`):**
  - `Backend (Build & Database Init)`: compila TypeScript, testa `npm run db:init` e `npm run db:reset` em um PostgreSQL 16 limpo e roda os testes unitários Vitest (`npm run test`);
  - `Frontend (Typecheck & Build)`: valida tipagem (`tsc -b`), faz build do Vite e executa testes Vitest.
- **CD (`.github/workflows/cd.yml`):** no merge em `main` ou `dev`, reutiliza o CI (`workflow_call`) e publica (com `permissions: packages: write`):
  - `ghcr.io/luizfelipeschrodermarcon/pernas-solidarias-backend`
  - `ghcr.io/luizfelipeschrodermarcon/pernas-solidarias-frontend` (compilada com `VITE_API_URL=/api`)
  com as tags `latest` / `sha-<commit>` (na `main`, para produção) e `dev` / `dev-sha-<commit>` (na `dev`, para homologação).
- **Servidor (`deploy/atualizar.sh`, no cron):** modelo *pull*, sem porta de entrada e sem credenciais da AWS armazenadas no GitHub. Usa `flock` por ambiente para evitar execuções concorrentes, atualiza o repositório, baixa as imagens do GHCR e, se houver nova versão ainda não rejeitada, faz backup do PostgreSQL, recria os containers, recarrega o Nginx e aguarda o health check (`/api/health`) ficar saudável. Se falhar em até 4 minutos, volta automaticamente para as imagens anteriores e **marca a versão quebrada como rejeitada** em `~/.pernas-solidarias-rejected-<ambiente>` (evitando loop de rollback a cada 5 minutos até sair outra imagem no GHCR); se tiver sucesso, limpa imagens antigas não utilizadas (mais de 7 dias) para preservar espaço em disco.

### Configuração única

1. **Visibilidade dos pacotes no GHCR:** após o primeiro CD, confirme em **GitHub → Packages** que `pernas-solidarias-backend` e `pernas-solidarias-frontend` estão públicos (ou autentique a EC2 com um PAT `read:packages` caso o repositório seja privado — as imagens não contêm segredos).
2. **Primeira troca na EC2 para imagens do GHCR:**

   ```bash
   cd ~/Pernas_Solidarias && git pull --ff-only
   docker compose -f docker-compose.prod.yml pull backend frontend
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **Agendar atualização automática (`crontab -e`):**

   ```cron
   */5 * * * * /bin/bash /home/ubuntu/Pernas_Solidarias/deploy/atualizar.sh >> /home/ubuntu/deploy.log 2>&1
   ```

4. **Proteção de branches** (**GitHub → Settings → Branches**): em `dev` e `main`, exigir Pull Request e os checks obrigatórios **Backend (Build & Database Init)** e **Frontend (Typecheck & Build)**.

### Operação e rollback

- **Acompanhar deploys:** `tail -f ~/deploy.log` na EC2 e aba **Actions** no GitHub.
- **Rollback manual (fixar versão):** adicione `TAG_IMAGEM=sha-abc1234` no `.env` (tag do commit no GHCR) e execute `docker compose -f docker-compose.prod.yml up -d`. Remova a linha para voltar a acompanhar `latest`.
- **Evolução do banco (`init-database.sql`):** o script `setup.js` roda na subida do backend e é idempotente (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). Mantenha alterações de schema retrocompatíveis com a versão anterior para que o rollback de imagem funcione sem quebrar o banco; no pior caso, restaure o dump feito automaticamente antes do deploy (seção 8).
- **Emergência sem GHCR:** `docker compose -f docker-compose.prod.yml up -d --build` reconstrói as imagens localmente no servidor.

---

## 10. Ambiente de Homologação (opcional)

Os mesmos arquivos (`docker-compose.prod.yml`, `deploy/atualizar.sh`, `deploy/backup.sh` e `.github/workflows/cd.yml`) já suportam subir um ambiente de **homologação** (`https://hml.pernassolidarias.social.br`) acompanhando a branch `dev` (tag `dev` no GHCR), com banco, containers, backups e logs totalmente isolados da produção.

Você pode escolher entre dois formatos:

- **Opção A — Na mesma EC2 (sem custo extra de instância/IP):** recomendável usar `t3.small` (2 GB RAM) para rodar os dois ambientes com folga. Clone o repositório em uma pasta separada (`~/Pernas_Solidarias_hml`) na branch `dev` — o Docker Compose isola redes e volumes automaticamente por diretório.
- **Opção B — Em uma segunda EC2 dedicada (isolamento total):** repita os passos 2 a 4 em uma instância `pernas-solidarias-hml` (pode ficar parada fora de testes para economizar, pagando só o EBS).

### Passos para ativar a homologação

1. **Criar um segundo túnel na Cloudflare** (`Zero Trust → Networks → Tunnels → Criar um túnel` → nome `pernas-solidarias-hml`) e adicionar o *Public Hostname*:
   - Subdomínio `hml` · Domínio `pernassolidarias.social.br` · Serviço `HTTP` → `frontend:80`.
   - *(Opcional, recomendado)* Em **Zero Trust → Access → Applications**, proteja `hml.pernassolidarias.social.br` com login por e-mail da equipe (plano Free) para que apenas testadores acessem a homologação.
2. **Clonar na branch `dev` e configurar o `.env`:**

   ```bash
   git clone -b dev https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias.git ~/Pernas_Solidarias_hml
   cd ~/Pernas_Solidarias_hml
   cp deploy/env.producao.example .env
   nano .env
   chmod 600 .env
   ```

   Ajuste no `.env` de homologação (usando senhas/segredos **diferentes** de produção):
   - `AMBIENTE=hml`
   - `CORS_ORIGIN=https://hml.pernassolidarias.social.br`
   - `CLOUDFLARE_TUNNEL_TOKEN=<token do túnel hml>`
   - `TAG_IMAGEM=dev` (descomente a linha)
3. **Subir e agendar atualização automática no `crontab -e`:**

   ```bash
   cd ~/Pernas_Solidarias_hml
   docker compose -f docker-compose.prod.yml pull backend frontend
   docker compose -f docker-compose.prod.yml up -d
   ```

   ```cron
   */5 * * * * /bin/bash /home/ubuntu/Pernas_Solidarias_hml/deploy/atualizar.sh >> /home/ubuntu/deploy-hml.log 2>&1
   ```

---

## 11. Custos estimados

Valores aproximados sob demanda (confira na [calculadora da AWS](https://calculator.aws)):

| Item | São Paulo (`sa-east-1`) | Ohio (`us-east-2`) |
|---|---|---|
| EC2 `t3.micro` ligada 24h | ~US$ 12,10/mês | ~US$ 7,60/mês |
| IPv4 público da instância | ~US$ 3,65/mês | ~US$ 3,65/mês |
| Disco EBS 20 GB `gp3` | ~US$ 2,15/mês | ~US$ 1,60/mês |
| Cloudflare (DNS, HTTPS e Tunnel) | Grátis (plano Free) | Grátis (plano Free) |
| Domínio `.social.br` (Registro.br) | ~R$ 3,50/mês (R$ 40/ano) | ~R$ 3,50/mês (R$ 40/ano) |
| **Total AWS estimado** | **~US$ 17,90/mês** | **~US$ 12,85/mês** |

> Em contas AWS dentro do Free Tier ou com créditos promocionais, o custo da instância e do disco pode ser coberto pelos créditos/franquia (atente-se ao prazo de validade para migrar para o plano pago antes do encerramento da conta gratuita). Fora de períodos de uso/avaliação, é possível parar a instância para economizar (apenas o disco EBS continua sendo cobrado).
