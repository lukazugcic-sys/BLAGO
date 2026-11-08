import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

test("krivulje su jedan izvor", () => {
  const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /--krivulja-meka: cubic-bezier\(0\.22, 1, 0\.36, 1\);/);
  assert.match(css, /--krivulja-izlaz: cubic-bezier\(0\.64, 0, 0\.78, 0\);/);
  assert.match(css, /--krivulja-udarac: cubic-bezier\(0\.34, 1\.36, 0\.64, 1\);/);
  assert.equal((css.match(/cubic-bezier\(0\.22, 1, 0\.36, 1\)/g) || []).length, 1);
  assert.equal((css.match(/cubic-bezier\(0\.34, 1\.36, 0\.64, 1\)/g) || []).length, 1);
  assert.ok((css.match(/var\(--krivulja-meka\)/g) || []).length > 40);
  assert.ok((css.match(/var\(--krivulja-udarac\)/g) || []).length > 15);
  assert.match(css, /::view-transition-old\(kauba-kadar\) \{\s*animation:\.28s var\(--krivulja-izlaz\)/);
  assert.match(css, /--korak: steps\(1, end\);/);
  assert.match(css, /--korak-dva: steps\(2, end\);/);
  assert.match(css, /skull-jitter 0\.1s var\(--korak\)/);
  assert.match(css, /var\(--korak\) infinite slot-lampa/);
  assert.match(css, /var\(--korak\) infinite kauboj-korak/);
  assert.match(css, /jackpot-flicker 0\.16s var\(--korak-dva\)/);

  const pager = fs.readFileSync(new URL("../src/components/game/ScreenPager.tsx", import.meta.url), "utf8");
  assert.match(pager, /uzorakMeka\(p\)/);
  assert.doesNotMatch(pager, /easeOutCubic/);
});

test("uzorak prati css hod", () => {
  const r = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `import { uzorakMeka, uzorakUdarac } from "./src/lib/game/pokret.ts";
const out = { z: uzorakMeka(0), m: uzorakMeka(0.5), k: uzorakMeka(1), u: uzorakUdarac(0.65) };
if (!(out.z === 0 && out.k === 1 && out.m > 0.85 && out.m < 1 && out.u > 1 && out.u < 1.2)) {
  console.error(JSON.stringify(out));
  process.exit(1);
}
console.log(JSON.stringify(out));`,
    ],
    { encoding: "utf8", cwd: new URL("..", import.meta.url) },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
