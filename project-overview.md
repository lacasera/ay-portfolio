# Hybrid Fashion Search — Build Guide

A complete specification for building a **hybrid (lexical + semantic) product
search engine** from scratch, on OpenSearch, as a portfolio project. Written for
an engineer or agent starting from an empty directory. No prior code is assumed.

Build it in the order given in §10. Confirm the two open decisions in §4 before
writing code.

---

## 1. What you are building and why

A search engine over a fashion product catalog that combines keyword search with
semantic (vector) search, and demonstrates — on camera — that the hybrid version
fixes a real relevance bug that pure keyword search cannot.

**The motivating bug.** On a major fashion retailer's live site, searching
**"office bag"** returns crossbody and messenger bags at the top, while the
obviously-correct **"Business & laptop bags"** category is buried. This is the
signature failure of lexical-only search: "office bag" shares the token "bag"
with everything, and the engine has no notion that "office bag" _means_
business/laptop bag. There are no shared keywords between the query and the right
product titles beyond "bag," so BM25 cannot rank them well.

**The fix.** Semantic search embeds the query and the products into a shared
vector space where "office bag" lands near "business laptop bag" despite the
vocabulary mismatch. Hybrid search runs both keyword and semantic retrieval and
fuses the scores, getting the exact-match precision of keywords and the intent
understanding of vectors.

**The deliverable is a demo that proves this**, with a side-by-side view:

- **Keyword-only:** "office bag" → business/laptop bags buried (bug reproduced).
- **Hybrid:** "office bag" → business/laptop bags at the top (bug fixed).
- **A weight slider** (keyword ↔ semantic) that moves the correct results up in
  real time as semantic weight increases.

The audience is a senior/lead engineer reviewing a portfolio piece. The thing to
prove is **depth in search relevance**, not that a search box renders. Lead every
design decision and the eventual README with that goal.

---

## 2. Stack

- **Runtime:** Node.js (`node:20`). TypeScript runs via `tsx` in development
  (watch mode, no build step) and is compiled with `tsc` for production.
- **Backend:** Express + TypeScript. A thin, stateless HTTP API over OpenSearch.
- **Search engine:** OpenSearch (single node) with the **ML Commons**,
  **k-NN**, and **Neural Search** plugins — all bundled in the standard image.
  Embeddings are generated _inside_ OpenSearch; there is no external embedding
  service or separate vector database.
- **Frontend:** React + Vite + TypeScript. Search box, result list with a
  per-result explanation, a keyword↔semantic weight slider, and a
  keyword-vs-hybrid mode toggle for the side-by-side demo.
- **Packaging:** monorepo (npm workspaces), fully Dockerized via `docker
compose`, deployable to a single VPS.

Use strict TypeScript on both sides (`strict: true`, `noUncheckedIndexedAccess:
true`). Typed code is part of the signal for this role; no `any` escape hatches.

---

## 3. Why this architecture (put this reasoning in the README)

The design choice reviewers will judge is _where the vectors live and who makes
them_. This project does everything natively in OpenSearch. Justification:

- **Single-query hybrid.** OpenSearch's `hybrid` query runs the keyword and
  semantic clauses together; a search pipeline normalizes and fuses their scores.
  No fusing two datastores in application code.
- **Auto-embedding on ingest.** A `text_embedding` ingest processor turns product
  text into vectors automatically as documents are indexed. No embedding code in
  the app.
- **Self-contained.** One `docker compose`. No external SaaS, no API keys, no
  second datastore to operate.

**Alternatives considered and rejected — keep this list; knowing when _not_ to
add infrastructure is a seniority signal:**

- _External embedding API (OpenAI/Cohere) + OpenSearch k-NN_ — works, but adds a
  network hop and a key, and splits responsibility. Native keeps it in one place.
- _Dedicated vector DB (e.g. Pinecone)_ — a vector DB is a store, not an
  embedding source; you'd still need an embedding model, and you'd add a second
  datastore plus app-layer fusion for no benefit at this catalog size
  (~30–75k docs).
- _Message-queue embedding pipeline (e.g. RabbitMQ publisher/consumer)_ — the
  right tool for high-volume, continuous embedding with backpressure and retries;
  overkill for a one-time batch of demo products. Mention it in the
  "productionize" roadmap; do not build it.

