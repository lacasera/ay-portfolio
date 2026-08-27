#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?set DEPLOY_HOST to the server IP/hostname}"
DEPLOY_USER=${DEPLOY_USER:-root}
REMOTE_DIR=${REMOTE_DIR:-/opt/ay-portfolio}
SSH="ssh ${DEPLOY_USER}@${DEPLOY_HOST}"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

echo "==> Syncing repo to ${REMOTE}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude '.git' --exclude 'node_modules' --exclude 'dist' \
  --exclude '.env' --exclude '.env.*' \
  ./ "${REMOTE}:${REMOTE_DIR}/"

echo "==> Providing .env.prod on the server"
if [ -f ./.env.prod ]; then
  echo "    using local ./.env.prod"
  $SSH "cat > ${REMOTE_DIR}/.env.prod && chmod 600 ${REMOTE_DIR}/.env.prod" <./.env.prod
else
  echo "    building from environment"
  $SSH "cat > ${REMOTE_DIR}/.env.prod && chmod 600 ${REMOTE_DIR}/.env.prod" <<EOF
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=${DATABASE_URL}
OPENSEARCH_NODE=${OPENSEARCH_NODE}
OPENSEARCH_USERNAME=${OPENSEARCH_USERNAME}
OPENSEARCH_PASSWORD=${OPENSEARCH_PASSWORD}
OPENSEARCH_INITIAL_ADMIN_PASSWORD=${OPENSEARCH_INITIAL_ADMIN_PASSWORD}
CADDY_SITE_ADDRESS=${CADDY_SITE_ADDRESS:-ay.barfiagyenim.dev}
EOF
fi

echo "==> Building + starting the stack"
$SSH "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"

echo "==> Bootstrapping data (setup -> seed -> index)"
$SSH "cd ${REMOTE_DIR} && set -a && . ./.env.prod && set +a && \
  COMPOSE_CMD='docker compose -f docker-compose.prod.yml --env-file .env.prod' \
  bash scripts/bootstrap-data.sh"

echo "==> Done: https://${CADDY_SITE_ADDRESS:-ay.barfiagyenim.dev}"
