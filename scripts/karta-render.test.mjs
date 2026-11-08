import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("karta ne budi cijeli ekran zbog sata, filtera ni ljudi", () => {
  const ekran = fs.readFileSync("src/components/game/KaubaZivaUlica.tsx", "utf8");
  assert.equal(ekran.includes("useSekunda"), false);
  assert.equal(ekran.includes("s.ljudi"), false);
  assert.equal(ekran.includes("kaubaOd"), false);
  const css = fs.readFileSync("src/styles.css", "utf8").split("\n").filter((l) => l.length < 400).join("\n");
  assert.equal(css.includes("drop-shadow"), false);
});

test("sloj i zum ne ulaze u slaganje kuća", () => {
  const kuce = fs.readFileSync("src/components/game/KaubaKuce.tsx", "utf8");
  const ekran = fs.readFileSync("src/components/game/KaubaZivaUlica.tsx", "utf8");
  assert.equal(kuce.includes("memo("), true);
  assert.equal(kuce.includes("pogled"), false);
  assert.equal(kuce.includes("detalj"), false);
  const poziv = ekran.slice(ekran.indexOf("<KaubaKuce"), ekran.indexOf("/>", ekran.indexOf("<KaubaKuce")));
  assert.equal(poziv.includes("pogled"), false);
  assert.equal(poziv.includes("detalj"), false);
});
