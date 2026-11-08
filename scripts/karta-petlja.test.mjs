import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

test("karta ima samo jednu petlju crtanja", async () => {
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  const jiti = createJiti(import.meta.url);
  const p = await jiti.import("../src/lib/game/kartaPetlja.ts");
  const a = p.kartaPetljaPokreni(() => {});
  a();
  const b = p.kartaPetljaPokreni(() => {});
  const c = p.kartaPetljaPokreni(() => {});
  assert.equal(p.kartaPetljaBroj(), 1);
  b();
  assert.equal(p.kartaPetljaBroj(), 1);
  c();
  assert.equal(p.kartaPetljaBroj(), 0);
});
