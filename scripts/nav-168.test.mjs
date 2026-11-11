// 0.9.168: bottom nav order, icons-only, moved screens, removed Zadaci fallback, long-press entries
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");

test("TABOVI order is Zid, Kauba, Igraj, Tržnica — no Zadaci", async () => {
  const j = createJiti(import.meta.url, { alias: { "@": `${ROOT}/src` } });
  const { TABOVI, normalizirajTab, jeTabId } = await j.import(`${ROOT}/src/lib/game/constants.ts`);
  assert.deepEqual(
    TABOVI.map((t) => t.id),
    ["zid", "selo", "automat", "trznica"],
  );
  assert.deepEqual(
    TABOVI.map((t) => t.label),
    ["Zid", "Kauba", "Igraj", "Tržnica"],
  );
  assert.equal(TABOVI.some((t) => t.id === "misije"), false);
  assert.equal(normalizirajTab("misije"), "zid");
  assert.equal(normalizirajTab("automat"), "automat");
  assert.equal(jeTabId("misije"), false);
  assert.equal(jeTabId("zid"), true);
});

test("bottom nav hides labels visually but keeps accessible names", () => {
  const nav = read("src/components/game/AppNav.tsx");
  const css = read("src/styles.css");
  assert.ok(nav.includes('className="nav-ime sr-only"') || nav.includes("nav-ime sr-only"));
  assert.ok(nav.includes("aria-label={zakljucan ? `${t.label}"));
  assert.ok(!nav.includes("misije"));
  assert.ok(nav.includes("korakZnacka = t.id === \"zid\""));
  assert.ok(css.includes("0.9.168-test: bottom nav"));
  assert.ok(css.includes("nav-ime.sr-only") || css.includes(".nav-ime.sr-only"));
});

test("long-press menus: Zvijezde/Nalozi under Zid, Karavana/Uživo under Tržnica", async () => {
  const j = createJiti(import.meta.url, { alias: { "@": `${ROOT}/src` } });
  const { tokMeniZaTab } = await j.import(`${ROOT}/src/lib/game/tokMeni.ts`);
  const zid = tokMeniZaTab("zid").map((s) => s.id);
  const trz = tokMeniZaTab("trznica").map((s) => s.id);
  assert.ok(zid.includes("nalozi") && zid.includes("zvijezde"));
  assert.ok(zid.includes("cilj") && zid.includes("kronika"));
  assert.ok(trz.includes("karavana") && trz.includes("uzivo"));
  assert.ok(trz.includes("burza") && trz.includes("alati") && trz.includes("izgled"));
  assert.equal(zid.includes("karavana"), false);
  assert.equal(trz.includes("nalozi"), false);
});

test("ShopScreen hosts Karavana/Uživo with bottom section switcher", () => {
  const shop = read("src/components/game/ShopScreen.tsx");
  assert.ok(shop.includes('id: "karavana"'));
  assert.ok(shop.includes('id: "uzivo"'));
  assert.ok(shop.includes("KaravanaIgra"));
  assert.ok(shop.includes("LivePohod"));
  assert.ok(shop.includes("trznica-tabovi-dolje"));
  assert.ok(shop.includes("dolje"));
  const idxTabs = shop.indexOf("trznica-tabovi-dolje");
  const idxBurza = shop.indexOf('sekcija === "burza"');
  assert.ok(idxBurza > 0 && idxTabs > idxBurza, "tabs should render after content");
});

test("Zid hosts Nalozi + Zvijezde in accordion sections", () => {
  const zid = read("src/components/game/ZidScreen.tsx");
  assert.ok(zid.includes("NaloziPanel"));
  assert.ok(zid.includes("ZvijezdeLista"));
  assert.ok(zid.includes('id="zid-nalozi"'));
  assert.ok(zid.includes('id="zid-zvijezde"'));
  assert.ok(zid.includes("ZidOdjeljak"));
  assert.ok(zid.includes("blago-v1:zid-acc"));
});

test("legacy misije tab and zadaci deep-links fall back safely", () => {
  const app = read("src/components/game/GameApp.tsx");
  const nav = read("src/components/game/AppNav.tsx");
  const korak = read("src/components/game/SljedeciKorak.tsx");
  assert.ok(app.includes("normalizirajTab"));
  assert.ok(app.includes('raw === "misije"'));
  assert.ok(!app.includes('id: "misije"'));
  assert.ok(nav.includes('a.tab === "karavana" || a.tab === "uzivo"'));
  assert.ok(korak.includes('zid: "nalozi"'));
});
