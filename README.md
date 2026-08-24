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
