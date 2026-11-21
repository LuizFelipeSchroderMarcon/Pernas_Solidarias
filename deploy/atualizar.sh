#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Atualização automática (modelo pull) com backup pré-deploy, proteção contra
# loop de rollback (imagem rejeitada) e rollback automático.
# Suporta produção (AMBIENTE=prod, TAG_IMAGEM=latest) e homologação (AMBIENTE=hml, TAG_IMAGEM=dev).
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_DIR}/.env"

cd "${PROJECT_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[$(date -Is)] ERRO: Arquivo ${ENV_FILE} não encontrado." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

AMBIENTE="${AMBIENTE:-prod}"
TAG="${TAG_IMAGEM:-latest}"
LOCK_FILE="/tmp/pernas-solidarias-atualizar-${AMBIENTE}.lock"
REJECTED_FILE="${HOME}/.pernas-solidarias-rejected-${AMBIENTE}"

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "[$(date -Is)] [${AMBIENTE}] Outra execução de atualizar.sh já está em andamento. Saindo."
  exit 0
fi

BACKEND_CONTAINER="pernas_backend_${AMBIENTE}"
FRONTEND_CONTAINER="pernas_frontend_${AMBIENTE}"
BACKEND_IMAGE="ghcr.io/luizfelipeschrodermarcon/pernas-solidarias-backend:${TAG}"
FRONTEND_IMAGE="ghcr.io/luizfelipeschrodermarcon/pernas-solidarias-frontend:${TAG}"

get_container_image_id() {
  local container_name="$1"
  docker inspect --format='{{.Image}}' "${container_name}" 2>/dev/null || true
}

get_image_id() {
  local image_ref="$1"
  docker image inspect --format='{{.Id}}' "${image_ref}" 2>/dev/null || true
}

wait_for_health() {
  local max_attempts=48 # 48 * 5s = 4 minutos
  local attempt=1

  while (( attempt <= max_attempts )); do
    if docker compose -f "${COMPOSE_FILE}" exec -T frontend \
      wget -qO- http://127.0.0.1:80/api/health 2>/dev/null | grep -q '"status":"ok"'; then
      return 0
    fi
    sleep 5
    (( attempt++ ))
  done

  return 1
}

# 1. Atualiza o repositório local (compose, scripts, configs) sem sobrescrever alterações locais
git pull --ff-only >/dev/null 2>&1 || echo "[$(date -Is)] [${AMBIENTE}] Aviso: git pull --ff-only falhou; continuando com arquivos atuais."

# 2. Registra IDs das imagens atualmente em execução (para detectar mudanças e permitir rollback)
PREV_BACKEND_ID="$(get_container_image_id "${BACKEND_CONTAINER}")"
PREV_FRONTEND_ID="$(get_container_image_id "${FRONTEND_CONTAINER}")"

# 3. Baixa imagens configuradas no GHCR
docker compose -f "${COMPOSE_FILE}" pull -q backend frontend

NEW_BACKEND_ID="$(get_image_id "${BACKEND_IMAGE}")"
NEW_FRONTEND_ID="$(get_image_id "${FRONTEND_IMAGE}")"
NEW_SIGNATURE="${NEW_BACKEND_ID}|${NEW_FRONTEND_ID}"

if [[ "${PREV_BACKEND_ID}" == "${NEW_BACKEND_ID}" && "${PREV_FRONTEND_ID}" == "${NEW_FRONTEND_ID}" ]]; then
  exit 0
fi

# 4. Evita loop de rollback: ignora esta combinação de imagens se já foi rejeitada antes
if [[ -f "${REJECTED_FILE}" && "$(cat "${REJECTED_FILE}")" == "${NEW_SIGNATURE}" ]]; then
  exit 0
fi

echo "[$(date -Is)] [${AMBIENTE}] Nova versão detectada (tag: ${TAG}). Iniciando deploy..."

# 5. Backup preventivo do PostgreSQL antes de trocar os containers
if ! bash "${SCRIPT_DIR}/backup.sh"; then
  echo "[$(date -Is)] [${AMBIENTE}] ERRO: Backup pré-deploy falhou. Abortando atualização." >&2
  exit 1
fi

# 6. Aplica atualização dos containers de aplicação
docker compose -f "${COMPOSE_FILE}" up -d --no-build backend frontend
docker compose -f "${COMPOSE_FILE}" exec -T frontend nginx -s reload >/dev/null 2>&1 || true

# 7. Valida saúde da aplicação via Nginx -> Backend (/api/health)
if wait_for_health; then
  rm -f "${REJECTED_FILE}"
  echo "[$(date -Is)] [${AMBIENTE}] Deploy concluído e validado com sucesso!"
  # Limpa imagens não utilizadas com mais de 7 dias para preservar espaço no EBS
  docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true
  exit 0
fi

# 8. Rollback automático e marcação da versão quebrada como rejeitada até sair outra no GHCR
echo "[$(date -Is)] [${AMBIENTE}] ERRO: Health check falhou após 4 minutos. Iniciando rollback automático..." >&2
printf '%s\n' "${NEW_SIGNATURE}" > "${REJECTED_FILE}"

if [[ -n "${PREV_BACKEND_ID}" ]]; then
  docker tag "${PREV_BACKEND_ID}" "${BACKEND_IMAGE}"
fi
if [[ -n "${PREV_FRONTEND_ID}" ]]; then
  docker tag "${PREV_FRONTEND_ID}" "${FRONTEND_IMAGE}"
fi

docker compose -f "${COMPOSE_FILE}" up -d --no-build backend frontend
docker compose -f "${COMPOSE_FILE}" exec -T frontend nginx -s reload >/dev/null 2>&1 || true

if wait_for_health; then
  echo "[$(date -Is)] [${AMBIENTE}] Rollback concluído. Versão com falha marcada como rejeitada até nova publicação." >&2
else
  echo "[$(date -Is)] [${AMBIENTE}] CRÍTICO: Rollback executado, mas o health check ainda não respondeu OK. Verifique os logs." >&2
fi

exit 1
