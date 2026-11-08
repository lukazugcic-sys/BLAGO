import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("kamenčić korita ne nosi krem krug od 78px", () => {
  const cesta = fs.readFileSync("src/components/game/KaubaCesta.tsx", "utf8");
  assert.equal(cesta.includes('className="izo-korito"'), false);
  assert.equal((cesta.match(/className="izo-korito-kamen"/g) || []).length, 2);
  assert.match(cesta, /className="izo-korito-kamen" cx=\{k\.x\} cy=\{k\.y\} rx=\{2\.2\} ry=\{1\.1\}/);
  assert.match(cesta, /className="izo-korito-kamen" cx=\{LOKVA\.x \+ 1\} cy=\{LOKVA\.y \+ 2\} rx=\{2\.4\} ry=\{1\.1\}/);
  assert.match(cesta, /className="izo-potok"/);
  assert.match(cesta, /className=\{cn\("izo-put"/);

  const css = fs.readFileSync("src/styles.css", "utf8");
  const rucno = css.split("\n").filter((l) => l.length < 500).join("\n");
  assert.match(rucno, /\.ziva-izo \.izo-korito-kamen \{ fill: #2a241c99; stroke: none; stroke-width: 0; \}/);
  assert.equal(rucno.includes(".ziva-izo .izo-korito {"), false);
  assert.equal(rucno.includes("#f3e2c0"), false);
  assert.match(css, /\.izo-korito\{fill:none;stroke:#f3e2c0;stroke-width:78px/);
});