**The honest tradeoff.** Running the embedding model inside OpenSearch costs
memory, and for a demo the model runs on the data node
(`plugins.ml_commons.only_run_on_ml_node: false`), which OpenSearch's own docs
call "not recommended for production." This is an acceptable, _stated_ demo
tradeoff — call it out in the README rather than hiding it. Note the production
path (dedicated ML nodes) in the roadmap.

---

## 4. OPEN DECISIONS — confirm before building

Do not guess these; they change the code and infra.

1. **VPS RAM** (sets OpenSearch heap). The model runs in-cluster, so this must be
   sized for search + model:
   - **4 GB:** heap `-Xms1g -Xmx1g`, OpenSearch `mem_limit: 2g`. Workable for a
     small model on a small catalog; tight.
   - **8 GB (recommended):** heap `-Xms2g -Xmx2g`, `mem_limit: 4g`. Comfortable.
   - **< 4 GB:** in-cluster embedding is not viable; you'd have to switch to an
     external embedding API. Flag this to the user rather than proceeding.

2. **Explanation depth.** Every result should show _why_ it ranked, but there are
   two levels of ambition:
   - **(A) Fusion view (simpler):** show each result's keyword score/rank, its
     semantic score/rank, and the fused score. Cohesive and honest.
   - **(B) Mode-aware view (more impressive, more work):** in keyword-only mode,
     show the full BM25 breakdown (tf / idf / field-length norm) explaining _why
     the bug happens_; in hybrid mode, show the fusion view explaining _why it's
     fixed_. This mirrors the reproduce-and-fix narrative directly.
   - Recommendation: (B) if the schedule allows — it _is_ the demo — else (A).

---

## 5. Data — generate a realistic ABOUT YOU-style catalog

We do **not** use a downloaded dataset. We generate a synthetic catalog modeled
on ABOUT YOU's real, publicly-observable taxonomy, brands, pricing, and naming
conventions. This is a deliberate choice, and the reasoning belongs in the README
because it reads as senior judgment:

- **The demo must be reliable.** The whole pitch hinges on "office bag" surfacing
  business/laptop bags on cue, and the fix being visually obvious. Generating the
  catalog lets us _engineer the office-bag case to work every time_, instead of
  hoping a downloaded slice happens to contain the right products.
- **It's defensible.** "A representative catalog modeled on your public taxonomy"
  is something to say with pride to their Tech Lead. Shipping their scraped
  production catalog is not — especially to the people whose systems you'd be
  signaling you'll scrape.
- **A generator is better engineering to show than a CSV download.** It proves you
  understood the retrieval problem well enough to construct data that exercises
  it — specifically, data where lexical search _provably fails_ and semantic
  search _provably fixes it_.

Honest tradeoff to manage: generated data looks generated if you're lazy about
it (repetitive titles, robotic descriptions). Mitigate by varying titles from
templates, generating believable human descriptions (LLM-assisted per item is
fine and encouraged), and calibrating brands/prices/categories against what the
site actually shows. Budget real time for description quality — it's the
difference between "looks like a catalog" and "looks synthetic."

### 5.1 Research already captured (from aboutyou.com, public site)

Bake this into the generator config. It's real, observed from their live site.

**Taxonomy (segment → category → subcategory).** Top segments: Women, Men, Kids.
Each has Clothing, Shoes, Sportswear, Accessories, Streetwear, Premium. The
demo-critical path is:

```
Accessories → Bags & backpacks → Bags → {
  Crossbody bags, Business & laptop bags, Bum bags,
  Backpacks, Shoulder bags, Handbags, Tote bags
}
```

Other useful category groups to give the catalog breadth (so search behaves
realistically, not just in bags):

- **Clothing:** Dresses, Jeans, Tops, Pants, Jackets, Sweaters & knitwear,
  Coats, Skirts, Blouses & tunics, Blazers, Sweaters & hoodies
- **Shoes:** Sneakers, Ankle boots, Boots, Sandals, High heels, Ballet flats,
  Slip-ons, Sports shoes
- **Accessories (beyond bags):** Jewelry, Scarves & Wraps, Hats & caps, Belts,
  Wallets & cases, Sunglasses, Smartphone cases
