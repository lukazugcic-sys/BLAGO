import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

test("akuzativ imena stranca", async () => {
  const jiti = createJiti(import.meta.url);
  const { akuzativImena, natpisOtjeraj } = await jiti.import("../src/lib/game/akuzativ.ts");
  assert.equal(akuzativImena("Boro"), "Boru");
  assert.equal(akuzativImena("Ivo"), "Ivu");
  assert.equal(akuzativImena("Vlado"), "Vladu");
  assert.equal(akuzativImena("Božo"), "Božu");
  assert.equal(akuzativImena("Mara"), "Maru");
  assert.equal(akuzativImena("Kata"), "Katu");
  assert.equal(akuzativImena("Luka"), "Luku");
  assert.equal(akuzativImena("Andrija"), "Andriju");
  assert.equal(akuzativImena("Jure"), "Juru");
  assert.equal(akuzativImena("Mile"), "Milu");
  assert.equal(akuzativImena("Ivan"), "Ivana");
  assert.equal(akuzativImena("Boru"), "Boru");
  assert.equal(akuzativImena("  "), "stranca");
  assert.equal(natpisOtjeraj("Boro"), "Otjeraj Boru");
});

test("prazno ime ne ide u zagrade", async () => {
  const jiti = createJiti(import.meta.url);
  const { imeJePrazno, imeZaNatpis, pozdravIgraca } = await jiti.import("../src/lib/game/ime.ts");
  for (const p of ["", "   ", "()", "( )", "Kauba", "Kauboj", "Igrač"]) {
    assert.equal(imeJePrazno(p), true, p);
  }
  assert.equal(imeZaNatpis("()"), "Kauboju");
  assert.equal(imeZaNatpis(""), "Kauboju");
  assert.equal(pozdravIgraca("()"), "Bok, kauboju!");
  assert.equal(pozdravIgraca("Luka"), "Bok, Luka");
  assert.equal(imeZaNatpis("Luka"), "Luka");
});

test("dugo ime se smanji prije trotočke", async () => {
  const jiti = createJiti(import.meta.url);
  const { velicinaImena } = await jiti.import("../src/lib/game/ime.ts");
  assert.equal(velicinaImena("Luka"), 10);
  assert.equal(velicinaImena("Kauboju"), 10);
  assert.equal(velicinaImena("Zvonimir"), 8);
  assert.equal(velicinaImena("DesetZnaka"), 8);
  assert.equal(velicinaImena("ZapadniVjet"), 7);
  const header = fs.readFileSync(new URL("../src/components/game/Header.tsx", import.meta.url), "utf8");
  assert.match(header, /velicinaImena\(imeIgraca\)/);
  assert.match(header, /length > 10 && "max-w-\[5\.5rem\] truncate"/);
  assert.doesNotMatch(header, /max-w-\[4\.2rem\] truncate/);
});
