import assert from "node:assert/strict";
import test from "node:test";

/** Spec of raids.ts Nim (Sprague–Grundy / Theorem 2.3). Keep in sync. */

function nimZbroj(h) {
  return h[0] ^ h[1] ^ h[2];
}

function primijeniPotez(h, p) {
  const next = [h[0], h[1], h[2]];
  next[p.hrpa] = Math.max(0, next[p.hrpa] - p.skini);
  return next;
}

function pobjednickiPotez(h) {
  const s = nimZbroj(h);
  if (s === 0) return null;
  for (let i = 0; i < 3; i++) {
    const cilj = h[i] ^ s;
    if (cilj < h[i]) return { hrpa: i, skini: h[i] - cilj };
  }
  return null;
}

test("1+2+3 is P (xor 0)", () => {
  assert.equal(nimZbroj([1, 2, 3]), 0);
  assert.equal(pobjednickiPotez([1, 2, 3]), null);
});

test("winning move from 1,2,4 is to 1,2,3", () => {
  const p = pobjednickiPotez([1, 2, 4]);
  assert.ok(p);
  assert.deepEqual(primijeniPotez([1, 2, 4], p), [1, 2, 3]);
});

test("every triple with xor 0 has no winning move", () => {
  for (let a = 0; a <= 8; a++) {
    for (let b = 0; b <= 8; b++) {
      const c = a ^ b;
      assert.equal(nimZbroj([a, b, c]), 0);
      assert.equal(pobjednickiPotez([a, b, c]), null);
    }
  }
});

test("every N-position has a move to xor 0", () => {
  for (let a = 0; a <= 6; a++) {
    for (let b = 0; b <= 6; b++) {
      for (let c = 0; c <= 6; c++) {
        if ((a ^ b ^ c) === 0) continue;
        const p = pobjednickiPotez([a, b, c]);
        assert.ok(p, `${a},${b},${c} should have a winning move`);
        const next = primijeniPotez([a, b, c], p);
        assert.equal(nimZbroj(next), 0);
      }
    }
  }
});

test("2019 xor 2020 is 7 (primer example)", () => {
  assert.equal(2019 ^ 2020, 7);
});

function tkoIdePrvi(jahanje, ophodnja) {
  if (jahanje > 0) return "igrac";
  if (ophodnja > 0) return "npc";
  return "igrac";
}

test("jahanje ide prvo, ophodnja čeka na ulici", () => {
  assert.equal(tkoIdePrvi(0, 0), "igrac");
  assert.equal(tkoIdePrvi(2, 0), "igrac");
  assert.equal(tkoIdePrvi(0, 2), "npc");
  assert.equal(tkoIdePrvi(1, 3), "igrac");
});

function plijenSJarmom(baza, rad) {
  const k = 1 + Math.max(0, rad) * 0.06;
  return Math.floor(baza * k);
}

test("jaram vuče veći plijen", () => {
  assert.equal(plijenSJarmom(10, 0), 10);
  assert.ok(plijenSJarmom(10, 2) > 10);
});

function sljedeciTrojac(tko, saveznikTu = true) {
  if (tko === "vodja") return saveznikTu ? "saveznik" : "serif";
  if (tko === "saveznik") return "serif";
  return "vodja";
}

test("trojac ide vođa → saveznik → šerif → vođa", () => {
  assert.equal(sljedeciTrojac("vodja"), "saveznik");
  assert.equal(sljedeciTrojac("saveznik"), "serif");
  assert.equal(sljedeciTrojac("serif"), "vodja");
  assert.equal(sljedeciTrojac("vodja", false), "serif");
});

function potezIzDelte(prije, poslije) {
  for (let i = 0; i < 3; i++) {
    const d = prije[i] - poslije[i];
    if (d > 0) return { hrpa: i, skini: d };
  }
  return null;
}

test("potez iz delte čita koji je žeton uzet", () => {
  assert.deepEqual(potezIzDelte([3, 2, 1], [1, 2, 1]), { hrpa: 0, skini: 2 });
  assert.equal(potezIzDelte([1, 2, 3], [1, 2, 3]), null);
});