- **Sportswear:** Sports tops, Sports bottoms & leggings, Sports jackets,
  Running shoes, Outdoor shoes

**Real brands (use these; they're on the site).** Assign brands per category so
they're believable — bag brands on bags, sneaker brands on shoes:

- **Bags / accessories:** Guess, Liebeskind Berlin, Kapten & Son,
  Tommy Hilfiger, Coccinelle, Calvin Klein, HUGO, Diesel, Camel Active, bugatti
- **Shoes / sneakers:** adidas Originals, Nike Sportswear, New Balance, Puma,
  Birkenstock, Tamaris, Reebok Classics, Marco Tozzi
- **Clothing (mainstream):** ONLY, VERO MODA, VILA, PIECES, JDY, s.Oliver,
  LASCANA, NA-KD, American Vintage, MORE & MORE, Mavi
- **Premium:** Lauren Ralph Lauren, Polo Ralph Lauren, BOSS, Copenhagen Studios,
  American Vintage
- **Own / exclusive label:** ABOUT YOU, millane, NU-IN, RÆRE by Lorena Rae
- Tag Premium-brand or `premium` categories with a `premium: true` flag (the site
  surfaces a "Premium" badge — mirror it).

**Conventions to mirror:**

- **Currency EUR**, prices shown excl. VAT on their site. Use realistic ranges per
  category (e.g. mainstream bags €30–120, premium bags €150–400, sneakers
  €60–180, t-shirts €12–40, premium dresses €120–500).
- **Discounts/sale:** many items have an original + reduced price; model an
  `original_price` and a `discount_pct` on a subset.
- **Title style:** `<Type> '<Model/Name>'`, e.g. `Crossbody Bag 'MILANO'`,
  `Laptop Bag 'Ethon 2.0'`, `Sneakers 'Speed Strike'`. Model names are short,
  often a place/word in quotes, sometimes with a version number.
- **Sizing:** many bags are "One size"; clothing/shoes have size ranges.
- **Image CDN pattern (for realism of the field shape only):**
  `https://cdn.aboutstatic.com/file/images/<hash>?quality=75&height=480&width=360`.
  Do NOT harvest their real images (copyrighted, product-specific). See §5.4.

### 5.2 The generated document shape

Modeled on ABOUT YOU's real catalog conventions. This is the contract the whole
app codes against.

```ts
interface ProductDoc {
  id: string; // e.g. "ay-000123"
  name: string; // "Laptop Bag 'Ethon 2.0'"
  description: string; // varied, human-sounding (LLM-assisted)
  brand: string; // from the per-category brand list
  segment: "women" | "men" | "kids";
  category: string; // leaf category, e.g. "Business & laptop bags"
  category_path: string[]; // ["Accessories","Bags & backpacks","Bags","Business & laptop bags"]
  color: string;
  material: string | null; // "Leather", "Nylon", "Canvas"...
  premium: boolean; // mirrors their Premium badge
  price: number; // EUR, the current/selling price
  original_price: number | null;
  discount_pct: number | null;
  in_stock: boolean; // note: positive sense
  avg_rating: number | null; // 0..5
  rating_count: number | null;
  sizes: string[]; // ["One size"] or ["S","M","L"] or EU shoe sizes
  images: string[]; // placeholder URLs for now (§5.4), field shape real
  embed_text: string; // built at generation time (see §7)
}
```

The `embedding` vector is generated **server-side by OpenSearch** on ingest,
never set here, and always excluded from responses.

### 5.3 The office-bag case — design it deliberately

This is the point of the whole project; engineer it, don't leave it to chance.

- **Populate `Business & laptop bags` well** (e.g. 20–40 items) with titles and
  descriptions that a professional would want for "office bag" but that
  **deliberately avoid the literal token "office"**. Use the vocabulary a real
  catalog uses: "laptop bag", "business bag", "briefcase", "work tote",
  "15-inch laptop compartment", "commuter", "padded sleeve", "professional".
  This creates a genuine lexical gap: a keyword search for "office bag" has
  little to match, while the _meaning_ is clearly office-appropriate — exactly
  the gap semantic search closes.
- **Populate sibling bag categories** (Crossbody, Bum bags, Backpacks) with items
  that DO contain "bag" prominently, so pure keyword search over-ranks them for
  "office bag" (matching "bag") and buries the business bags — reproducing the
  live bug.
- **Keep a few honest keyword overlaps** so keyword search isn't strawmanned:
  hybrid should win on relevance, not because lexical was sabotaged. The
  demonstration is more credible if keyword search is _reasonable_ but semantic
  is _better_.
- Optionally include a handful of query→expectation pairs the generator knows
  about (e.g. "office bag", "gym bag", "beach bag", "weekend bag") so you can
  build an honest before/after evaluation, not just the one hero query.

### 5.4 Images (deferred)

Structure the `images` field now, source real images later. For the generator,
emit placeholder URLs (a local placeholder route, or category-colored tiles) with
the same shape a real entry would have (a primary + a small array, sized). The UI
renders image cards regardless, and swapping the placeholder base for real URLs
later is a one-line change the user controls. **Do not** harvest ABOUT YOU's real
product images into the dataset — they're copyrighted and product-specific.

### 5.5 The generator

A reproducible script (seeded RNG so runs are deterministic) that emits an array
of `ProductDoc` to a JSON file. Structure:

- **Config-driven:** a config object holds segments, the category tree with paths,
  per-category brand lists, per-category price ranges, materials, colors, and
  title templates. All the §5.1 research lives here.
- **Per category:** generate N products — pick a brand valid for that category, a
  color/material, build a title from a template + a model-name pool, set price
  (and sometimes original_price + discount), stock, rating, sizes.
- **Descriptions:** generate varied, believable copy. LLM-assisted per item is
  encouraged; if generating offline, use enough templated variation + attribute
  interpolation that they don't read identically. The business-bag descriptions
  specifically must sound office-appropriate without the literal query token
  "office" (§5.3).
- **Build `embed_text`** per item at generation time (§7).
- **Volume:** a few hundred to ~2,000 products total is plenty — enough for
  realistic search behavior and a fast index, small enough to generate and embed
  quickly. Over-weight the bags subtree for the demo.
- **Output:** `data/catalog.json` (array or NDJSON). This replaces any downloaded
  dataset; the ingest pipeline (§6) reads it directly.

Because the data is generated clean, the heavy "coerce a messy scrape" step is
unnecessary — but keep a thin validation pass (types, required fields, price
sanity, non-empty embed_text) so a malformed generated record fails loudly rather
than indexing garbage.

---

## 6. Ingestion pipeline

The data is generated clean (§5), so there is no scrape-cleaning step. Ingest is
straightforward: read `data/catalog.json`, validate, bulk-index into the k-NN
index whose default pipeline auto-embeds.

### 6.1 Validate, don't coerce

Because the generator controls the shape, run a thin validation pass rather than
defensive coercion: assert required fields are present and typed, price is a
positive number, `embed_text` is non-empty, `category_path` is non-empty. Fail
loudly on a bad record so a generator bug can't silently index garbage. (If the
catalog is ever sourced elsewhere later, this is where a cleaning layer would be
reintroduced.)

