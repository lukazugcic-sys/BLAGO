// 0.9.181 — pošta desno (isti kut kao Smanji), mlin na obali između cisterne i rudnika,
// puna uvala od farme do pašnjaka, raslinje i grla na suhom, konji šire.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css");
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const o = await j.import(ROOT + "src/lib/game/obor.ts");
const kp = await j.import(ROOT + "src/lib/game/kartaPogled.ts");
const s = await j.import(ROOT + "src/lib/game/stokaKarta.ts");

const P = (id) => u.PARCELE.find((p) => p.id === id);
const pip = (p, poly) => {
  let c = false;
  for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) {
    const a = poly[i], b = poly[k];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) c = !c;
  }
  return c;
};
const box = (id, x, y) => {
  const sv = u.velicinaSpritea(id, true);
  const r = kp.rastSkala(99);
  return { l: x - (sv.w * r) / 2, r: x + (sv.w * r) / 2, t: y - (sv.h * r) / 2, b: y + (sv.h * r) / 2 };
};
const sijece = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

test("r181: verzija 0.9.181-beta / code 221 i sloj je zadnji", () => {
  assert.match(read("src/lib/game/version.ts"), /0\.9\.181-beta/);
  const g = read("android/app/build.gradle");
  assert.ok(Number(g.match(/versionCode (\d+)/)[1]) >= 221);
  assert.match(g, /versionName "0\.9\.181-beta"/);
  const start = css.indexOf("/* ══ 0.9.181");
  const end = css.indexOf("/* ══ kraj 0.9.181 ══ */");
  assert.ok(start > 0 && end > start);
  assert.equal(css.slice(end + "/* ══ kraj 0.9.181 ══ */".length).trim(), "");
  assert.match(css, /\.posta-ikona \{[\s\S]*position: static !important/);
  assert.match(css, /\.izo-uvala-tijelo \{[\s\S]*fill: url\(#izo-voda-tk\)/);
  const v = read("src/components/game/VillageScreen.tsx");
  const sred = v.indexOf('className: "posta-sredina pointer-events-none"');
  assert.ok(sred > 0);
  assert.match(v.slice(sred, sred + 1200), /posta-ikona/);
  assert.match(v.slice(sred, sred + 1200), /posta-smanji/);
});

test("r181: mlin na obali između cisterne i rudnika, uvala pokriva prešarano i spaja se s potokom", () => {
  const mlin = P("mlin"), cis = P("cisterna"), rud = P("rudnik"), farma = P("farma"), lov = P("lov"), kam = P("kamenolom");
  assert.ok(mlin.y > cis.y + 40 && mlin.y < rud.y - 40, "mlin nije između cisterne i rudnika");
  const dw = t.doPotoka(mlin.x, mlin.y);
  assert.ok(dw > 35 && dw < 95, `mlin nije na obali (${dw.toFixed(0)})`);
  assert.equal(pip(mlin, t.uvalaPoligon()), false, "mlin u uvali");
  const mb = box("mlin", mlin.x, mlin.y);
  for (const p of u.PARCELE) {
    if (p.id === "mlin") continue;
    assert.equal(sijece(mb, box(p.id, p.x, p.y)), false, `mlin preklapa ${p.id}`);
  }
  const put = u.putelji(u.PARCELE.map((p) => p.id)).find((q) => q.id === "mlin" && !q.veza);
  assert.ok(put && put.tocke.length > 4);
  assert.equal(u.putSijeceRomb(put.tocke), null, "put mlina");
  const poly = t.uvalaPoligon();
  assert.ok(poly.length > 8);
  for (const q of [
    { x: 1006, y: 752 },
    { x: 1074, y: 811 },
    { x: 900, y: 720 },
    { x: 1000, y: 820 },
    { x: 882, y: 660 },
  ]) assert.equal(t.doPotoka(q.x, q.y), 0, `suho u prešaranom ${q.x},${q.y}`);
  const pot = t.tockeOd(t.POTOK);
  const dSeg = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1;
    const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
    return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k);
  };
  let spoji = Infinity;
  for (const p of poly) for (let i = 1; i < pot.length; i++) spoji = Math.min(spoji, dSeg(p, pot[i - 1], pot[i]));
  assert.ok(spoji < 2, "uvala nije spojena s potokom");
  assert.equal(pip(farma, poly), false, "farma u uvali");
  assert.ok(t.doPotoka(lov.x, lov.y) > 90, "lov u vodi");
  const lb = box("lov", lov.x, lov.y);
  const kutovi = [{ x: lb.l, y: lb.t }, { x: lb.r, y: lb.t }, { x: lb.l, y: lb.b }, { x: lb.r, y: lb.b }];
  assert.ok(Math.min(...kutovi.map((q) => t.doPotoka(q.x, q.y))) > 20, "sprite lova dira vodu");
  const tor = P("tor");
  const sred = { x: tor.x + o.OBOR.dx, y: tor.y + o.OBOR.dy };
  assert.equal(pip(sred, poly), false, "pašnjak u vodi");
  assert.equal(o.uOboru(sred.x, sred.y), true);
  assert.ok(t.doPotoka(kam.x, kam.y) > 140, "kamenolom u vodi");
  for (const id of ["cisterna", "rudnik", "banka"]) assert.equal(pip(P(id), poly), false, id);
  for (const d of u.DEKOR) assert.ok(t.doPotoka(d.x, d.y) > 28, `${d.tip} ${d.x},${d.y} u vodi`);
  for (const d of [...t.DRVECE, ...t.SIPAK, ...t.DRVORED]) assert.ok(t.doPotoka(d.x, d.y) >= 12, `raslina ${d.x},${d.y}`);
});

test("r181: konji šire, nitko u uvali", () => {
  const sk = s.skupine();
  assert.ok(sk.length >= 12, `skupina ${sk.length}`);
  for (let i = 0; i < sk.length; i++) for (let j = i + 1; j < sk.length; j++) {
    assert.ok(Math.hypot(sk[i].x - sk[j].x, sk[i].y - sk[j].y) >= 80, "skupine zbijene");
  }
  const sve = s.stokaNaKarti({ staja: 6, korali: 6, staza: 6, tor: 6 }, 90, 48);
  const konji = sve.grla.filter((g) => g.vrsta === "konj");
  assert.equal(konji.length, 90);
  const poly = t.uvalaPoligon();
  for (const g of sve.grla) assert.equal(pip(g, poly), false, `${g.id} u uvali`);
});
