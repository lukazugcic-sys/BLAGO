import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

test("rekviziti terena ne sjede na kući", async () => {
  const jiti = createJiti(import.meta.url);
  const t = await jiti.import("../src/lib/game/teren.ts");
  const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
  const tocke = t.tockeRekvizita();
  assert.ok(tocke.length > 20);
  for (const q of tocke) {
    for (const p of u.PARCELE) {
      assert.equal(u.uRomu(q.x, q.y, p), false, `${Math.round(q.x)},${Math.round(q.y)} na ${p.id}`);
    }
  }
});
