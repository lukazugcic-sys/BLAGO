import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

test("termika se pali tek nakon niza teških kadrova", async () => {
  const jiti = createJiti(import.meta.url);
  const m = await jiti.import("../src/lib/game/termika.ts");
  const t = new m.Termika();
  assert.equal(t.frame(0), 0);
  assert.equal(t.frame(1), 0);
  assert.equal(t.frame(1), 0);
  assert.equal(t.frame(1), 1);
  for (let i = 0; i < 5; i++) t.frame(1);
  assert.equal(t.vruce, 2);
  assert.equal(t.frame(0), 1);
  for (let i = 0; i < 5; i++) t.frame(0);
  assert.equal(t.vruce, 0);
});
