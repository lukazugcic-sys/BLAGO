import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cesta = fs.readFileSync("src/components/game/KaubaCesta.tsx", "utf8");
const obzor = fs.readFileSync("src/components/game/KaubaObzor.tsx", "utf8");
const css = fs.readFileSync("src/styles.css", "utf8");

function provjeriUrl(src, ime) {
  const defs = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const used = [...src.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(used.length > 0, ime);
  for (const id of used) assert.ok(defs.has(id), `${ime} nema #${id}`);
}

test("svg url(#id) ima defs u istom crtežu", () => {
  provjeriUrl(cesta, "KaubaCesta");
  provjeriUrl(obzor, "KaubaObzor");
});

test("zadnje pravilo drži tlo iza ceste i potok vidljiv", () => {
  const obzorZ = [...css.matchAll(/\.ziva-izo \.izo-obzor \{ z-index: (\d+); \}/g)].at(-1);
  const cestaZ = [...css.matchAll(/\.ziva-izo \.izo-cesta \{ z-index: (\d+); \}/g)].at(-1);
  assert.ok(obzorZ && cestaZ);
  assert.ok(Number(obzorZ[1]) < Number(cestaZ[1]));
  const grupa = css.lastIndexOf(".ziva-izo .izo-potok,\n.ziva-izo .izo-korito");
  const skriven = css.indexOf(".izo-potok,.ziva-izo .izo-potok-odraz");
  assert.ok(skriven > 0 && grupa > skriven);
  const blok = css.slice(grupa, css.indexOf("}", grupa));
  assert.match(blok, /display: inline/);
  assert.doesNotMatch(blok, /opacity:\s*0/);
  const urlBoja = css.lastIndexOf("fill:url(#izo-voda-boja)");
  const punaBoja = css.indexOf(".ziva-izo .izo-potok {\n  fill: none;");
  assert.ok(urlBoja > 0 && punaBoja > urlBoja);
});

test("teksture koje karta referencira postoje", () => {
  for (const f of ["public/art/tlo-zemlja.webp", "public/art/tlo-put.webp", "public/art/tlo-voda.webp"]) {
    assert.ok(fs.statSync(f).size > 500, f);
  }
});

test("kanjon i rešetka nisu u crtežu karte", () => {
  const src = `${cesta}\n${obzor}`;
  assert.equal(src.includes("izo-brdo"), false);
  assert.equal(src.includes("izo-mesa"), false);
});