### 6.2 Read

The generated file is small enough to read directly, but a streaming reader
(handling a JSON array or NDJSON) is still cleaner and future-proofs against a
larger catalog. Either is acceptable at this size.

### 6.3 Build `embed_text` (if not already set) → bulk index

The generator should already have set `embed_text` (§7); if not, build it here.
Bulk-index into the k-NN index whose default pipeline auto-embeds. Because every
document is embedded _during_ indexing, **use small bulk batches** (200–300 docs,
not 1000) so requests don't time out while the model runs, and surface progress.
Recreate the index at the start of a run so ingest is idempotent.

---

## 7. `embed_text` — what to embed

Concatenate the fields that should drive semantic similarity into one focused
string, e.g. `name + " " + brand + " " + category + " " + description`. Including
the leaf category (e.g. "Business & laptop bags") is especially valuable here —
it strengthens the semantic link between an intent query like "office bag" and
the right products. Keep it tight: dumping every field (price, stock, ids, sizes)
into the embedding adds noise and degrades vector quality. This single field is
what the `text_embedding` processor consumes at ingest, and its vector is what the
query embeds against at search.

---

## 8. OpenSearch setup (run once, after the cluster is healthy)

Model registration is **asynchronous**: you receive a task ID and must poll until
a model ID is returned. This cannot be a plain `docker compose up` — write an
idempotent **setup script** that runs this sequence and is safe to re-run
(check for an already-deployed model / existing pipelines before recreating).
Building this orchestration is itself worth showing — it proves you understand the
ML Commons lifecycle rather than clicking through a dashboard.

