# ay-portfolio

A barebones monorepo with an Express backend and a React (Vite) frontend, wired together through a single API endpoint.

## Structure

```
.
├── backend/    # Express API — GET /api/hello
└── frontend/   # React app (Vite) that calls the backend
```

## Setup

```bash
npm install
```

This installs dependencies for both workspaces.

## Run

Run both together:

```bash
npm run dev
```

Or individually:

```bash
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

The frontend dev server proxies `/api/*` to the backend, so the React app fetches `/api/hello` and displays the message.

## Run with Docker

Dev containers with live reload for both services:

```bash
docker compose up --build   # or: npm run docker:up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Source is bind-mounted, so edits on the host hot-reload inside the containers. Inside Docker the frontend proxies `/api` to the backend by service name (`http://backend:3001`); running locally it falls back to `http://localhost:3001`, so `npm run dev` is unaffected.

Stop with `docker compose down` (or `npm run docker:down`).

### Environment files

Ports and config come from `.env` files (each has a committed `.env.example`; the `.env` files themselves are gitignored):

| File            | Purpose                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env` (root)   | **Host ports** published by docker compose — `BACKEND_HOST_PORT`, `FRONTEND_HOST_PORT`. Change these to avoid clashing with a local `npm run dev`. |
| `backend/.env`  | `PORT` the Express server listens on (read via `dotenv` locally and in the container).                                                             |
| `frontend/.env` | `VITE_PROXY_TARGET` for local dev (docker overrides it to `http://backend:3001`).                                                                  |

To run Docker alongside a local dev session already using 3001/5173, set different host ports, e.g.:

```bash
BACKEND_HOST_PORT=13001 FRONTEND_HOST_PORT=15173 docker compose up --build
```

**Notes**

- After changing dependencies, rebuild and renew the cached `node_modules` volumes: `docker compose up --build -V`.
- File-watching inside the containers uses polling (set via env in `docker-compose.yml`) for reliable reloads on macOS bind mounts. If backend restarts don't fire on save, that's the knob to check.

## Database seeding

The product catalog (`backend/data/catalog.csv`) is loaded into a Postgres `products` table, the system-of-record from which the search index is later derived.

1. Bring up Postgres:

   ```bash
   docker compose up -d postgres
   ```

2. Seed the database (idempotent — safe to re-run):

   ```bash
   # inside the backend container:
   docker compose exec backend npm run db:seed

   # or from the host (override the DB host to localhost):
   DATABASE_URL=postgres://ay:ay@localhost:5432/ay_catalog npm run db:seed
   ```

Postgres credentials and host port come from the root `.env` (`POSTGRES_*`); the backend reads `DATABASE_URL` from `backend/.env`. Data persists in the `pgdata` volume.

## Search indexing (OpenSearch)

A single-node OpenSearch cluster holds the search index. Embeddings are generated **inside OpenSearch** on ingest: the `products` index has a default pipeline whose `text_embedding` processor turns each product's `embed_text` into a 384-dim `embedding` vector (all-MiniLM-L6-v2). The indexer never computes vectors.

1. Bring up the cluster + Dashboards + one-shot setup. The `opensearch-setup` service registers and deploys the model, then creates the ingest pipeline, the `products` k-NN index, and the search pipeline (idempotent), and exits:

   ```bash
   docker compose up -d --build -V opensearch-node1 opensearch-dashboards opensearch-setup
   ```

   - OpenSearch: `https://localhost:9200` (admin / `OPENSEARCH_INITIAL_ADMIN_PASSWORD`)
   - Dashboards: `https://localhost:5601`

2. Project Postgres → OpenSearch (idempotent via `_id`; re-runs overwrite in place):

   ```bash
   # inside the container (after db:seed):
   docker compose exec backend npm run search:index

   # or from the host:
   DATABASE_URL=postgres://ay:ay@localhost:5432/ay_catalog \
   OPENSEARCH_NODE=https://localhost:9200 \
   OPENSEARCH_USERNAME=admin OPENSEARCH_PASSWORD=<pw> \
   npm run search:index --workspace=backend
   ```

The cluster runs with a 2g heap / 4g `mem_limit` — memory is the top failure mode, so give Docker enough RAM. `search:setup` runs automatically as a compose dependency of `backend`; run it manually with `npm run search:setup` if needed. The `osdata` volume persists the index. Config is demo-grade: self-signed TLS with the client verifying off (`OPENSEARCH_*` in `backend/.env`, admin password in root `.env`).

## Search & listing API

The backend serves a read API over the OpenSearch index (Postgres stays the write-side system-of-record).

- **`POST /api/search`** — the demo. Body: `{ q, size?, config: { mode: "keyword"|"hybrid", fields: {name,description,brand}, useSynonyms, hybrid: {keywordWeight, semanticWeight, k} } }`. Returns `{ query, config, took_ms, total, hits: [{ id, score, source, explanation }] }`. Keyword mode returns each hit's BM25 breakdown; hybrid mode returns the fusion view (keyword rank/score, semantic rank/score, fused).

  ```bash
  # reproduce the bug (keyword) vs fix it (hybrid)
  curl localhost:3001/api/search -H 'content-type: application/json' -d '{"q":"office bag","config":{"mode":"keyword"}}'
  curl localhost:3001/api/search -H 'content-type: application/json' -d '{"q":"office bag","config":{"mode":"hybrid","hybrid":{"keywordWeight":0.3,"semanticWeight":0.7,"k":50}}}'
  ```

- **`GET /api/products`** — browse. Query params: `page`, `size`, `category`, `segment`, `brand`, `color`, `premium`, `in_stock`, `minPrice`, `maxPrice`, `sort` (`relevance`|`price_asc`|`price_desc`|`rating_desc`). Returns `{ total, page, size, items }`.

  ```bash
  curl 'localhost:3001/api/products?category=Sneakers&sort=price_asc&size=5'
  ```

- **`GET /health`** — cluster status + index + model readiness (`200` healthy / `503` not ready).

Per-request hybrid weights (the future UI slider) are applied via an inline search pipeline, so the API stays stateless. Invalid input returns `400`; a search when the model isn't deployed returns `503`.
