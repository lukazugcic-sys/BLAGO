import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const p = await jiti.import("../src/lib/game/mrezaPrikaz.ts");

test("prazan save složi tok bez pada", () => {
  const t = p.sloziTok(null);
  assert.equal(t.selo.kvaliteta, p.sloziTok({}).selo.kvaliteta);
  assert.equal(t.hubovi.length, 8);
  assert.ok(t.hubovi.every((h) => h.mutan));
  assert.ok(t.dodaci.some((c) => c.id === "oklop"));
});

test("hub je prosjek zgrada, doprinos je zbroj prema selu", () => {
  const t = p.sloziTok({
    imeIgraca: "Hrast",
    gradevine: { kuca: 2, blok: 0 },
    igracRazina: 1,
  });
  const krov = t.hubovi.find((h) => h.id === "krov");
  assert.ok(krov);
  assert.equal(krov.mutan, false);
  assert.equal(krov.kvaliteta, Math.round(krov.zgrade.reduce((a, z) => a + z.kvaliteta, 0) / krov.zgrade.length));
  assert.equal(krov.doprinos, krov.zgrade.reduce((a, z) => a + z.doprinos, 0));
  assert.equal(t.selo.naziv, "Hrast");
});

test("utjecaji se spajaju po paru i predznaku, ostaje jači", () => {
  const out = p.spojiUtjecaje([
    { od: "voda", do: "jelo", predznak: 1, jacina: 0.2, rec: "slabo" },
    { od: "voda", do: "jelo", predznak: 1, jacina: 0.8, rec: "jako" },
    { od: "voda", do: "jelo", predznak: -1, jacina: 0.3, rec: "manjak" },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out.find((u) => u.predznak === 1).rec, "jako");
});

test("obruč ne pokriva stvarni utjecaj", () => {
  assert.equal(p.imaUtjecaj([{ od: "krov", do: "voda", predznak: 1, jacina: 0.2, rec: "" }], "voda", "krov"), true);
  assert.equal(p.imaUtjecaj([], "red", "krov"), false);
});

test("gramatika zgrada i granice zuma", () => {
  assert.equal(p.brojZgrada(1), "1 zgrada");
  assert.equal(p.brojZgrada(3), "3 zgrade");
  assert.equal(p.brojZgrada(5), "5 zgrada");
  assert.equal(p.brojZgrada(11), "11 zgrada");
  assert.equal(p.brojZgrada(22), "22 zgrade");
  assert.equal(p.stisniZum(9), 2.4);
  assert.equal(p.stisniZum(0), 1);
  assert.deepEqual(p.stisniPomak(1, 40, -20), { x: 0, y: 0 });
  const pom = p.stisniPomak(2, 80, -80);
  assert.ok(Math.abs(pom.x) <= 28 && Math.abs(pom.y) <= 28);
});
