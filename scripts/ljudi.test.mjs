import assert from "node:assert/strict";
import test from "node:test";

const POOL = [
  { id: "ivo", ime: "Ivo", posao: "Građevinac", hub: "krov" },
  { id: "kata", ime: "Kata", posao: "Lovac", hub: "jelo" },
  { id: "mile", ime: "Mile", posao: "Vodonoša", hub: "voda" },
  { id: "mara", ime: "Mara", posao: "Gostioničarka", hub: "zabava" },
  { id: "boro", ime: "Boro", posao: "Šerif", hub: "red" },
  { id: "pero", ime: "Pero", posao: "Konjušar", hub: "konji" },
  { id: "tena", ime: "Tena", posao: "Kaubojka", hub: "konji" },
  { id: "jure", ime: "Jure", posao: "Klesar", hub: "posao" },
  { id: "simun", ime: "Šime", posao: "Trgovac", hub: "posao" },
  { id: "ruza", ime: "Ruža", posao: "Liječnica", hub: "zdravlje" },
  { id: "zora", ime: "Zora", posao: "Travarica", hub: "zdravlje" },
];
const GLAVNI = new Set(["boro", "kata", "ivo", "mara", "mile", "pero", "simun", "ruza"]);
const JEDINSTVENI = new Set(["Šerif"]);

function normalizirajPosao(posao) {
  return posao === "Lovačica" ? "Lovac" : posao;
}

function jedanNaPoslu(ljudi, posao) {
  const svi = ljudi.filter((p) => p.posao === posao);
  if (svi.length <= 1) return ljudi;
  const keep =
    svi.find((p) => p.id !== "boro" && p.ime !== "Boro") ??
    svi.find((p) => p.ime !== "Boro") ??
    svi.find((p) => p.id === "boro") ??
    svi[0];
  return ljudi.filter((p) => p.posao !== posao || p.id === keep.id);
}

function uskladi(ljudi, cilj) {
  const n = Math.max(1, Math.min(POOL.length, Math.floor(cilj)));
  const vidjeno = new Set();
  let ima = [];
  for (const p of ljudi) {
    const lik = { ...p, posao: normalizirajPosao(p.posao) };
    if (vidjeno.has(lik.id)) continue;
    vidjeno.add(lik.id);
    ima.push(lik);
  }
  ima = jedanNaPoslu(ima, "Šerif");
  while (ima.length < n) {
    const zauzeti = new Set(ima.map((p) => p.id));
    const zauzetiPosao = new Set(ima.map((p) => p.posao).filter((posao) => JEDINSTVENI.has(posao)));
    const sljedeci =
      POOL.find((p) => GLAVNI.has(p.id) && !zauzeti.has(p.id) && !zauzetiPosao.has(p.posao)) ??
      POOL.find((p) => !zauzeti.has(p.id) && !zauzetiPosao.has(p.posao));
    if (!sljedeci) break;
    ima.push({ ...sljedeci });
  }
  return ima;
}

test("preimenovani šerif ne spawna starog Boru kad selo raste", () => {
  const ljudi = [
    { id: "ivo", ime: "Ivo", posao: "Građevinac" },
    { id: "kata", ime: "Kata", posao: "Lovac" },
    { id: "mile", ime: "Mile", posao: "Vodonoša" },
    { id: "mara", ime: "Mara", posao: "Gostioničarka" },
    { id: "l-abc", ime: "Maks", posao: "Šerif" },
  ];
  const out = uskladi(ljudi, 6);
  const serifi = out.filter((p) => p.posao === "Šerif");
  assert.equal(serifi.length, 1);
  assert.equal(serifi[0].ime, "Maks");
  assert.equal(out.some((p) => p.id === "boro"), false);
  assert.equal(out.some((p) => p.id === "pero"), true);
});

test("dva šerifa se svedu na preimenovanog", () => {
  const ljudi = [
    { id: "l-abc", ime: "Maks", posao: "Šerif" },
    { id: "boro", ime: "Boro", posao: "Šerif" },
    { id: "ivo", ime: "Ivo", posao: "Građevinac" },
  ];
  const out = uskladi(ljudi, 3);
  const serifi = out.filter((p) => p.posao === "Šerif");
  assert.equal(serifi.length, 1);
  assert.equal(serifi[0].ime, "Maks");
});

test("lovačica postaje lovac", () => {
  assert.equal(normalizirajPosao("Lovačica"), "Lovac");
  const out = uskladi([{ id: "kata", ime: "Kata", posao: "Lovačica" }], 1);
  assert.equal(out[0].posao, "Lovac");
});

test("osam hubova ima heroja sa zvjezdicom", () => {
  const hubovi = ["krov", "jelo", "zabava", "voda", "posao", "red", "konji", "zdravlje"];
  const heroji = POOL.filter((p) => GLAVNI.has(p.id));
  assert.equal(heroji.length, 8);
  for (const h of hubovi) {
    assert.equal(heroji.filter((p) => p.hub === h).length, 1, h);
  }
});

test("uskladi prvo dovodi heroje pa ostale", () => {
  const start = POOL.slice(0, 5);
  const out = uskladi(start, 8);
  const ids = out.map((p) => p.id);
  assert.ok(ids.includes("pero"));
  assert.ok(ids.includes("simun"));
  assert.ok(ids.includes("ruza"));
  assert.equal(ids.includes("tena"), false);
});
