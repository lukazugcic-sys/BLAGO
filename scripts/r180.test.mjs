// 0.9.180 — krov slota, stakleni ZAVRTI, obavijesti na sredini, zum bez filtera,
// uvala, lovački dom između tora i ispusta, kamenolom zapadno od rudnika na suhom.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css");
const start = css.indexOf("/* ══ 0.9.180");
const end = css.indexOf("/* ══ kraj 0.9.180 ══ */");
const blok = css.slice(start, end);
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const kp = await j.import(ROOT + "src/lib/game/kartaPogled.ts");
const ob = await j.import(ROOT + "src/lib/game/obor.ts");

const P = (id) => u.PARCELE.find((p) => p.id === id);
const box = (id, x, y) => {
  const s = u.velicinaSpritea(id, true);
  const r = kp.rastSkala(99);
  const w = s.w * r;
  const h = s.h * r;
  return { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 };
};
const sijece = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

test("r180: sloj je zadnji i pokriva krov, ZAVRTI, poštu, zum i uvalu", () => {
  assert.ok(start > 0 && end > start);
  const poslije = css.slice(end + "/* ══ kraj 0.9.180 ══ */".length).trim();
  assert.ok(poslije === "" || poslije.startsWith("/* ══ 0.9.181"), "iza 0.9.180 smije samo sloj 0.9.181");
  assert.match(blok, /html\[data-skin\] \.game-shell\[data-tab="automat"\][\s\S]*background-image: none/);
  assert.match(blok, /\.slot-zavrti[\s\S]*color-mix\(in oklab, #c47a3a 46%, transparent\)/);
  assert.match(blok, /\.posta-sredina[\s\S]*transform: translate\(-50%, -54%\)/);
  assert.match(blok, /\.ziva-ulica\.is-zum \*[\s\S]*filter: none !important/);
  assert.match(blok, /\.izo-potok\.is-uvala \{ stroke-width: 18px/);
  const v = read("src/components/game/VillageScreen.tsx");
  assert.match(v, /posta-sredina/);
  assert.match(v, /children: "Smanji"/);
  assert.match(read("src/components/game/KaubaZivaUlica.tsx"), /classList\.add\("is-zum"\)/);
  const cesta = read("src/components/game/KaubaCesta.tsx");
  assert.match(cesta, /className="izo-potok is-uvala"/);
  assert.match(cesta, /stroke="url\(#izo-voda-tk\)"/);
});

test("r180: lov uz tor i ispust, izvan obora; kamenolom zapadno i suh; putevi ne sijeku parcele", () => {
  const lov = P("lov");
  const tor = P("tor");
  const kor = P("korali");
  const kam = P("kamenolom");
  const rud = P("rudnik");
  const abx = tor.x - kor.x;
  const aby = tor.y - kor.y;
  const ab2 = abx * abx + aby * aby;
  const tpar = ((lov.x - kor.x) * abx + (lov.y - kor.y) * aby) / ab2;
  const px = kor.x + abx * tpar;
  const py = kor.y + aby * tpar;
  assert.ok(tpar > 0.05 && tpar < 0.55, `lov nije uz prolaz tor–ispust (${tpar})`);
  assert.ok(Math.hypot(lov.x - px, lov.y - py) < 280);
  assert.equal(ob.uOboru(lov.x, lov.y), false, "lov u oboru");
  assert.ok(t.doPotoka(lov.x, lov.y) > 90, "lov u vodi");
  const lb = box("lov", lov.x, lov.y);
  const kutovi = [
    { x: lb.l, y: lb.t },
    { x: lb.r, y: lb.t },
    { x: lb.l, y: lb.b },
    { x: lb.r, y: lb.b },
  ];
  assert.ok(Math.min(...kutovi.map((q) => t.doPotoka(q.x, q.y))) > 20, "sprite lova dira vodu");
  assert.ok(kam.x < rud.x - 80, "kamenolom nije zapadno od rudnika");
  assert.ok(t.doPotoka(kam.x, kam.y) > 140, "kamenolom u vodi");
  assert.ok(u.ULICA.redDo > Math.max(...u.PARCELE.map((p) => p.row)));
  const kb = box("kamenolom", kam.x, kam.y);
  for (const p of u.PARCELE) {
    if (p.id === "lov" || p.id === "kamenolom") continue;
    assert.equal(sijece(lb, box(p.id, p.x, p.y)), false, `lov preklapa ${p.id}`);
    assert.equal(sijece(kb, box(p.id, p.x, p.y)), false, `kamenolom preklapa ${p.id}`);
  }
  for (const id of ["lov", "kamenolom"]) {
    const put = u.putelji(u.PARCELE.map((p) => p.id)).find((q) => q.id === id && !q.veza);
    assert.ok(put && put.tocke.length > 4, id);
    assert.equal(u.putSijeceRomb(put.tocke), null, id);
  }
  assert.ok(t.tockeOd(t.UVALA).length > 8, "uvala");
});
