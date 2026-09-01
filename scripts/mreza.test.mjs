import assert from "node:assert/strict";
import test from "node:test";

const BAZA_SELO = 20;
const doprinos = (predznak, jacina, kvOd) => predznak * jacina * kvOd;
const kvSela = (ulazi) =>
  Math.max(0, Math.min(100, Math.round(BAZA_SELO + ulazi.reduce((a, n) => a + n, 0))));
const tok = (k) => 0.88 + (0.24 * k) / 100;

test("selo quality is base plus incoming contributions", () => {
  const ulazi = [doprinos(1, 0.2, 100), doprinos(1, 0.16, 50), doprinos(-1, 0.48, 57)];
  assert.equal(kvSela(ulazi), Math.round(20 + 20 + 8 - 27.36));
});

test("burning mill: one fire path to selo, no production edge", () => {
  const veze = [{ od: "pozar", do: "selo", predznak: -1, jacina: 0.48 }];
  assert.equal(veze.filter((v) => v.od === "z:pilana" && v.do === "selo").length, 0);
  assert.equal(veze.filter((v) => v.od === "pozar" && v.do === "selo").length, 1);
  assert.equal(veze.filter((v) => v.od === "pozar").length, 1);
});

test("tok multiplier is 1 at quality 50", () => {
  assert.equal(tok(0), 0.88);
  assert.equal(tok(50), 1);
  assert.equal(tok(100), 1.12);
});

test("contribution identity: doprinos = sign * weight * source", () => {
  assert.equal(doprinos(1, 0.25, 80), 20);
  assert.equal(doprinos(-1, 0.5, 60), -30);
});
