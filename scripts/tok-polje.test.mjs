import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

test("polje smjerova se slaže samo kad se cesta promijeni", async () => {
  const jiti = createJiti(import.meta.url);
  const m = await jiti.import("../src/lib/game/tokPolje.ts");
  const k = await jiti.import("../src/lib/game/kartaPogled.ts");
  const a = await jiti.import("../src/lib/game/agentiSim.ts");

  const xy = new Float32Array([0, 0, 128, 0, 0, 0]);
  const prije = Float32Array.from(xy);
  const tok = new m.TokPolje();
  assert.equal(tok.slozi("ravno", [{ xy, n: 3 }]), true);
  assert.deepEqual(Array.from(xy), Array.from(prije));
  const dx = tok.dx;
  assert.equal(tok.slozi("ravno", [{ xy, n: 3 }]), false);
  assert.equal(tok.dx, dx);

  const ox = new Float32Array(1);
  const oy = new Float32Array(1);
  tok.smjer(48, 0, ox, oy, 0);
  assert.ok(ox[0] > 0.9, String(ox[0]));
  assert.ok(Math.abs(oy[0]) < 0.05, String(oy[0]));
  tok.smjer(-500, -500, ox, oy, 0);
  assert.equal(ox[0], 0);
  assert.equal(oy[0], 0);
  for (let i = 0; i < 200; i++) tok.smjer(48, 0, ox, oy, 0);
  assert.equal(tok.dx, dx);
  assert.equal(tok.dx.byteLength, dx.byteLength);

  const prazno = new m.TokPolje();
  assert.equal(prazno.slozi("prazno", []), true);
  prazno.smjer(0, 0, ox, oy, 0);
  assert.equal(ox[0], 0);

  const staze = k.stazeKretanja(["kuca"]);
  const flat = staze.map((s) => a.spljostiRutu(s.tocke));
  const grad = new m.TokPolje();
  let kljuc = "";
  for (const s of staze) kljuc += s.id + s.tocke.length + "|";
  assert.equal(grad.slozi(kljuc, flat), true);
  assert.equal(grad.slozi(kljuc, flat), false);
  const p = k.tockaNaPutu(staze[0].tocke, 0.35);
  grad.smjer(p.x, p.y, ox, oy, 0);
  assert.ok(Math.hypot(ox[0], oy[0]) > 0.5);

  const hodaci = fs.readFileSync(new URL("../src/components/game/KaubaHodaci.tsx", import.meta.url), "utf8");
  assert.match(hodaci, /tockaNaPutu/);
  assert.match(hodaci, /spljostiRutu/);
  assert.match(hodaci, /tok\.slozi/);
  assert.doesNotMatch(hodaci, /\.smjer\(/);
  const ulica = fs.readFileSync(new URL("../src/components/game/KaubaZivaUlica.tsx", import.meta.url), "utf8");
  assert.match(ulica, /KaubaHodaci/);
  assert.match(ulica, /Tok kaube/);
  assert.doesNotMatch(ulica, /\.smjer\(/);
});
