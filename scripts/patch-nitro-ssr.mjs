#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ssrDir = join(root, ".vercel/output/functions/__server.func/_ssr");
const libsDir = join(root, ".vercel/output/functions/__server.func/_libs");

if (existsSync(ssrDir)) {
  const ssrPath = join(ssrDir, "ssr.mjs");
  if (existsSync(ssrPath)) {
    let src = readFileSync(ssrPath, "utf8");
    if (src.includes("ssr_exports as s")) {
      src = src.replace("ssr_exports as s", "server_default as s");
      writeFileSync(ssrPath, src);
    }
  }
  for (const name of readdirSync(ssrDir)) {
    if (!name.endsWith(".mjs") || name === "ssr.mjs") continue;
    const p = join(ssrDir, name);
    let src = readFileSync(p, "utf8");
    const next = src.replace(
      /import \{ c as (__exportAll(?:\$1)?) \} from "\.\/ssr\.mjs";/g,
      'import { r as $1 } from "../_runtime.mjs";',
    );
    if (next !== src) writeFileSync(p, next);
  }
}

if (existsSync(libsDir)) {
  const dist = join(root, "node_modules/@electric-sql/pglite/dist");
  for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
    const src = join(dist, name);
    const dest = join(libsDir, name);
    if (existsSync(src) && !existsSync(dest)) copyFileSync(src, dest);
  }
}
