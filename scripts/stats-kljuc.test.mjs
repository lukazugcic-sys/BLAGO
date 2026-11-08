import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("statistika uspoređuje hash, ne čuva ključ", () => {
  const env = { ...process.env };
  delete env.BLAGO_STATS_KEY;
  delete env.BLAGO_STATS_KEY_SHA256;
  const r = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `import { createHash } from "node:crypto";
      import { statsKljucOdgovara } from "./src/lib/game/statsKljuc.ts";
      const fixture = "test-fixture-nije-tajna";
      const drugi = "drugi-fixture";
      if (statsKljucOdgovara("")) process.exit(2);
      if (statsKljucOdgovara("krivi-kljuc-za-test")) process.exit(3);
      process.env.BLAGO_STATS_KEY_SHA256 = createHash("sha256").update(fixture).digest("hex");
      if (!statsKljucOdgovara(fixture)) process.exit(4);
      if (statsKljucOdgovara(drugi)) process.exit(5);
      process.env.BLAGO_STATS_KEY = drugi;
      if (!statsKljucOdgovara(drugi)) process.exit(6);
      if (statsKljucOdgovara(fixture)) process.exit(7);
      delete process.env.BLAGO_STATS_KEY;
      delete process.env.BLAGO_STATS_KEY_SHA256;
      if (statsKljucOdgovara(fixture)) process.exit(8);
      console.log("ok");
      `,
    ],
    { encoding: "utf8", cwd: new URL("..", import.meta.url), env },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