> Verify every request body below against the **installed** OpenSearch version's
> docs before relying on it. ML Commons and neural-search APIs have shifted across
> 2.x releases (model registration, deployment, and inline search pipelines in
> particular). Treat these as the correct shape, not the exact bytes.

**8.1 Cluster settings (demo-only: allow the model on the data node):**

```
PUT _cluster/settings
{ "persistent": {
    "plugins.ml_commons.only_run_on_ml_node": false,
    "plugins.ml_commons.model_access_control_enabled": false,
    "plugins.ml_commons.native_memory_threshold": 99
} }
```

**8.2 Register a model group** → returns `model_group_id`:

```
POST /_plugins/_ml/model_groups/_register
{ "name": "fashion_search_models", "description": "hybrid search models" }
```

**8.3 Register the embedding model** (async → `task_id`):

```
POST /_plugins/_ml/models/_register
{ "name": "huggingface/sentence-transformers/all-MiniLM-L6-v2",
  "version": "1.0.1",
  "model_group_id": "<model_group_id>",
  "model_format": "TORCH_SCRIPT" }
```

Poll `GET /_plugins/_ml/tasks/<task_id>` until `state == "COMPLETED"`, then read
`model_id`. First run downloads the model into the cluster — slow; use generous
timeouts and retries.

**8.4 Deploy the model** (async; poll to COMPLETED):

```
POST /_plugins/_ml/models/<model_id>/_deploy
```

**8.5 Ingest pipeline** (auto-embed on index):

```
PUT /_ingest/pipeline/nlp-ingest-pipeline
{ "description": "auto-embed product text",
  "processors": [ { "text_embedding": {
      "model_id": "<model_id>",
      "field_map": { "embed_text": "embedding" } } } ] }
```

**8.6 k-NN index** (keyword analysis + vector field together):

```
PUT /products
{ "settings": {
    "index.knn": true,
    "default_pipeline": "nlp-ingest-pipeline",
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "filter": { "fashion_synonyms": { "type": "synonym_graph",
        "synonyms": [
          "sneakers, trainers, kicks",
          "jumper, sweater, pullover",
          "trousers, pants",
          "tee, t-shirt, tshirt, t shirt",
          "bag, handbag" ] } },
      "analyzer": {
        "text_en": { "type": "custom", "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "stop"] },
        "text_en_syn": { "type": "custom", "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "fashion_synonyms", "stop"] } } } },
  "mappings": { "properties": {
    "name": { "type": "text", "analyzer": "text_en",
      "fields": { "syn": { "type": "text", "analyzer": "text_en",
        "search_analyzer": "text_en_syn" } } },
    "description": { "type": "text", "analyzer": "text_en" },
    "brand": { "type": "text", "fields": { "kw": { "type": "keyword" } } },
    "segment": { "type": "keyword" },
    "category": { "type": "keyword" },
    "category_path": { "type": "keyword" },
    "color": { "type": "keyword" },
    "material": { "type": "keyword" },
    "premium": { "type": "boolean" },
    "sizes": { "type": "keyword" },
    "images": { "type": "keyword", "index": false },
    "embed_text": { "type": "text" },
    "embedding": { "type": "knn_vector", "dimension": 384,
      "method": { "name": "hnsw", "engine": "lucene", "space_type": "cosinesimil" } },
    "price": { "type": "float" },
    "original_price": { "type": "float" },
    "discount_pct": { "type": "float" },
    "in_stock": { "type": "boolean" },
    "avg_rating": { "type": "float" },
    "rating_count": { "type": "integer" } } } }
```

Note `bag, handbag` in the synonym list is intentionally _not_ extended to bridge
"office" → "business/laptop" — that mapping is exactly what the semantic clause is
meant to solve. Don't paper over the demo bug with a synonym rule.

