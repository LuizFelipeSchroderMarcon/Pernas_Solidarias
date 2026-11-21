#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Backup diário / pré-deploy do PostgreSQL — Pernas Solidárias
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-${HOME}/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[$(date -Is)] ERRO: Arquivo ${ENV_FILE} não encontrado." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

AMBIENTE="${AMBIENTE:-prod}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-pernas_solidarias}"

mkdir -p "${BACKUP_DIR}"
TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
TARGET_FILE="${BACKUP_DIR}/${DB_NAME}_${AMBIENTE}_${TIMESTAMP}.sql.gz"
TMP_FILE="${TARGET_FILE}.tmp"

echo "[$(date -Is)] [${AMBIENTE}] Iniciando backup do banco '${DB_NAME}'..."

# --clean --if-exists permite restaurar de forma limpa sobre um banco já existente
if ! docker compose -f "${COMPOSE_FILE}" exec -T db \
  pg_dump --clean --if-exists --no-owner --no-privileges -U "${DB_USER}" -d "${DB_NAME}" \
  | gzip -9 > "${TMP_FILE}"; then
  rm -f "${TMP_FILE}"
  echo "[$(date -Is)] [${AMBIENTE}] ERRO: Falha ao gerar dump do PostgreSQL." >&2
  exit 1
fi

if [[ ! -s "${TMP_FILE}" ]]; then
  rm -f "${TMP_FILE}"
  echo "[$(date -Is)] [${AMBIENTE}] ERRO: Arquivo de backup gerado está vazio." >&2
  exit 1
fi

mv "${TMP_FILE}" "${TARGET_FILE}"
chmod 600 "${TARGET_FILE}"

# Remove backups deste ambiente mais antigos que RETENTION_DAYS dias
find "${BACKUP_DIR}" -maxdepth 1 -type f -name "${DB_NAME}_${AMBIENTE}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date -Is)] [${AMBIENTE}] Backup concluído com sucesso: ${TARGET_FILE}"
