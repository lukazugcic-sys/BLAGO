import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

test("karte pogleda, četvrti i staze ne diraju romb", async () => {
  const jiti = createJiti(import.meta.url);
  const k = await jiti.import("../src/lib/game/kartaPogled.ts");
  const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
  assert.equal(k.detaljOdZooma(0.6), "daleko");
  assert.equal(k.detaljOdZooma(0.69), "srednje");
  assert.equal(k.detaljOdZooma(1.4), "blizu");
  assert.equal(k.rastSkala(1), 1);
  assert.ok(k.rastSkala(5) > 1 && k.rastSkala(5) <= 1.24);
  assert.equal(k.sirinaPuta(1, false), 6);
  assert.ok(k.sirinaPuta(5, false) > 6 && k.sirinaPuta(5, false) <= 11);
  const videne = new Set();
  for (const p of u.PARCELE) {
    const c = k.cetvrtZgrade(p.id);
    assert.ok(c === "srediste" || c === "ranc" || c === "rad", p.id);
    videne.add(c);
    assert.ok(k.cetvrtPasa(p.id).length > 3, p.id);
  }
  assert.equal(videne.size, 3);
  assert.equal(k.cetvrtZgrade("kuca"), "srediste");
  assert.equal(k.cetvrtZgrade("farma"), "ranc");
  assert.equal(k.cetvrtZgrade("rudnik"), "rad");

  const prazno = {};
  const bunar = u.PARCELE.find((p) => p.id === "bunar");
  const kuca = u.PARCELE.find((p) => p.id === "kuca");
  assert.equal(k.vodaJacina(bunar, prazno), 0);
  const sBunarom = { bunar: 1 };
  assert.ok(k.vodaJacina(bunar, sBunarom) > 0.5);
  assert.ok(k.vodaJacina(kuca, sBunarom) < k.vodaJacina(bunar, sBunarom));
  const salun = u.PARCELE.find((p) => p.id === "salun");
  const rudnik = u.PARCELE.find((p) => p.id === "rudnik");
  assert.ok(k.srecaJacina(salun, { salun: 1 }) > k.srecaJacina(rudnik, { salun: 1 }));
  assert.match(k.brojSloja("rad", "pilana", 2, { pilana: 2 }), /drva/);
  assert.equal(k.brojSloja("voda", "bunar", 0, {}), "prazno");

  const sve = u.PARCELE.map((p) => p.id);
  for (const s of k.stazeKretanja(sve)) {
    assert.equal(u.putSijeceRomb(s.tocke), null, s.id);
    const a = k.tockaNaPutu(s.tocke, 0);
    const b = k.tockaNaPutu(s.tocke, 0.999);
    assert.ok(Math.hypot(a.x - s.tocke[0].x, a.y - s.tocke[0].y) < 1.5);
    assert.ok(Math.hypot(b.x - s.tocke[s.tocke.length - 1].x, b.y - s.tocke[s.tocke.length - 1].y) < 8);
  }
  assert.ok(k.stazeKretanja(["kuca"]).some((s) => s.id === "kuca"));
  assert.ok(k.stazeKretanja([]).some((s) => s.id === "ulica"));
  for (const t of [...k.konjiSaluna(), ...k.ogradeRanca(), ...k.stokaTocke()]) {
    for (const p of u.PARCELE) assert.equal(u.uRomu(t.x, t.y, p), false);
  }
  assert.equal(k.konjiSaluna().length, 2);
  assert.deepEqual(k.brojAgenata(0, 1), { hodaci: 0, kola: 0 });
  assert.deepEqual(k.brojAgenata(5, 3), { hodaci: 3, kola: 1 });
  assert.equal(k.brojAgenata(20, 12).hodaci, 4);
  assert.equal(k.brojAgenata(20, 12).kola, 2);

  const ulica = fs.readFileSync(new URL("../src/components/game/KaubaZivaUlica.tsx", import.meta.url), "utf8");
  assert.match(ulica, /ZOOM_MIN = 0\.6/);
  assert.match(ulica, /ZOOM_MAX = 2/);
  const broj = fs.readFileSync(new URL("../src/components/game/KaubaBroj.tsx", import.meta.url), "utf8");
  assert.match(broj, /data-testid="karta-info"/);
  assert.match(ulica, /data-testid="karta-pogled"/);
  assert.doesNotMatch(ulica, /"Popis"/);
  assert.match(ulica, /detaljOdZooma/);
  assert.match(ulica, /inercija/);
  const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.equal((css.match(/cubic-bezier\(/g) || []).length, 10);
  assert.equal((css.match(/cubic-bezier\(0\.22, 1, 0\.36, 1\)/g) || []).length, 1);
  assert.match(css, /karta-info/);
  assert.match(css, /data-detalj="daleko"/);
});
