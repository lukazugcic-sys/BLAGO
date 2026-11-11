// 0.9.173 — plan korak 4 (Kauba karta: kontrole i zgrade). Čiste geometrijske/izvorne provjere.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const k = await j.import(ROOT + "src/lib/game/kartaPogled.ts");
const read = (p) => fs.readFileSync(ROOT + p, "utf8");
const css = read("src/styles.css");
const blok = css.slice(css.indexOf("0.9.173-test: Kauba karta"));
const RAST = k.rastSkala(99); // najveći rast (1.08)

function kutijaZgrade(p) {
  const s = u.velicinaSpritea(p.id, true);
  const w = s.w * RAST;
  const h = s.h * RAST;
  return { id: p.id, l: p.x - w / 2, r: p.x + w / 2, t: p.y - h / 2, b: p.y + h / 2 };
}
const sijeku = (a, b, m = 0) => a.l < b.r + m && b.l - m < a.r && a.t < b.b + m && b.t - m < a.b;

test("32: Pogled, Tok kaube i kauboji/sreća su u jednom retku (karta-kontrole)", () => {
  const ulica = read("src/components/game/KaubaZivaUlica.tsx");
  const a = ulica.indexOf('className="karta-kontrole"');
  const p = ulica.indexOf('data-testid="karta-pogled"');
  const tok = ulica.indexOf('aria-label="Tok kaube"');
  const broj = ulica.indexOf("<KaubaBroj />");
  assert.ok(a > 0 && a < p && p < tok && tok < broj, "redoslijed: kontrole → Pogled → Tok kaube → KaubaBroj");
  assert.equal(ulica.split("<KaubaBroj />").length - 1, 1, "KaubaBroj samo jednom");
  assert.ok(ulica.indexOf("</div>", broj) - broj < 40, "KaubaBroj zatvara redak");
  const kontrole = blok.slice(blok.indexOf(".karta-kontrole {"), blok.indexOf("}", blok.indexOf(".karta-kontrole {")));
  assert.match(kontrole, /display: flex/);
  assert.match(kontrole, /bottom: 8px/);
  assert.match(kontrole, /left: 8px/);
  assert.match(kontrole, /right: 8px/);
  // bez žutih obruba u retku kontrola
  const kontroleCss = blok.slice(0, blok.indexOf("/* 16:"));
  assert.doesNotMatch(kontroleCss, /border:\s*1px solid/);
  assert.doesNotMatch(kontroleCss, /#ffd24a/i);
  assert.match(kontroleCss, /@media \(max-width: 379px\)/, "uski ekran (360px) skriva riječi");
  const broj2 = read("src/components/game/KaubaBroj.tsx");
  assert.match(broj2, /data-testid="karta-info"/);
  assert.match(broj2, /karta-info-dio is-kauboji/);
  assert.match(broj2, /karta-info-dio is-sreca/);
});

test("16: bez ploča ispod imena zgrada; ime ima obris sjene", () => {
  assert.match(blok, /\.izo-kuca\.is-ima\[data-stupanj\] \.izo-skala::before \{\s*content: none;/);
  const ime = blok.slice(blok.indexOf(".ziva-ulica.ziva-izo .izo-natpis .izo-ime,"));
  const tijelo = ime.slice(0, ime.indexOf("}"));
  assert.match(tijelo, /background: none/);
  assert.match(tijelo, /border: 0/);
  assert.match(tijelo, /text-shadow:/);
});

test("15: nema ograde oko kaube (letve i stupovi po rubu naselja)", () => {
  const obzor = read("src/components/game/KaubaObzor.tsx");
  assert.doesNotMatch(obzor, /className="izo-ograda-rub/);
  assert.doesNotMatch(obzor, /OBZOR\.stupovi\.map/);
  assert.match(obzor, /izo-kapija-greda/, "ulaz (kapija s lampama) ostaje");
});

test("22: tvornica oružja je ~1.5× veća i ne dira susjede", () => {
  const tv = u.PARCELE.find((p) => p.id === "tvornica");
  assert.ok(tv);
  const s = u.velicinaSpritea("tvornica", true);
  const obicna = u.velicinaSpritea("pekara", true);
  const f = s.w / obicna.w;
  assert.ok(f >= 1.4 && f <= 1.6, `faktor ${f}`);
  assert.equal(s.w / s.h, obicna.w / obicna.h);
  const a = kutijaZgrade(tv);
  for (const p of u.PARCELE) {
    if (p.id === "tvornica") continue;
    assert.equal(sijeku(a, kutijaZgrade(p)), false, `tvornica dira ${p.id}`);
  }
  // nezgrađena (kolci) ostaje iste veličine
  assert.deepEqual(u.velicinaSpritea("tvornica", false), u.velicinaSpritea("pekara", false));
  // puteljak tvornice ne reže tuđi romb
  const put = u.putelji(["tvornica"]).find((p) => p.id === "tvornica");
  const tude = put.tocke.filter((q) => u.PARCELE.some((p) => p.id !== "tvornica" && u.uRomu(q.x, q.y, p)));
  assert.equal(tude.length, 0);
});

test("17: veliki kaktus više nije na kamenolomu (ni na drugoj zgradi)", () => {
  // Izmjereno u headless renderu: slika kaktusa ~64×100 px svijeta, 80..180 px iznad sidra.
  const kaktusi = u.DEKOR.filter((d) => d.tip === "kaktus");
  assert.ok(kaktusi.length >= 4);
  const km = u.PARCELE.find((p) => p.id === "kamenolom");
  for (const d of kaktusi) {
    const kut = { l: d.x - 34, r: d.x + 34, t: d.y - 182, b: d.y - 78 };
    for (const p of u.PARCELE) assert.equal(sijeku(kut, kutijaZgrade(p), 6), false, `kaktus ${d.x},${d.y} na ${p.id}`);
  }
  const blizu = kaktusi.reduce((m, d) => Math.min(m, Math.hypot(d.x - km.x, d.y - 80 - km.y)), Infinity);
  assert.ok(blizu < 200, "kaktus i dalje stoji uz kamenolom, samo sa strane");
});

test("18: više kamenja oko kamenoloma, izvan parcela i puteljaka", () => {
  const km = u.PARCELE.find((p) => p.id === "kamenolom");
  const kam = t.KAMENOLOM_KAMENJE;
  assert.ok(kam.length >= 18, `kamenja ${kam.length}`);
  const staze = u.putelji(u.PARCELE.map((p) => p.id)).flatMap((p) => p.tocke);
  for (const q of kam) {
    assert.ok(Math.hypot(q.x - km.x, q.y - km.y) < 150, "kamen daleko od kamenoloma");
    for (const p of u.PARCELE) assert.equal(u.uRomu(q.x, q.y, p), false, `kamen u parceli ${p.id}`);
    assert.ok(staze.every((s) => Math.hypot(s.x - q.x, s.y - q.y) > 10), "kamen na puteljku");
    assert.ok(q.r >= 2 && q.r <= 12);
  }
  for (let i = 0; i < kam.length; i++)
    for (let n = i + 1; n < kam.length; n++)
      assert.ok(Math.hypot(kam[i].x - kam[n].x, kam[i].y - kam[n].y) > 4, "dva kamena na istom mjestu");
  assert.match(read("src/components/game/KaubaCesta.tsx"), /KAMENOLOM_KAMENJE\.map/);
});

test("35: male oznake na karti bez kutije, ispod likova, čitljive", () => {
  const o = blok.slice(blok.indexOf(".ziva-ulica.ziva-izo .ai-oznaka {"));
  const tijelo = o.slice(0, o.indexOf("}"));
  assert.match(tijelo, /background: none/);
  assert.match(tijelo, /border: 0/);
  assert.match(tijelo, /z-index: 6/, "ispod likova (njihov z-index = y)");
  assert.match(tijelo, /font-size: 11px/, "čitljivo i pri dalekom zumu");
  assert.doesNotMatch(blok, /daleko"\] \.ai-oznaka span \{ display: none/);
  assert.match(blok, /html\[data-skin\] \.ziva-ulica\.ziva-izo \.ai-oznaka \{\s*background: none;/);
  const span = o.slice(o.indexOf(".ziva-ulica.ziva-izo .ai-oznaka span {"));
  assert.match(span.slice(0, span.indexOf("}")), /text-shadow:/);
  const hod = read("src/components/game/KaubaHodaci.tsx");
  assert.match(hod, /"--z" as string\]: Math\.round\(start\.y\)/);
});
