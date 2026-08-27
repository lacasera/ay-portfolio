# Backend production image.
# build stage: install the monorepo, compile the backend (tsc -> dist), drop dev deps.
# runtime stage: a lean node image running the compiled JavaScript.
FROM node:20-alpine AS build
WORKDIR /app

# Install from the lockfile against the workspace manifests only, so this layer
# stays cached until a package.json or the lockfile changes.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci

# Compile the backend. @ay/shared is types-only, so it is needed at build time
# (tsc resolves the types) but erased from the emitted JavaScript.
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN npm run build --workspace=backend

# Strip dev dependencies from the hoisted node_modules for the runtime copy.
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Production node_modules, the compiled backend, its manifest, the shared
# package the symlink resolves to, and the catalog the seeder reads.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/data ./backend/data

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/index.js"]
