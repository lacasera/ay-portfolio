# ay-portfolio — hybrid fashion search

<!--
  The "office bag" claim below is present-tense about aboutyou.com's live behaviour.
  It was true when this was written; the site can change. Re-check the live query
  before you publish or send this README.
-->

On [aboutyou.com](https://www.aboutyou.com), searching **"office bag"** returns crossbody and messenger bags at the top while the **Business & laptop bags** category. The products someone actually mean stays buried. 

This is the classic failure of keyword-only search: "office bag" shares the token "bag" with half the catalog, and BM25 has no way to know that "office bag" _means_ a work bag. The right products never say "office" in their titles, so there's nothing for a keyword engine to match on.

This project is a search engine that fixes that. It runs the same query two ways — plain keyword (BM25) and hybrid (BM25 fused with semantic vector search) — over a fashion catalog modelled on ABOUT YOU, so you can see the bug and the fix side by side. It also has a live weight slider, per-hit "why this result" explanations, and a set of curated fashion synonyms.

## The fix, measured

The same query, `office bag`, run against the same 1,003-product catalog. Keyword mode ranks by BM25; hybrid mode fuses BM25 with semantic similarity (weights 0.3 / 0.7).

| Rank | Keyword-only (the bug)                   | Hybrid (the fix)                                |
| ---- | ---------------------------------------- | ----------------------------------------------- |
| 1    | Shoulder Bag 'VICENZA' — _Shoulder bags_ | Briefcase 'ASCOT' — _Business & laptop bags_    |
| 2    | Handbag 'VICTORIA' — _Handbags_          | Document Bag 'LUCCA' — _Business & laptop bags_ |
| 3    | Handbag 'CAMELLIA' — _Handbags_          | Work Tote 'PAULA' — _Business & laptop bags_    |
| 4    | Handbag 'ROSIE' — _Handbags_             | Briefcase 'MAYFAIR' — _Business & laptop bags_  |
| 5    | Handbag 'AUDREY' — _Handbags_            | Shoulder Bag 'VICENZA' — _Shoulder bags_        |

In keyword mode the first **Business & laptop bags** product doesn't appear until **rank 26** — the top 25 are all handbags and shoulder bags. In hybrid mode, **9 of the top 10** are business bags. Nothing about the products changed; only the retrieval did.

**Latency** (per-request `took_ms` — the API round-trip, measured over 30 warm runs on a single node):

| Mode    | Median | p95    |
| ------- | ------ | ------ |
| Keyword | ~14 ms | ~25 ms |
| Hybrid  | ~36 ms | ~42 ms |

Hybrid runs an extra vector clause, so it costs more, but stays well inside interactive range. (The first cold hybrid query is slower — a few hundred ms — while the model warms up.)

## About the data

The catalog is **synthetic**, generated from ABOUT YOU's real, publicly observable taxonomy, brands, pricing, and naming conventions, with product descriptions written by an LLM. That was a deliberate choice, and it's worth stating plainly:

- **The demo has to be reliable.** The whole point is that "office bag" surfaces business bags on cue and the fix is visually obvious. Generating the catalog let me engineer the lexical gap on purpose — the Business & laptop bags products describe themselves as "commuter", "15-inch laptop compartment", "professional", and never with the literal word "office" — so keyword search provably fails and semantic search provably fixes it.
- **It's defensible.** A representative catalog modelled on a public taxonomy is something to show a prospective employer with a clear conscience; a scraped copy of their production catalog is not.

The shipped catalog (`backend/data/catalog.csv`, 1,003 products, 116 of them Business & laptop bags) is the artifact this repo runs on; the generator that produced it isn't included. Note the lexical gap is scoped to the products that should win — the token "office" does appear a handful of times elsewhere in the catalog (a few blazers and skirts), just never in a business-bag title or description.

## Architecture

The repo is an npm-workspaces monorepo with three workspaces: `backend`, `frontend`, and `packages/shared`. `@ay/shared` ([packages/shared/src/index.ts](packages/shared/src/index.ts)) holds the request/response contracts — `SearchRequest`, `SearchResponse`, `Explanation`, `ProductDocument` and friends — so the backend and frontend agree on shapes from one source.

- **Backend** — Express 4 with TypeORM and the official `@opensearch-project/opensearch` client. It runs on `tsx` in dev and is tested with `vitest`. Code sits under `backend/src/{api,db,search}`.
- **Frontend** — React 18 + Vite 5 + Tailwind v4, talking to the API through a small `ApiClient` over native fetch.
- **Search** — a single-node OpenSearch 2.17 cluster. Embeddings are produced inside the cluster: an ingest pipeline runs each product's `embed_text` through the `all-MiniLM-L6-v2` model (384-dim, cosine similarity over an HNSW index) and stores the vector on the document. The hybrid query fuses a BM25 clause and a k-NN clause through a normalization-processor (`min_max` normalization, `arithmetic_mean` combination, default weights 0.3 keyword / 0.7 semantic).

**Why embed inside OpenSearch.** The design choice a reviewer will look at first is where the vectors live and who makes them. Doing it natively keeps the hybrid query a single request — one `hybrid` query with a search pipeline normalizes and fuses both clauses, instead of joining two datastores in application code — and a `text_embedding` ingest processor vectorises documents automatically, so there's no embedding code in the app and no external key to manage. The alternatives were considered and rejected: an external embedding API (adds a network hop and a key, splits responsibility), a dedicated vector database (a store, not an embedding source — you'd still need a model, plus a second datastore and app-layer fusion for no gain at this scale), and a message-queue embedding pipeline (the right tool for high-volume continuous embedding, overkill for a one-time batch). The honest tradeoff: for the demo the model runs on the data node (`only_run_on_ml_node: false`), which OpenSearch's own docs call "not recommended for production" — a dedicated ML node is the production path.

