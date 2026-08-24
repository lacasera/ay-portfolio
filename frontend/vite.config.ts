import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxy /api requests to the Express backend during development.
export default defineConfig(({ mode }) => {
  // Load .env (all keys) and merge process.env — so ./frontend/.env works for
  // local dev, while docker compose's injected env vars take precedence.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Bind 0.0.0.0 so the mapped port is reachable from the Docker host.
      host: true,
      proxy: {
        // In Docker the backend is reached by its compose service name;
        // host dev falls back to localhost.
        "/api": env.VITE_PROXY_TARGET || "http://localhost:3001",
      },
      // Polling only when explicitly enabled (Docker on macOS); off for local.
      watch: {
        usePolling: !!env.VITE_USE_POLLING,
      },
    },
  };
});
