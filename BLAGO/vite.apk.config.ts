import { existsSync, mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function flattenApkHtml(): Plugin {
  return {
    name: "flatten-apk-html",
    closeBundle() {
      const from = resolve(import.meta.dirname, "apk-www/apk/index.html");
      const to = resolve(import.meta.dirname, "apk-www/index.html");
      if (existsSync(from)) {
        mkdirSync(resolve(import.meta.dirname, "apk-www"), { recursive: true });
        renameSync(from, to);
      }
    },
  };
}

export default defineConfig({
  plugins: [viteReact(), tailwindcss(), flattenApkHtml()],
  base: "/",
  publicDir: "public",
  resolve: {
    alias: [
      { find: "@/lib/game/cloud", replacement: resolve(import.meta.dirname, "src/apk-stubs/cloud.ts") },
      { find: "@", replacement: resolve(import.meta.dirname, "src") },
    ],
  },
  define: {
    "import.meta.env.VITE_AUTH_ENABLED": JSON.stringify("false"),
  },
  build: {
    outDir: "apk-www",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: resolve(import.meta.dirname, "apk/index.html"),
    },
  },
});
