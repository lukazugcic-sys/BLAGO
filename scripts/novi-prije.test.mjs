import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url);

function citaj(rel) {
  return fs.readFileSync(new URL(rel, root), "utf8");
}

function memorija() {
  const mem = new Map();
  return {
    get length() {
      return mem.size;
    },
    key(i) {
      return [...mem.keys()][i] ?? null;
    },
    getItem(k) {
      return mem.has(k) ? mem.get(k) : null;
    },
    setItem(k, v) {
      mem.set(k, String(v));
    },
    removeItem(k) {
      mem.delete(k);
    },
  };
}

test("?novi=1 briše BLAGO ključeve prije storea", async () => {
  const jiti = createJiti(import.meta.url);
  const m = await jiti.import("../src/lib/game/noviPrije.ts");
  const local = memorija();
  const session = memorija();
  local.setItem("blago-v1:game", "{\"zlato\":9}");
  local.setItem("blago:stari", "1");
  local.setItem("ostalo", "ne");
  let adresa = "";
  const bilo = m.primijeniNoviPrije({
    href: "https://blago.grok.me/?novi=1",
    local,
    session,
    replace: (url) => {
      adresa = url;
    },
  });
  assert.equal(bilo, true);
  assert.equal(local.getItem("blago-v1:game"), null);
  assert.equal(local.getItem("blago:stari"), null);
  assert.equal(local.getItem("ostalo"), "ne");
  assert.equal(session.getItem("blago-v1:lokalni-novi"), "1");
  assert.equal(session.getItem("blago-v1:novi-obraden"), "1");
  assert.equal(adresa, "/");
  assert.equal(m.adresaBezNovi("https://blago.grok.me/?a=1&novi=1"), "/?a=1");
  assert.equal(m.adresaBezNovi("https://blago.grok.me/?novi=1#igra"), "/#igra");
  assert.equal(m.adresaBezNovi("https://blago.grok.me/?a=1"), null);

  const opet = m.primijeniNoviPrije({
    href: "https://blago.grok.me/",
    local,
    session,
    replace: () => {
      throw new Error("ne smije dirati adresu");
    },
  });
  assert.equal(opet, false);
  assert.equal(local.getItem("ostalo"), "ne");

  const router = citaj("src/router.tsx");
  const apk = citaj("src/apk-main.tsx");
  const main = citaj("src/main.tsx");
  const prije = citaj("src/lib/game/noviPrije.ts");
  assert.ok(router.indexOf('import "@/main"') >= 0);
  assert.ok(router.indexOf('import "@/main"') < router.indexOf("routeTree"));
  assert.match(router, /noviPrijeGotov/);
  assert.ok(apk.indexOf('import "@/main"') >= 0);
  assert.ok(apk.indexOf('import "@/main"') < apk.indexOf("GameApp"));
  assert.match(apk, /noviPrijeGotov/);
  assert.match(main, /pokreniNoviPrijeHidracije/);
  assert.doesNotMatch(main, /gameStore/);
  assert.doesNotMatch(prije, /gameStore/);
  assert.match(prije, /indexedDB/);
  assert.match(prije, /replaceState/);
  assert.doesNotMatch(prije, /location\.reload/);

  const store = citaj("src/lib/stores/gameStore.ts");
  const poziv = store.indexOf("pokreniNoviPrijeHidracije()");
  assert.ok(poziv >= 0);
  assert.ok(poziv < store.indexOf("export const useGameStore"));
  const pkg = JSON.parse(citaj("package.json"));
  assert.ok(pkg.sideEffects.includes("src/main.tsx"));
  assert.ok(pkg.sideEffects.includes("src/lib/game/noviPrije.ts"));
});
