// Ranch fence (PLOT): short corral on the tor edge, not a long line across the map.
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const j = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const t = await j.import(ROOT + "src/lib/game/teren.ts");
const u = await j.import(ROOT + "src/lib/game/ulicaRaspored.ts");
const parse = (s) => s.split(" ").filter(Boolean).map((p) => p.split(",").map(Number));

test("fence exists, has posts outside every plot", () => {
  assert.ok(t.PLOT.stupovi.length >= 2);
  for (const p of t.PLOT.stupovi) assert.ok(!u.PARCELE.some((q) => u.uRomu(p.x, p.y, q)), `post in plot at ${p.x},${p.y}`);
});

test("fence is short (about one plot edge), not spanning the ranch", () => {
  const s = t.PLOT.stupovi;
  const len = Math.hypot(s.at(-1).x - s[0].x, s.at(-1).y - s[0].y);
  assert.ok(len <= u.CELIJA_W * 0.9, `fence length ${len.toFixed(0)}`);
  const tor = u.PARCELE.find((p) => p.id === "tor");
  for (const p of s) assert.ok(Math.hypot(p.x - tor.x, p.y - tor.y) <= u.CELIJA_W, "post far from tor");
});

test("both rails hang on the posts (between post top y-7 and bottom y+1)", () => {
  for (const rail of [t.PLOT.zica, t.PLOT.letva]) {
    const pts = parse(rail);
    assert.equal(pts.length, t.PLOT.stupovi.length);
    pts.forEach(([, y], i) => {
      const py = t.PLOT.stupovi[i].y;
      assert.ok(y >= py - 7.5 && y <= py + 1.5, `rail y ${y} off post ${py}`);
    });
  }
});

test("posts keep clear of the creek", () => {
  const potok = t.tockeOd(t.POTOK);
  for (const p of t.PLOT.stupovi) assert.ok(potok.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= 16));
});