**Why Postgres.** Postgres is the write-side source of truth; the OpenSearch index is a derived read model built from it (`catalog.csv → Postgres (db:seed) → OpenSearch (search:index)`). Keeping the two separate means the index can be dropped and rebuilt from a durable store at any time, which is how you'd actually run search in production — reindexing is routine, and you don't want your search cluster to be the only copy of the data.

## How the demo works

- **Keyword vs hybrid toggle** ([frontend/src/components/ModeToggle.tsx](frontend/src/components/ModeToggle.tsx), wired in [App.tsx](frontend/src/App.tsx)). Keyword mode is BM25 over `name`, `description`, and `brand` — this is where "office bag" fails. Flip to hybrid and the semantic clause pulls the work bags up. The app opens in hybrid so the fix shows first; toggle to keyword to see the original problem.
- **Weight slider** ([frontend/src/components/WeightSlider.tsx](frontend/src/components/WeightSlider.tsx), shown only in hybrid mode). Dragging it re-queries live and shifts the balance between keyword and semantic scoring. The slider drives `buildSearchConfig` ([frontend/src/constants.ts](frontend/src/constants.ts)), which the backend applies per request through an inline search pipeline (`ProductQueryBuilder.inlinePipeline`, [backend/src/api/query-builder.ts](backend/src/api/query-builder.ts)) — so the weights are request-scoped and the API stays stateless.
- **Relevance tuning** ([backend/src/search/search-config.ts](backend/src/search/search-config.ts)). The index uses a `minimal_english` plural-only stemmer and a `fashion_synonyms` graph of about twenty groups (bag/handbag, sneaker/trainer, jumper/sweater, and so on). The synonyms deliberately stop at vocabulary — they don't bridge intent like office→business or gym→sports. That bridging is the semantic clause's job, and separating the two is the whole point of the demo.
- **"Why these results" explanations** ([frontend/src/components/ResultExplanation.tsx](frontend/src/components/ResultExplanation.tsx) + [frontend/src/lib/bm25.ts](frontend/src/lib/bm25.ts), backed by [backend/src/api/search-service.ts](backend/src/api/search-service.ts)). Each hit can be expanded to show why it ranked where it did. In keyword mode you get the per-term BM25 contributions; in hybrid mode you get the keyword rank/score, the semantic rank/score, and the fused score, with a one-line plain-English summary.

## Setup

```bash
npm install
```

This installs dependencies for all workspaces.

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

The frontend dev server proxies `/api/*` to the backend. Open http://localhost:5173:

- **Empty search box → browse** the catalog with category/segment/premium filters, sorting, and pagination.
- **Type a query → search.** The **keyword ↔ hybrid** toggle is the demo: search `office bag` in **keyword** mode and business/laptop bags are buried; flip to **hybrid** and they jump to the top. Hit count and `took_ms` are shown.

The React/Vite frontend, the Express backend, and the shared API types (`@ay/shared`) all live in the npm workspaces; the request/response types have a single source of truth in `packages/shared`.

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
| `backend/.env`  | `PORT` the Express server listens on, plus `DATABASE_URL` and the `OPENSEARCH_*` connection settings.                                              |
| `frontend/.env` | `VITE_PROXY_TARGET` for local dev (docker overrides it to `http://backend:3001`).                                                                  |

To run Docker alongside a local dev session already using 3001/5173, set different host ports, e.g.:

```bash
BACKEND_HOST_PORT=13001 FRONTEND_HOST_PORT=15173 docker compose up --build
```

**Notes**

- After changing dependencies, rebuild and renew the cached `node_modules` volumes: `docker compose up --build -V`.
- File-watching inside the containers uses polling (set via env in `docker-compose.yml`) for reliable reloads on macOS bind mounts. If backend restarts don't fire on save, that's the knob to check.

## Database seeding

The product catalog (`backend/data/catalog.csv`, ~1,000 products) is loaded into a Postgres `products` table, the system-of-record from which the search index is later derived.

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

- **`GET /health`** — cluster status plus index and model readiness. Returns `200` with `status: "healthy"`, or `503` with `status: "degraded"` when the index or model isn't ready.

The per-request hybrid weights the slider sends are applied via an inline search pipeline, so the API stays stateless. Invalid input returns `400`; a search issued before the model is deployed returns `503`.

## Testing

The backend is covered by a `vitest` suite (36 tests) across the query builder, the request and listing parsers, the seeder's CSV decoding and validation, and the fusion/explanation assembly in the search service — the last with OpenSearch faked out so the tests stay fast and offline:

```bash
npm run test --workspace=backend
```

Frontend tests are the next step; the search hook and the weight-config maths are the parts worth covering there.