**8.7 Search pipeline** (normalize + fuse the two clauses):

```
PUT /_search/pipeline/nlp-search-pipeline
{ "description": "normalize + combine hybrid scores",
  "phase_results_processors": [ { "normalization-processor": {
      "normalization": { "technique": "min_max" },
      "combination": { "technique": "arithmetic_mean",
        "parameters": { "weights": [0.3, 0.7] } } } } ] }
```

`weights` = `[keyword, semantic]`; this is what the frontend slider controls.
Because a named pipeline is created once, get **live per-request weights** one of
two ways: (a) an inline/temporary search pipeline supplied in the request (verify
this is supported on the installed version), or (b) a small set of pre-created
named pipelines (keyword-heavy / balanced / semantic-heavy) the API selects
between. Prefer (a) to keep the API stateless; fall back to (b) if inline is not
clean on your version.

**Model defaults:** `all-MiniLM-L6-v2`, 384-dim, HNSW/Lucene/cosine,
min-max + arithmetic-mean fusion. These are the community-validated, low-memory
choices — don't change the model without cause; 384-dim keeps memory down.

---

## 9. The API

Stateless Express service over OpenSearch. All ranking configuration travels in
the request body so the UI can A/B two configurations with no server session.

**`POST /api/search`** — body:

```ts
interface SearchRequest {
  q: string;
  size?: number; // capped, e.g. 50
  config: {
    mode: "keyword" | "hybrid"; // the reproduce-vs-fix toggle
    fields: { name: number; description: number; brand: number }; // keyword clause boosts
    useSynonyms: boolean; // keyword clause: query name.syn vs name
    hybrid: {
      keywordWeight: number; // -> weights[0]
      semanticWeight: number; // -> weights[1] (UI can bind one slider; w2 = 1 - w1)
      k: number; // kNN neighbors for the neural clause
    };
  };
}
```

**Keyword mode** runs only a `multi_match` over `name.syn`/`description`/`brand`
with the given boosts (and `explain: true` if using explanation option B). This
is the "reproduce the bug" path.

**Hybrid mode** runs a `hybrid` query with two clauses and the search pipeline:

```
POST /products/_search?search_pipeline=nlp-search-pipeline
{ "_source": { "excludes": ["embedding"] },
  "size": 20,
  "query": { "hybrid": { "queries": [
    { "multi_match": { "query": "<q>",
        "fields": ["name.syn^3", "description^1", "brand^2"],
        "type": "best_fields" } },
    { "neural": { "embedding": {
        "query_text": "<q>", "model_id": "<model_id>", "k": 50 } } }
  ] } } }
```

The `neural` clause auto-embeds the query with the same model and runs k-NN
against `embedding`. The keyword clause keeps field boosts + synonyms. The search
pipeline normalizes and combines per the weights.

**Always exclude `embedding` from `_source`** — it's large and useless to the UI.

**Response:** the query, the resolved config, `took_ms` (measure it — you'll cite
a latency number), total, and hits. Each hit carries id, source (no vector),
score, and an explanation payload per §8-decision.

**Also expose:**

- `GET /health` — pings OpenSearch and reports whether the model is deployed and
  the index exists. Good as a Docker healthcheck and a readiness probe.
- The backend needs the `model_id` at runtime for the neural clause. Prefer
  discovering it on boot by searching deployed models by name
  (`GET /_plugins/_ml/models/_search`) so it survives restarts, rather than
  hardcoding it.

---

## 10. Frontend

- **Search box** + result list.
- **Mode toggle:** keyword ↔ hybrid. This is the demo's spine — flipping it on
  "office bag" is the whole story.
- **Weight slider:** keyword ↔ semantic, bound to the fusion weights, re-querying
  live so results visibly reorder.
- **Keyword-clause knobs** (field boosts, synonyms on/off): secondary controls
  that show relevance-tuning depth.
- **Per-result explanation:** expandable; content per §4 decision (fusion view,
  or mode-aware BM25 tree vs. fusion view).
- Show `took_ms` and hit count.

Keep it clean and information-dense — a tool a senior engineer would build, not a
flashy dashboard. In dev, have Vite proxy `/api` to the backend to avoid CORS.
Mirror the `SearchConfig` / explanation types between backend and frontend from a
single shared definition (a shared workspace package is the clean way; if
duplicated, add a "keep in sync" note).

