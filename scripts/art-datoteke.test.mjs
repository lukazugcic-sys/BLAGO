import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

function hodaj(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) hodaj(p, acc);
    else acc.push(p);
  }
  return acc;
}

function reference(tekst) {
  const set = new Set();
  const dodaj = (sirovo) => {
    if (!sirovo) return;
    let s = String(sirovo).trim().replace(/^['"`]|['"`]$/g, "");
    if (!s.startsWith("/") || s.startsWith("//")) return;
    if (s.includes("${") || s.includes("\\")) return;
    s = s.split("?")[0].split("#")[0];
    if (!/\.(webp|png|jpe?g|gif|svg|ico|woff2|mp3|mp4)$/i.test(s)) return;
    set.add(s);
  };
  for (const m of tekst.matchAll(/url\(\s*([^)]+)\)/g)) dodaj(m[1]);
  for (const m of tekst.matchAll(/['"`](\/art\/[^'"`\s?#]+)/g)) dodaj(m[1]);
  return [...set];
}

function nema(baza, refs) {
  return refs.filter((ref) => !existsSync(join(baza, ref.replace(/^\//, ""))));
}

test("svaki url() i /art/ u izvoru postoji u public/", () => {
  const datoteke = hodaj(join(root, "src")).filter((p) => /\.(css|ts|tsx|html)$/.test(p));
  const refs = new Set();
  for (const p of datoteke) {
    for (const r of reference(readFileSync(p, "utf8"))) refs.add(r);
  }
  const fali = nema(pub, [...refs]);
  assert.deepEqual(fali, [], `nedostaje u public/: ${fali.join(", ")}`);
  assert.ok(refs.size > 10, "sken nije uhvatio umjetnine");
});

test("svaki url() i /art/ u buildu postoji u dist", () => {
  const dist = join(root, ".vercel/output/static");
  assert.equal(existsSync(dist), true, "nema builda u .vercel/output/static");
  const datoteke = hodaj(dist).filter((p) => /\.(css|js|html|mjs)$/.test(p) && statSync(p).size < 4_000_000);
  const refs = new Set();
  for (const p of datoteke) {
    for (const r of reference(readFileSync(p, "utf8"))) refs.add(r);
  }
  const fali = nema(dist, [...refs]).filter((r) => !existsSync(join(pub, r.replace(/^\//, ""))));
  assert.deepEqual(fali, [], `build traži datoteku koje nema u dist ni u public/: ${fali.join(", ")}`);
  const jpg = [...refs].filter((r) => /\.jpe?g$/i.test(r) && r.startsWith("/art/"));
  assert.deepEqual(jpg, [], `build i dalje traži jpg: ${jpg.join(", ")}`);
});
