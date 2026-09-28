import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  // GitHub Pages project sites use /repository-name/. Set / for a custom domain.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  root,
  resolve: { alias: { "@": path.resolve(root, "src") } },
  server: { host: "0.0.0.0" },
});
