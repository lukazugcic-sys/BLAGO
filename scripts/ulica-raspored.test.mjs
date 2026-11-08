import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

test("parcele se ne preklapaju i zgrada stoji na svojoj", async () => {
  const jiti = createJiti(import.meta.url);
  const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
  assert.equal(u.PARCELE.length, 27);
  assert.equal(u.CELIJA_W, 96);
  assert.equal(u.CELIJA_H, 48);
  assert.ok(u.DEKOR.length >= 8 && u.DEKOR.length <= 15);
  const kutije = u.PARCELE.map((p) => u.parcelaKutija(p));
  for (let i = 0; i < kutije.length; i++) {
    for (let j = i + 1; j < kutije.length; j++) {
      assert.equal(u.kutijeSeSijeku(kutije[i], kutije[j]), false, `${kutije[i].id} i ${kutije[j].id}`);
    }
  }
  const kuca = u.PARCELE.find((p) => p.id === "kuca");
  assert.ok(kuca);
  assert.equal(kuca.col, u.POJAS_L.colDo);
  assert.equal(kuca.row, 2);
  const lijevo = u.PARCELE.filter((p) => p.strana === "l");
  const desno = u.PARCELE.filter((p) => p.strana === "d");
  const dubina = (lista) => new Set(lista.map((p) => p.col)).size;
  assert.ok(dubina(lijevo) >= 6, `lijevo stupaca ${dubina(lijevo)}`);
  assert.ok(dubina(desno) >= 6, `desno stupaca ${dubina(desno)}`);
  for (const p of lijevo) assert.ok(p.col < u.ULICA.colOd, p.id);
  for (const p of desno) assert.ok(p.col > u.ULICA.colDo, p.id);
  for (const p of u.PARCELE) {
    assert.equal(u.zgradaJeNaParceli(p), true, p.id);
    const romb = u.centarRomba(p);
    for (const vrsta of ["skela", "zgrada", "kolci"]) {
      const s = u.centarSpritea(p, vrsta);
      assert.ok(Math.hypot(s.x - romb.x, s.y - romb.y) < 3, `${p.id} ${vrsta}`);
    }
  }
  for (const d of u.DEKOR) {
    for (const p of u.PARCELE) {
      assert.equal(u.uRomu(d.x, d.y, p), false, `${d.tip} na ${p.id}`);
    }
    const px = 58 * d.sc;
    assert.ok(px >= u.CELIJA_W * 0.4 && px <= u.CELIJA_W * 0.8, `${d.tip} ${px}`);
  }
  const redovi = u.PARCELE.map((p) => p.row);
  assert.ok(u.ULICA.redOd < Math.min(...redovi));
  assert.ok(u.ULICA.redDo > Math.max(...redovi));
  let slike = 0;
  for (const d of u.DEKOR) {
    const put = new URL(`../public/art/zgrade/izo/${d.tip}.webp`, import.meta.url);
    const buf = fs.readFileSync(put);
    assert.ok(buf.length > 500, d.tip);
    slike += 1;
  }
  assert.ok(slike >= 10);
  const ulica = fs.readFileSync(new URL("../src/components/game/KaubaZivaUlica.tsx", import.meta.url), "utf8");
  assert.match(ulica, /centarSpritea\(/);
  assert.match(ulica, /data-izo="dekor"/);
  assert.match(ulica, /loading="eager"/);
  const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.ziva-izo \.izo-skala \{[^}]*transform:\s*translate\(-50%,\s*-50%\)/);
  for (const [vw, vh] of [
    [360, 320],
    [390, 420],
    [430, 480],
  ]) {
    const g = u.pogledOkoKuce(vw, vh);
    assert.ok(g.ids.includes("kuca"), `${vw}x${vh}`);
    const uKadr = u.PARCELE.filter((p) => g.ids.includes(p.id));
    assert.ok(uKadr.some((p) => p.strana === "l") && uKadr.some((p) => p.strana === "d"), `${vw}x${vh}`);
    assert.ok(g.dekor >= 3, `${vw}x${vh} dekor ${g.dekor}`);
  }
});

test("puteljak ne siječe romb, sitni dekor stoji izvan parcela", async () => {
  const jiti = createJiti(import.meta.url);
  const u = await jiti.import("../src/lib/game/ulicaRaspored.ts");
  const jedan = u.putelji(["kuca"]);
  assert.equal(jedan.length, 1);
  assert.equal(jedan[0].veza, false);
  assert.equal(u.putSijeceRomb(jedan[0].tocke), null);
  const susjed = u.putelji(["kuca", "bunar"]);
  assert.ok(susjed.some((p) => p.id === "kuca-bunar" && p.veza));
  const preko = u.putelji(["pilana", "trgovina"]);
  assert.ok(preko.some((p) => p.id === "pilana-trgovina" && p.veza));
  const svi = u.putelji(u.PARCELE.map((p) => p.id));
  assert.equal(svi.filter((p) => !p.veza).length, 27);
  for (const p of svi) {
    assert.equal(u.putSijeceRomb(p.tocke), null, p.id);
    assert.ok(p.tocke.length >= 3, p.id);
  }
  const sitni = u.sitniDekor();
  assert.ok(sitni.length >= 8 && sitni.length <= 16, String(sitni.length));
  const tipovi = new Set(sitni.map((s) => s.tip));
  for (const tip of ["ograda", "bacva", "sijeno", "lampa", "kaktus", "kamen", "kola", "korito"]) {
    assert.ok(tipovi.has(tip), tip);
  }
  for (const s of sitni) {
    for (const p of u.PARCELE) {
      assert.equal(u.uRomu(s.x, s.y, p), false, `${s.tip} na ${p.id}`);
    }
  }
  const ulica = [
    "src/components/game/KaubaZivaUlica.tsx",
    "src/components/game/KaubaKuce.tsx",
    "src/components/game/KaubaCesta.tsx",
  ]
    .map((f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8"))
    .join("\n");
  assert.match(ulica, /putelji/);
  assert.match(ulica, /izo-put/);
  assert.match(ulica, /izo-uze/);
  assert.match(ulica, /izo-dim/);
  assert.match(ulica, /id === "mlin"/);
  const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.equal((css.match(/cubic-bezier\(/g) || []).length, 10);
  assert.equal((css.match(/cubic-bezier\(0\.22, 1, 0\.36, 1\)/g) || []).length, 1);
  assert.equal((css.match(/cubic-bezier\(0\.34, 1\.36, 0\.64, 1\)/g) || []).length, 1);
  assert.match(css, /izo-put-ulaz[\s\S]*var\(--krivulja-meka\)/);
  assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.izo-dim i/);
});
