# ay-portfolio — hybrid fashion search

**Live demo:** https://ay.barfiagyenim.dev

On [aboutyou.com](https://www.aboutyou.com), searching **"office bag"** returns crossbody and messenger bags at the top, while the **Business & laptop bags** category. The products someone actually means stays buried.
Keyword search shares the token "bag" with half the catalog and has no idea that "office bag" means a work bag, and the right products never say "office" in their titles.

This project runs the same query two ways. Keyword (BM25) search and Hybrid (BM25 fused with semantic vector search) over a 1,000-product catalog modelled on ABOUT YOU catalog, so you can see the bug and the fix side by side.
It also has a live keyword↔semantic weight slider and a per-result explanation of why each item ranked where it did.

## The fix, measured

`office bag` over the same 1,003-product catalog. Keyword ranks by BM25; hybrid fuses BM25 with semantic similarity (weights 0.3 / 0.7).

| Rank | Keyword-only (the bug)                   | Hybrid (the fix)                                |
| ---- | ---------------------------------------- | ----------------------------------------------- |
| 1    | Shoulder Bag 'VICENZA' — _Shoulder bags_ | Briefcase 'ASCOT' — _Business & laptop bags_    |
| 2    | Handbag 'VICTORIA' — _Handbags_          | Document Bag 'LUCCA' — _Business & laptop bags_ |
| 3    | Handbag 'CAMELLIA' — _Handbags_          | Work Tote 'PAULA' — _Business & laptop bags_    |
| 4    | Handbag 'ROSIE' — _Handbags_             | Briefcase 'MAYFAIR' — _Business & laptop bags_  |
| 5    | Handbag 'AUDREY' — _Handbags_            | Shoulder Bag 'VICENZA' — _Shoulder bags_        |

In keyword mode the first business bag lands at **rank 26**; in hybrid, **9 of the top 10** are business bags. Nothing about the products changed only the retrieval.

The catalog is synthetic, built from ABOUT YOU's public taxonomy, brands, and pricing, with the business bags deliberately never using the word "office" so the lexical gap is real and reproducible.

## Architecture

An npm-workspaces monorepo: `backend` (Express + TypeORM + Postgres), `frontend` (React + Vite + Tailwind), and `packages/shared` for the shared API types.

Search runs on a single-node **OpenSearch 2.17** cluster with the embedding model inside it. An ingest processor runs each product's text through `all-MiniLM-L6-v2` (384-dim) as it's indexed, and the hybrid query fuses a BM25 clause and a k-NN clause with a normalization-processor (`min_max`, `arithmetic_mean`, 0.3 / 0.7 weights).

Keeping the model in-cluster makes hybrid search a single request with no external embedding service; the tradeoff is that the model shares the data node, `which isn't how I'd run it in production`.

Postgres is the source of truth; the OpenSearch index is a read model derived from it (`catalog.csv → Postgres → OpenSearch`), so it can be dropped and rebuilt whenever the mapping or analyzers change.

## Run it locally

```bash
npm install
docker compose up --build
```

Frontend on http://localhost:5173, backend on http://localhost:3001. The first boot downloads the embedding model; once the stack is up, load the data:

```bash
docker compose exec backend npm run db:seed
docker compose exec backend npm run search:index
```

Then open the frontend, search `office bag`, and toggle keyword ↔ hybrid.

## Testing

```bash
npm run test --workspace=backend
```

36 vitest tests across the query builder, the request/listing parsers, the seeder, and the search service (with OpenSearch faked out). Frontend tests are the next step.
