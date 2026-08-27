#!/usr/bin/env bash
# Run every data step for the production stack, in dependency order:
#   setup (model + pipelines + index) -> seed (csv -> Postgres) -> index (Postgres -> OpenSearch)
# All three are idempotent, so this is safe to re-run on an existing deployment.
#
# Assumes the compose stack is already up. Override the compose invocation with
# COMPOSE_CMD (e.g. to add -f docker-compose.local.yml for the local smoke test).
# OPENSEARCH_INITIAL_ADMIN_PASSWORD must be present in the environment.
set -euo pipefail

COMPOSE_CMD=${COMPOSE_CMD:-"docker compose -f docker-compose.prod.yml"}
: "${OPENSEARCH_INITIAL_ADMIN_PASSWORD:?must be set (source .env.prod or use doppler run)}"

echo "==> Waiting for OpenSearch to report healthy..."
for i in $(seq 1 60); do
  if $COMPOSE_CMD exec -T opensearch-node1 \
    curl -sf -k -u "admin:${OPENSEARCH_INITIAL_ADMIN_PASSWORD}" \
    https://localhost:9200/_cluster/health >/dev/null 2>&1; then
    echo "    OpenSearch is up."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "!! OpenSearch did not become healthy in time" >&2
    exit 1
  fi
  sleep 5
done

echo "==> 1/3 search:setup  (register + deploy model, create pipelines + index)"
$COMPOSE_CMD run --rm backend node dist/search/setup.js

echo "==> 2/3 db:seed       (catalog.csv -> Postgres)"
$COMPOSE_CMD run --rm backend node dist/db/seeder/seed.js

echo "==> 3/3 search:index  (Postgres -> OpenSearch, embeddings generated in-cluster)"
$COMPOSE_CMD run --rm backend node dist/search/index-products.js

echo "==> Verifying via the backend..."
health=$($COMPOSE_CMD exec -T backend wget -qO- http://localhost:3001/health || true)
echo "    /health: ${health}"
total=$($COMPOSE_CMD exec -T backend wget -qO- "http://localhost:3001/api/products?size=1" 2>/dev/null \
  | sed -n 's/.*"total":\([0-9]*\).*/\1/p')
echo "    indexed products: ${total:-0}"
if [ "${total:-0}" -lt 1 ]; then
  echo "!! Verification failed: no products indexed" >&2
  exit 1
fi

echo "Bootstrap complete: ${total} products indexed."
