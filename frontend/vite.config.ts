import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const AWS_API_ORIGIN =
  "https://j9evvf520h.execute-api.ap-south-1.amazonaws.com";

const apiProxy = {
  "/admin": { changeOrigin: true, target: AWS_API_ORIGIN },
  "/documents": { changeOrigin: true, target: AWS_API_ORIGIN },
  "/health": { changeOrigin: true, target: AWS_API_ORIGIN },
  "/notices": { changeOrigin: true, target: AWS_API_ORIGIN },
} as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    proxy: apiProxy,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: apiProxy,
  },
});