---

## 11. Docker / deployment

- Single `docker compose`: OpenSearch + backend + frontend (frontend built and
  served by nginx, which also proxies `/api` to the backend).
- The standard OpenSearch image already bundles ML Commons, k-NN, and neural
  plugins — no extra install. Set heap + `mem_limit` per the §4 RAM decision;
  memory is the top failure mode.
- **Bootstrap the model once.** Add a one-shot `setup` service that runs the §8
  sequence and exits with a completion marker, so the backend waits for
  "model ready" before serving. The setup must poll the async task APIs with
  generous retries (model download is slow on first boot).
- Mount the dataset read-only (e.g. `./data:/data:ro`); don't bake it into the
  image.
- OpenSearch needs `memlock` unlimited and a healthcheck with enough retries — it
  starts slowly on small boxes.

---

## 12. Build order

1. Confirm the two open decisions (§4: RAM, explanation depth).
2. Scaffold the monorepo (backend, frontend, data dir, compose).
3. **Build the catalog generator (§5)** and produce `data/catalog.json`. Do this
   early — everything downstream needs data, and the office-bag case (§5.3) must
   be deliberately engineered in. Eyeball the output: are business bags rich and
   "office"-free, are sibling bag categories bag-heavy, do descriptions read as
   human?
4. Compose up OpenSearch alone; confirm the ML/k-NN/neural plugins are present
   and the cluster is healthy.
5. Setup script (§8) with async task polling; verify: model DEPLOYED, ingest +
   search pipelines created, index exists.
6. Ingest: validate → `embed_text` → small-batch bulk index; spot-check that
   indexed docs actually have an `embedding` vector.
7. API: keyword mode, then hybrid mode + search pipeline; wire the weight slider
   and the mode toggle.
8. Explanation payload per §4 decision.
9. Frontend: search, mode toggle, weight slider, knobs, explanation, side-by-side.
10. **Validate the demo end-to-end:** "office bag" buries business bags in
    keyword mode and lifts them in hybrid mode. If not, tune the generated data
    (§5.3) and/or the fusion weights — this is the acceptance test.
11. Deploy to the (bumped) VPS. Capture the office-bag before/after, one p95
    latency number, and record a short Loom.

---

## 13. Definition of done (the demo must show)

- "office bag" in **keyword** mode → business/laptop bags NOT at the top (bug
  reproduced live).
- Same query in **hybrid** mode → business/laptop bags at/near the top (fixed).
- The **weight slider** visibly lifts the correct results as semantic weight
  rises.
- An **explanation** view that honestly shows keyword vs. semantic contribution.
- A **live URL**, a README that frames the reproduce-and-fix story and the
  architecture decisions, and one real **latency** number.

---

## 14. Pitfalls

- **Verify OpenSearch API syntax against the installed version** — the ML
  Commons / neural / search-pipeline APIs have moved across 2.x. When something
  behaves unexpectedly, check the running version's docs before assuming your
  request is right.
- **Memory is the #1 failure mode.** If OpenSearch OOMs, the model didn't fit —
  revisit heap/RAM or the model choice before anything else.
- **First-boot model download is slow** — poll with long timeouts and many
  retries; don't fail fast.
- **Ingest is slower with embedding** — small bulk batches; watch for timeouts.
- **Never return the `embedding` vector** — exclude it from `_source` everywhere.
- **Keep the shared types in sync** between backend and frontend.
- **Don't strawman keyword search** in the generated data — if you sabotage
  lexical relevance to make hybrid look good, a sharp reviewer will notice. Make
  keyword search _reasonable_ and hybrid _better_ (§5.3).
- **Don't let generated data read as synthetic** — vary titles and descriptions;
  invest in believable copy. This is the main quality risk of the generator
  approach.
- **Don't "fix" the demo bug with a synonym rule** — mapping office→business in
  the analyzer defeats the entire point; the semantic clause is the fix.
- **Calibrate the generator against the live site** — real categories, brands,
  price ranges, and title style are what make it read as ABOUT YOU rather than
  generic. The research in §5.1 is the starting point; check the site if unsure.
