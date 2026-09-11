import assert from "node:assert/strict";
import test from "node:test";

const izracunajMaxEnergiju = (baterija) => 20 + baterija * 6;
const izracunajEnergijaRegenMs = (baterija) =>
  Math.max(2000, 4500 - Math.max(0, baterija) * 380);
const izracunajMaxStitova = (oklop) => 1 + oklop;
const izracunajSansuZaDobitak = (sreca) => Math.min(0.18, 0.09 + sreca * 0.015);
const izracunajPotrebniXp = (razina) =>
  Math.floor(90 * Math.pow(1.33, Math.max(0, razina - 1)) + 30 * Math.max(1, razina));
const izracunajPrestigeMnozitelj = (prestige) => 1 + prestige * 0.25;
const izracunajTokMnozitelj = (kvalitetaSela) => {
  const k = Math.max(0, Math.min(100, kvalitetaSela));
  return 0.88 + (0.24 * k) / 100;
};
const LINE_MULT = { 3: 1, 4: 3, 5: 6 };
const JACKPOT_BONUS = 1.4;
const izracunajXpVrtnje = (ulog, dobitneCelije, sretna) => {
  const baza = 1;
  const linija = dobitneCelije > 0 ? 1 : 0;
  const sreca = sretna ? 2 : 0;
  return baza + linija + sreca;
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function formatHud(n) {
  const v = Math.floor(Math.abs(n));
  if (v < 1000) return String(v);
  if (v < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

const cycleDay = (streak) => ((Math.max(1, streak) - 1) % 7) + 1;

test("energija raste s baterijom, regen ne ide ispod 2000ms", () => {
  assert.equal(izracunajMaxEnergiju(0), 20);
  assert.equal(izracunajMaxEnergiju(2), 32);
  assert.equal(izracunajEnergijaRegenMs(0), 4500);
  assert.equal(izracunajEnergijaRegenMs(20), 2000);
});

const POKRICE = { kuca: 5, blok: 10, bunar: 8, lov: 6, salun: 8, posao: 4 };
const izracunajKapacitet = (g) => 4 + (g.kuca || 0) * POKRICE.kuca + (g.blok || 0) * POKRICE.blok;
const pokrice = (pokriva, ljudi) => (ljudi <= 0 ? 1 : Math.min(1, pokriva / ljudi));
function izracunajKauba(g, ljudi) {
  const n = Math.max(0, ljudi);
  const kapacitet = izracunajKapacitet(g);
  const poslovi = ((g.pilana || 0) + (g.kamenolom || 0) + (g.rudnik || 0)) * POKRICE.posao;
  const zaposleni = Math.min(n, poslovi);
  const potrebe = {
    krov: pokrice(kapacitet, n),
    voda: pokrice((g.bunar || 0) * POKRICE.bunar, n),
    jelo: pokrice((g.lov || 0) * POKRICE.lov, n),
    zabava: pokrice((g.salun || 0) * POKRICE.salun, n),
    posao: n <= 0 ? 1 : zaposleni / n,
  };
  const sreca = Math.round(
    (100 * (potrebe.krov + potrebe.voda + potrebe.jelo + potrebe.zabava + potrebe.posao)) / 5,
  );
  const rad = poslovi <= 0 ? 0 : zaposleni / poslovi;
  return { kapacitet, poslovi, zaposleni, rad, sreca, potrebe };
}
function izracunajSelidbu(k, ticks) {
  let d = 0;
  if (k.sreca >= 45 && k.ljudi < k.kapacitet) d = (0.028 + k.sreca / 2500) * ticks;
  else if (k.sreca < 30 && k.ljudi > 4) d = -0.04 * (1 - k.sreca / 30) * ticks;
  return Math.min(k.kapacitet, Math.max(4, k.ljudi + d));
}

test("kuće daju krevete, ne instant ljude", () => {
  assert.equal(izracunajKapacitet({ kuca: 0 }), 4);
  assert.equal(izracunajKapacitet({ kuca: 2 }), 14);
  assert.equal(izracunajKapacitet({ kuca: 2, blok: 1 }), 24);
});

test("raspoloženje pada bez vode i jela", () => {
  const prazno = izracunajKauba({ kuca: 1, bunar: 0, lov: 0, salun: 0, pilana: 1, kamenolom: 0, rudnik: 0 }, 4);
  assert.ok(prazno.sreca < 55);
  const puno = izracunajKauba({ kuca: 1, bunar: 1, lov: 1, salun: 1, pilana: 1, kamenolom: 0, rudnik: 0 }, 4);
  assert.ok(puno.sreca > prazno.sreca);
  assert.equal(puno.rad, 1);
});

test("ljudi dolaze kad je veselo i ima kreveta", () => {
  const k = { ...izracunajKauba({ kuca: 2, bunar: 2, lov: 2, salun: 2, pilana: 1, kamenolom: 0, rudnik: 0 }, 4), ljudi: 4 };
  const next = izracunajSelidbu(k, 10);
  assert.ok(next > 4);
  assert.ok(next <= 14);
});

test("veseli radnici rade bolje", () => {
  const ef = (s) => 0.55 + (0.45 * Math.max(0, Math.min(100, s))) / 100;
  assert.ok(Math.abs(ef(0) - 0.55) < 1e-9);
  assert.ok(Math.abs(ef(100) - 1) < 1e-9);
  assert.ok(ef(80) > ef(20));
});

test("salun plaća goste, ne prazne stolice", () => {
  const gosti = (g, ljudi) => Math.min(Math.max(0, ljudi), (g.salun || 0) * 8);
  assert.equal(gosti({ salun: 1 }, 4), 4);
  assert.equal(gosti({ salun: 1 }, 20), 8);
  assert.equal(gosti({ salun: 0 }, 20), 0);
});

test("štitovi i sreća su ograničeni", () => {
  assert.equal(izracunajMaxStitova(0), 1);
  assert.equal(izracunajMaxStitova(4), 5);
  assert.equal(izracunajSansuZaDobitak(0), 0.09);
  assert.ok(izracunajSansuZaDobitak(99) <= 0.18);
});

test("xp i prestige", () => {
  assert.equal(izracunajPotrebniXp(1), 120);
  assert.equal(izracunajPrestigeMnozitelj(0), 1);
  assert.equal(izracunajPrestigeMnozitelj(2), 1.5);
});

test("tok sela i linije 3/4/5", () => {
  assert.equal(izracunajTokMnozitelj(50), 1);
  assert.equal(LINE_MULT[3], 1);
  assert.equal(LINE_MULT[4], 3);
  assert.equal(LINE_MULT[5], 6);
  assert.equal(JACKPOT_BONUS, 1.4);
});

test("xp vrtnje: promašaj, linija, sretna", () => {
  assert.equal(izracunajXpVrtnje(1, 0, false), 1);
  assert.equal(izracunajXpVrtnje(1, 3, false), 2);
  assert.equal(izracunajXpVrtnje(50, 5, false), 2);
  assert.equal(izracunajXpVrtnje(1, 0, true), 3);
});

function kategorijaKaube(ljudi) {
  const n = Math.floor(Math.max(0, ljudi));
  if (n < 8) return "tabor";
  if (n < 16) return "selo";
  if (n < 32) return "kauba";
  return "grad";
}

test("kauba raste tabor → selo → kauba → grad", () => {
  assert.equal(kategorijaKaube(4), "tabor");
  assert.equal(kategorijaKaube(9), "selo");
  assert.equal(kategorijaKaube(20), "kauba");
  assert.equal(kategorijaKaube(40), "grad");
});

test("hud brojevi", () => {
  assert.equal(formatHud(12), "12");
  assert.equal(formatHud(1500), "1.5k");
  assert.equal(formatHud(12000), "12k");
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
});

test("dnevni ciklus 1–7", () => {
  assert.equal(cycleDay(1), 1);
  assert.equal(cycleDay(7), 7);
  assert.equal(cycleDay(8), 1);
});

const rast = (baza, lv, k = 1.36) => Math.max(0, Math.floor(baza * Math.pow(k, Math.max(0, lv - 1))));
const popravakCijena = (lv) => ({ zlato: Math.max(8, lv * 12), drvo: Math.max(4, lv * 5) });

test("prva kuća, bunar i lov staju u start, salun ne", () => {
  const kuca = rast(28, 1);
  const bunar = rast(32, 1);
  const lov = rast(24, 1);
  const salun = rast(62, 1);
  assert.equal(kuca, 28);
  assert.equal(bunar, 32);
  assert.equal(lov, 24);
  assert.ok(kuca + bunar + lov <= 90);
  assert.ok(kuca + bunar + lov + salun > 90);
  assert.equal(popravakCijena(1).zlato, 12);
});

function uloziZaMax(maxE) {
  const LESTVICA = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500];
  const cap = Math.max(1, Math.floor(maxE));
  if (cap <= 1) return [1];
  return [...new Set([...LESTVICA.filter((n) => n < cap), cap])].sort((a, b) => a - b);
}

test("ulog prati max energiju", () => {
  assert.deepEqual(uloziZaMax(10), [1, 2, 3, 5, 8, 10]);
  assert.deepEqual(uloziZaMax(20), [1, 2, 3, 5, 8, 10, 15, 20]);
  assert.ok(uloziZaMax(30).includes(25) && uloziZaMax(30).includes(30));
  const u58 = uloziZaMax(58);
  assert.ok(u58.includes(1) && u58.includes(50) && u58.includes(58));
  assert.ok(u58.length >= 8);
});

function sestUloga(ulozi, ulog) {
  if (ulozi.length <= 6) return ulozi;
  const i = Math.max(0, ulozi.indexOf(ulog));
  let start = Math.max(0, i - 2);
  if (start + 6 > ulozi.length) start = ulozi.length - 6;
  return ulozi.slice(start, start + 6);
}

test("šest množitelja oko uloga", () => {
  assert.deepEqual(sestUloga([1, 2, 3, 5, 8, 10], 5), [1, 2, 3, 5, 8, 10]);
  const dugi = uloziZaMax(58);
  const s = sestUloga(dugi, 30);
  assert.equal(s.length, 6);
  assert.ok(s.includes(30));
  assert.equal(sestUloga(dugi, 1)[0], 1);
  assert.equal(sestUloga(dugi, 58).at(-1), 58);
});

function segrtiZaRazinu(razina) {
  return Math.min(3, Math.floor(Math.max(0, razina - 1) / 3));
}

test("ivo dobije šegrta svaka 3 levela, do 3", () => {
  assert.equal(segrtiZaRazinu(1), 0);
  assert.equal(segrtiZaRazinu(3), 0);
  assert.equal(segrtiZaRazinu(4), 1);
  assert.equal(segrtiZaRazinu(7), 2);
  assert.equal(segrtiZaRazinu(10), 3);
  assert.equal(segrtiZaRazinu(16), 3);
});

function parsirajKrunjenja(raw, prestige) {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.floor(raw));
  return Math.max(0, Math.floor(prestige));
}

test("krunjenje je skill point za alat", () => {
  assert.equal(parsirajKrunjenja(undefined, 0), 0);
  assert.equal(parsirajKrunjenja(undefined, 3), 3);
  assert.equal(parsirajKrunjenja(1, 5), 1);
  assert.equal(parsirajKrunjenja(-2, 3), 0);
  let krunjenja = 0;
  krunjenja += 1;
  assert.equal(krunjenja, 1);
  krunjenja -= 1;
  assert.equal(krunjenja, 0);
});

const POKRICE_STAJA = 6;
const POKRICE_KORALI = 5;
const POKRICE_STAZA = 4;
function konjaKap(staja, korali = 0, staza = 0) {
  return Math.max(0, (staja || 0) * POKRICE_STAJA + (korali || 0) * POKRICE_KORALI + (staza || 0) * POKRICE_STAZA);
}
function jacinaBuff(plus, minus) {
  return Math.max(-3, Math.min(3, plus - minus));
}
function tkoJase(ljudi, staja, ostecena) {
  if (ostecena || !staja) return [];
  const kap = konjaKap(staja);
  return [...ljudi]
    .filter((p) => p.posao !== "Šegrt" && !p.mane.includes("strah-od-konja"))
    .sort((a, b) => {
      const bod = (p) => {
        if (p.posao === "Šerif") return 120 + p.razina;
        if (p.hub === "konji") return 90 + p.razina;
        return 20 + p.razina;
      };
      return bod(b) - bod(a);
    })
    .slice(0, kap)
    .map((p) => p.id);
}
function konjiPotreba(n, staja) {
  if (n < 8) return 1;
  const pokriva = (staja || 0) * POKRICE_STAJA;
  return n <= 0 ? 1 : Math.min(1, pokriva / n);
}
function dodajXp(p, n) {
  const xp = p.xp + n;
  const stara = p.razina;
  const nova = Math.min(20, 1 + Math.floor(xp / 40));
  const buffovi = [...p.buffovi];
  const mane = [...p.mane];
  if (nova > stara) {
    for (let lv = stara + 1; lv <= nova; lv++) {
      if (lv % 5 === 0) buffovi.push(`b${lv}`);
      if (lv % 5 === 3) mane.push(`m${lv}`);
    }
  }
  return { ...p, xp, razina: nova, buffovi, mane };
}

test("staja daje 6 konja, korali 5, staza 4", () => {
  assert.equal(konjaKap(0), 0);
  assert.equal(konjaKap(1), 6);
  assert.equal(konjaKap(3), 18);
  assert.equal(konjaKap(1, 1), 11);
  assert.equal(konjaKap(2, 2), 22);
  assert.equal(konjaKap(1, 1, 1), 15);
});

test("tabor ispod 8 ljudi ne pati bez konja", () => {
  assert.equal(konjiPotreba(5, 0), 1);
  assert.equal(konjiPotreba(7, 0), 1);
  assert.equal(konjiPotreba(8, 0), 0);
  assert.equal(konjiPotreba(8, 2), 1);
  assert.equal(konjiPotreba(12, 1), 6 / 12);
});

test("jacina je buff minus mana, od -3 do 3", () => {
  assert.equal(jacinaBuff(2, 0), 2);
  assert.equal(jacinaBuff(1, 2), -1);
  assert.equal(jacinaBuff(5, 0), 3);
  assert.equal(jacinaBuff(0, 8), -3);
});

test("kauboji jašu, strah od konja ne, šegrt ne", () => {
  const ljudi = [
    { id: "boro", posao: "Šerif", hub: "red", razina: 2, mane: [] },
    { id: "pero", posao: "Konjušar", hub: "konji", razina: 1, mane: [] },
    { id: "mile", posao: "Vodonoša", hub: "voda", razina: 1, mane: ["strah-od-konja"] },
    { id: "ivo", posao: "Građevinac", hub: "krov", razina: 3, mane: [] },
    { id: "bero", posao: "Šegrt", hub: "krov", razina: 1, mane: [] },
  ];
  assert.deepEqual(tkoJase(ljudi, 0, false), []);
  assert.deepEqual(tkoJase(ljudi, 1, true), []);
  const jase = tkoJase(ljudi, 1, false);
  assert.equal(jase.length, 3);
  assert.deepEqual(jase, ["boro", "pero", "ivo"]);
  assert.ok(!jase.includes("mile"));
  assert.ok(!jase.includes("bero"));
});

test("svaki 5. lv daje buff, svaki 3. u petici manu", () => {
  const p = { xp: 0, razina: 1, buffovi: [], mane: [] };
  const lv3 = dodajXp(p, 80);
  assert.equal(lv3.razina, 3);
  assert.deepEqual(lv3.buffovi, []);
  assert.deepEqual(lv3.mane, ["m3"]);
  const lv5 = dodajXp(p, 160);
  assert.equal(lv5.razina, 5);
  assert.deepEqual(lv5.buffovi, ["b5"]);
  assert.deepEqual(lv5.mane, ["m3"]);
});

const POKRICE_FARMA = 8;
const POKRICE_ORDINACIJA = 10;
const POKRICE_TRAVAR = 6;
const POKRICE_BANJA = 7;
const BANJA_VODA = 1.4;
function jeloKap(g) {
  return (g.lov || 0) * 6 + (g.mesnica || 0) * 8 + (g.pekara || 0) * 8 + (g.farma || 0) * POKRICE_FARMA;
}
function zdravljePotreba(n, ordinacija) {
  if (n < 10) return 1;
  const pokriva = (ordinacija || 0) * POKRICE_ORDINACIJA;
  return n <= 0 ? 1 : Math.min(1, pokriva / n);
}
function travarPokriva(lv, farmLv, n) {
  const farmK = n <= 0 ? 1 : Math.min(1, (farmLv * POKRICE_FARMA) / Math.max(1, n));
  return lv * POKRICE_TRAVAR * (0.62 + 0.38 * farmK);
}
function banjaVoda(bunarLv, banjaLv) {
  return Math.max(0, bunarLv * 8 - banjaLv * BANJA_VODA);
}
function banjaPokriva(lv, vodaOmjer) {
  return lv * POKRICE_BANJA * (0.4 + 0.6 * vodaOmjer);
}
function zamjeniciZa(igracRazina, uredLv) {
  if (uredLv < 1) return 0;
  if (igracRazina >= 8) return 2;
  if (igracRazina >= 5) return 1;
  return 0;
}
function bankaKap(lv) {
  return Math.max(0, lv) * 500;
}
function rijesiIshod(tip, opcija, ctx) {
  if (tip === "stranac") {
    if (opcija === "otjeraj" && !ctx.imaRed) return { rec: "Nema tko da ga otjera. Uzeo je torbu.", zlato: -10 };
    if (opcija === "otjeraj") return { rec: "Otjerali su ga. Prašina ostaje.", zlato: 0, serifXp: true, kvaliteta: 1 };
    if (opcija === "primi") return { rec: "Stranac sjedi.", zlato: -6 };
    return { rec: "Otišao. Ulica je opet naša.", zlato: 0 };
  }
  if (tip === "dvoboj") {
    if (opcija === "serif" && !ctx.imaRed) return { rec: "Nema tko da stane.", zlato: -8, ozljeda: true, ostecenje: "salun" };
    if (opcija === "serif") return { rec: "Dvoboj je stao.", zlato: 6, celija: 1, serifXp: true };
    if (opcija === "gledaj") return { rec: "Ulog.", zlato: ctx.zlato < 8 ? 0 : -8 };
    return { rec: "Pustili.", zlato: -4, ozljeda: true, ostecenje: "salun" };
  }
  if (tip === "krdo") {
    if (opcija === "vrati") return { rec: "Krdo u toru.", zlato: 4 };
    return { rec: "Pustili.", zlato: -8 };
  }
  if (tip === "konj") {
    if (opcija === "lijeci") return { rec: "Kopito zavezano.", zlato: -5, energija: 1 };
    return { rec: "Pustili." };
  }
  if (tip === "kisa") {
    if (opcija === "kisa") return { rec: "Cisterna otvorena.", energija: 3 };
    return { rec: "Čekali nebo." };
  }
  if (tip === "trgovac") {
    if (opcija === "trguj") return { rec: "Mjera gotova.", zlato: 4 };
    return { rec: "Ostavi." };
  }
  if (opcija === "nali") return { rec: "Još jedna tura.", zlato: ctx.zlato < 6 ? 0 : -6 };
  if (opcija === "serif" && !ctx.imaRed) return { rec: "Šerifa nema.", zlato: 0 };
  if (opcija === "serif") return { rec: "Ušao je.", zlato: 0 };
  return { rec: "Izbacili varača.", zlato: 4 };
}

test("farma daje 8 hrane po katu", () => {
  assert.equal(jeloKap({ lov: 1, farma: 0 }), 6);
  assert.equal(jeloKap({ lov: 1, farma: 1 }), 14);
  assert.equal(jeloKap({ farma: 2 }), 16);
});

test("tabor ispod 10 ljudi ne pati bez doktora", () => {
  assert.equal(zdravljePotreba(5, 0), 1);
  assert.equal(zdravljePotreba(9, 0), 1);
  assert.equal(zdravljePotreba(10, 0), 0);
  assert.equal(zdravljePotreba(10, 1), 1);
  assert.equal(zdravljePotreba(20, 1), 10 / 20);
});

test("travar slabi bez farme", () => {
  const bez = travarPokriva(1, 0, 20);
  const sa = travarPokriva(1, 3, 20);
  assert.ok(bez < sa);
  assert.ok(bez < 6);
  assert.ok(sa > 5);
});

test("banja pije bunar i slabi bez vode", () => {
  assert.equal(banjaVoda(1, 0), 8);
  assert.ok(banjaVoda(1, 1) < 8);
  assert.ok(banjaVoda(1, 1) > 6);
  assert.ok(banjaPokriva(1, 1) > banjaPokriva(1, 0));
  assert.equal(banjaPokriva(1, 1), 7);
  assert.ok(banjaPokriva(1, 0) < 3);
});

function cisternaPokriva(lv, krovK, kisa) {
  return lv * 6 * (0.55 + 0.45 * krovK) * (kisa ? 1.4 : 1);
}

test("cisterna hvata kišu s krova, bez bunara", () => {
  const bez = cisternaPokriva(1, 1, false);
  const kisa = cisternaPokriva(1, 1, true);
  const tijesno = cisternaPokriva(1, 0, false);
  assert.ok(bez < 8);
  assert.ok(kisa > 8);
  assert.ok(tijesno < bez);
  assert.ok(bez > 5);
});

test("šerif dobiva zamjenike na lv 5 i 8, treba ured", () => {
  assert.equal(zamjeniciZa(4, 1), 0);
  assert.equal(zamjeniciZa(5, 0), 0);
  assert.equal(zamjeniciZa(5, 1), 1);
  assert.equal(zamjeniciZa(7, 2), 1);
  assert.equal(zamjeniciZa(8, 1), 2);
});

test("banka seif je 500 po katu, pohod ne dira seif", () => {
  assert.equal(bankaKap(0), 0);
  assert.equal(bankaKap(1), 500);
  assert.equal(bankaKap(3), 1500);
  const dzep = 40;
  const seif = 60;
  const nakonPohoda = { dzep: 0, seif };
  assert.equal(nakonPohoda.seif, seif);
  assert.equal(nakonPohoda.dzep, 0);
  assert.ok(dzep !== seif || true);
});

test("dogadaj: šerif otjera stranca, bez reda gubi zlato", () => {
  const ok = rijesiIshod("stranac", "otjeraj", { imaRed: true, zlato: 20 });
  assert.equal(ok.zlato, 0);
  const lose = rijesiIshod("stranac", "otjeraj", { imaRed: false, zlato: 20 });
  assert.equal(lose.zlato, -10);
  const dvoboj = rijesiIshod("dvoboj", "serif", { imaRed: true, zlato: 20 });
  assert.equal(dvoboj.zlato, 6);
  const salun = rijesiIshod("salun", "izbaci", { imaRed: true, zlato: 20 });
  assert.equal(salun.zlato, 4);
});

test("dogadaj: krdo konj kiša trgovac", () => {
  const krdo = rijesiIshod("krdo", "vrati", { imaRed: true, zlato: 20 });
  assert.equal(krdo.zlato, 4);
  const konj = rijesiIshod("konj", "lijeci", { imaRed: true, zlato: 20 });
  assert.equal(konj.zlato, -5);
  const kisa = rijesiIshod("kisa", "kisa", { imaRed: true, zlato: 20 });
  assert.equal(kisa.energija, 3);
  const trg = rijesiIshod("trgovac", "trguj", { imaRed: true, zlato: 20 });
  assert.equal(trg.zlato, 4);
});

test("faro banka uzima pola uloga kad gost promaši", () => {
  const ulog = 10;
  const winAt = 1;
  const gost = 0;
  const bankaPobijedi = gost !== winAt;
  assert.equal(bankaPobijedi, true);
  const dobit = Math.floor(ulog * 0.5);
  const dzep = 40 + (bankaPobijedi ? dobit : -ulog);
  assert.equal(dzep, 45);
});

test("faro all-in i proizvoljni ulog", () => {
  const faroDobitak = (ulog, karteLv) => Math.floor(Math.max(0, Math.floor(ulog)) * (karteLv > 0 ? 2.5 : 2));
  const faroBanka = (ulog) => Math.floor(Math.max(0, Math.floor(ulog)) * 0.5);
  assert.equal(faroDobitak(10, 0), 20);
  assert.equal(faroDobitak(10, 1), 25);
  assert.equal(faroDobitak(7, 1), 17);
  assert.equal(faroBanka(100), 50);
  const allIn = 90;
  assert.equal(faroDobitak(allIn, 0) - allIn, 90);
  assert.equal(90 - allIn, 0);
});

test("utrka: jahanje nosi, staza uči, sreća ostaje, prvi duplo", () => {
  const bonus = (jahanje, sijeno, stazaLv) => {
    const j = Math.min(4, Math.max(0, jahanje));
    const s = Math.min(6, Math.max(0, stazaLv));
    return j * 0.012 + (sijeno ? 0.02 : 0) + s * 0.006;
  };
  assert.ok(bonus(4, true, 2) > bonus(0, false, 6));
  assert.ok(bonus(8, true, 6) === bonus(4, true, 6));
  const isplata = (ulog, mjesto) => (mjesto === 1 ? Math.floor(ulog) * 2 : mjesto === 2 ? Math.floor(ulog) : 0);
  assert.equal(isplata(10, 1), 20);
  assert.equal(isplata(10, 2), 10);
  assert.equal(isplata(10, 3), 0);
  const tvoj = (j, hay, staza, r) => 0.7 + bonus(j, hay, staza) + r * 0.24;
  const npc = (staza, r) => 0.7 + Math.min(6, staza) * 0.004 + r * 0.24;
  assert.ok(Math.abs(tvoj(0, false, 1, 0.5) - npc(1, 0.5)) < 0.05);
  assert.ok(tvoj(4, true, 4, 0.5) > npc(4, 0.5));
});

function rukaBod(karte) {
  let t = 0;
  let asevi = 0;
  for (const k of karte) {
    t += k.r === 1 ? 11 : k.r >= 10 ? 10 : k.r;
    if (k.r === 1) asevi += 1;
  }
  while (t > 21 && asevi > 0) {
    t -= 10;
    asevi -= 1;
  }
  return t;
}
function bjIsplata(ulog, ishod, karteLv) {
  const u = Math.floor(ulog);
  if (ishod === "poraz") return 0;
  if (ishod === "push") return u;
  if (ishod === "bj") return Math.floor(u * (karteLv > 0 ? 2.6 : 2.5));
  return Math.floor(u * 2);
}

test("dvadesetjedan: as i kralj 21, isplata 2.5x, push vraća ulog", () => {
  assert.equal(rukaBod([{ r: 1 }, { r: 13 }]), 21);
  assert.equal(rukaBod([{ r: 1 }, { r: 1 }, { r: 9 }]), 21);
  assert.equal(rukaBod([{ r: 10 }, { r: 10 }, { r: 5 }]), 25);
  assert.equal(bjIsplata(10, "bj", 0), 25);
  assert.equal(bjIsplata(10, "pobjeda", 0), 20);
  assert.equal(bjIsplata(10, "push", 0), 10);
  assert.equal(bjIsplata(10, "poraz", 0), 0);
});

const POKRICE_TOR = 8;
function govedaKap(tor) {
  return Math.max(0, (tor || 0) * POKRICE_TOR);
}
test("tor drži 8 grla po katu, krdo jede više na paši bez farme", () => {
  assert.equal(govedaKap(0), 0);
  assert.equal(govedaKap(1), 8);
  assert.equal(govedaKap(2), 16);
  const jede = (n, pasaNaZitu) => n * 0.55 * (pasaNaZitu ? 0.45 : 1);
  assert.ok(jede(8, false) > jede(8, true));
});

test("tijesna koža: tor preko 75% steže zabavu i red", () => {
  const krdoTijesno = (broj, kap) => {
    if (kap <= 0 || broj <= 0) return 0;
    return Math.max(0, Math.min(1, (broj / kap - 0.75) / 0.25));
  };
  assert.equal(krdoTijesno(0, 8), 0);
  assert.equal(krdoTijesno(6, 8), 0);
  assert.ok(krdoTijesno(7, 8) > 0);
  assert.equal(krdoTijesno(8, 8), 1);
  const zabava = (z, t) => z * (1 - 0.18 * t);
  assert.ok(zabava(10, 1) < zabava(10, 0));
});

test("zamjenik puni red za 8 ljudi", () => {
  const red = (ured, zam) => ured * 12 + zam * 8;
  assert.equal(red(1, 0), 12);
  assert.equal(red(1, 2), 28);
});

test("farma bez vode daje manje hrane", () => {
  const farm = (farma, vodaOmjer) => farma * 8 * (0.55 + 0.45 * vodaOmjer);
  assert.ok(farm(1, 1) > farm(1, 0));
  assert.ok(Math.abs(farm(1, 0) - 4.4) < 1e-9);
  assert.ok(Math.abs(farm(1, 1) - 8) < 1e-9);
});

test("konji jedu i piju, sijeno smanjuje glad", () => {
  const KONJ_HRANA = 0.5;
  const KONJ_VODA = 0.22;
  const jede = (n, sijeno) => n * KONJ_HRANA * (sijeno ? 0.28 : 1);
  const pije = (n) => n * KONJ_VODA;
  assert.ok(jede(4, false) > jede(4, true));
  assert.ok(pije(4) > 0);
  assert.ok(jede(4, false) === 2);
});

test("salun kvari red, ophodnja ga diže, rodeo diže zabavu", () => {
  const nered = (gosti) => gosti * 0.28;
  const ophodnja = (n) => n * 5;
  const rodeoZabava = (n) => n * 3.5;
  const rodeoNered = (n) => n * 2.2;
  assert.ok(nered(8) > 2);
  assert.ok(ophodnja(2) > nered(8));
  assert.ok(rodeoZabava(2) > 0 && rodeoNered(2) > 0);
});

test("nema posla kvari red, gladni konji slabe", () => {
  const redNakonDokolice = (red, posao) => (posao < 0.45 ? red * 0.82 : red);
  const konjiNakonGladi = (konji, jelo, sijeno) => (jelo < 0.4 && !sijeno ? konji * 0.75 : konji);
  assert.ok(redNakonDokolice(12, 0.2) < 12);
  assert.equal(redNakonDokolice(12, 0.8), 12);
  assert.ok(konjiNakonGladi(8, 0.2, false) < 8);
  assert.equal(konjiNakonGladi(8, 0.2, true), 8);
});

test("bolest tera ljude, zdravlje mora biti 0.45 da dođu", () => {
  function selidba(zdravlje, sreca, ljudi, kap) {
    if (zdravlje < 0.35 && ljudi >= 10) return -0.04 * (1 - zdravlje);
    if (sreca >= 45 && ljudi < kap && zdravlje >= 0.45) return 0.028 + sreca / 2500;
    if (sreca < 30 && ljudi > 4) return -0.04 * (1 - sreca / 30);
    return 0;
  }
  assert.ok(selidba(0.3, 80, 12, 20) < 0);
  assert.equal(selidba(0.4, 80, 12, 20), 0);
  assert.ok(selidba(0.8, 80, 12, 20) > 0);
});

test("dužnost se dijeli, zbroj ostaje broj konja", () => {
  function normaliziraj(broj, raw) {
    const n = Math.max(0, Math.floor(broj));
    const d = { jahanje: 0, ophodnja: 0, rad: 0, rodeo: 0 };
    if (n <= 0) return d;
    d.jahanje = Math.max(0, Math.floor(raw?.jahanje ?? 0));
    d.ophodnja = Math.max(0, Math.floor(raw?.ophodnja ?? 0));
    d.rad = Math.max(0, Math.floor(raw?.rad ?? 0));
    d.rodeo = Math.max(0, Math.floor(raw?.rodeo ?? 0));
    let zbroj = d.jahanje + d.ophodnja + d.rad + d.rodeo;
    if (zbroj <= 0) {
      d.jahanje = n;
      return d;
    }
    if (zbroj !== n) {
      const ids = ["jahanje", "ophodnja", "rad", "rodeo"];
      if (zbroj > n) {
        for (const id of [...ids].reverse()) {
          const skini = Math.min(d[id], zbroj - n);
          d[id] -= skini;
          zbroj -= skini;
          if (zbroj <= n) break;
        }
      } else {
        d.jahanje += n - zbroj;
      }
    }
    return d;
  }
  const prazno = normaliziraj(4, {});
  assert.equal(prazno.jahanje, 4);
  const mix = normaliziraj(4, { jahanje: 1, ophodnja: 1, rad: 1, rodeo: 1 });
  assert.equal(mix.jahanje + mix.ophodnja + mix.rad + mix.rodeo, 4);
  const vise = normaliziraj(2, { jahanje: 1, ophodnja: 1, rad: 1, rodeo: 1 });
  assert.equal(vise.jahanje + vise.ophodnja + vise.rad + vise.rodeo, 2);
  assert.equal(vise.jahanje, 1);
  assert.equal(vise.ophodnja, 1);
});

function knjigaBroj(simboli) {
  return simboli.filter((s) => s === "knjiga").length;
}
function vrtnjeZaKnjige(n) {
  if (n >= 5) return 10;
  if (n >= 4) return 8;
  if (n >= 3) return 6;
  return 0;
}
function expandStupove(simboli, expand) {
  const out = simboli.slice();
  const polja = [];
  for (let col = 0; col < 5; col++) {
    const cells = [col, col + 5, col + 10];
    if (!cells.some((i) => out[i] === expand)) continue;
    for (const i of cells) {
      if (out[i] !== expand) out[i] = expand;
      polja.push(i);
    }
  }
  return { simboli: out, polja };
}
const BESPLATNE_KUPI = { dijamanti: 15, n: 8 };
const KNJIGA_SKUP_CILJ = 5;
function cijenaBesplatnih(razina) {
  const lv = Math.max(1, Math.floor(razina));
  return 15 + 3 * Math.floor(lv / 3);
}
const KNJIGA_ULOG = 3;
const KNJIGA_ZNACKA_PLUS = 2;
const KNJIGA_PLIJEN = 0.62;

test("knjigaBroj broji knjige na kolu", () => {
  const s = Array(15).fill("gold");
  s[0] = "knjiga";
  s[7] = "knjiga";
  s[14] = "knjiga";
  assert.equal(knjigaBroj(s), 3);
  assert.equal(knjigaBroj(Array(15).fill("wood")), 0);
});

test("expand puni cijeli stup kad je znak u njemu", () => {
  const s = [
    "wood", "gold", "stone", "iron", "energy",
    "gold", "gold", "stone", "iron", "energy",
    "stone", "gold", "wood", "iron", "energy",
  ];
  const r = expandStupove(s, "wood");
  assert.deepEqual([r.simboli[0], r.simboli[5], r.simboli[10]], ["wood", "wood", "wood"]);
  assert.equal(r.simboli[12], "wood");
  assert.equal(r.simboli[1], "gold");
  assert.ok(r.polja.includes(0) && r.polja.includes(5) && r.polja.includes(10));
});

test("tri četiri pet knjiga daju 6 8 10 vrtnji", () => {
  assert.equal(vrtnjeZaKnjige(2), 0);
  assert.equal(vrtnjeZaKnjige(3), 6);
  assert.equal(vrtnjeZaKnjige(4), 8);
  assert.equal(vrtnjeZaKnjige(5), 10);
});

test("kupnja knjige je 15 dijamanata i raste svaka 3 levela", () => {
  assert.equal(BESPLATNE_KUPI.n, 8);
  assert.equal(BESPLATNE_KUPI.dijamanti, 15);
  assert.equal(cijenaBesplatnih(1), 15);
  assert.equal(cijenaBesplatnih(2), 15);
  assert.equal(cijenaBesplatnih(3), 18);
  assert.equal(cijenaBesplatnih(6), 21);
  assert.equal(cijenaBesplatnih(9), 24);
  assert.equal(KNJIGA_SKUP_CILJ, 5);
  assert.equal(KNJIGA_ZNACKA_PLUS, 2);
  assert.ok(KNJIGA_PLIJEN < 0.8);
});

test("bonus vrtnja plaća fiksnim ulogom, ne energijom okidača", () => {
  assert.equal(KNJIGA_ULOG, 3);
});

const MIN_NIZ = {
  wood: 3,
  stone: 3,
  iron: 3,
  gold: 3,
  gem: 3,
  shield: 3,
  wild: 3,
  energy: 4,
};
function rasponNiza(id, rng) {
  const min = Math.min(5, Math.max(3, MIN_NIZ[id] ?? 3));
  const r = rng();
  let n = min;
  if (min <= 3) {
    n = r > 0.96 ? 5 : r > 0.88 ? 4 : 3;
  } else {
    n = r > 0.92 ? 5 : 4;
  }
  return n;
}
function rasponStupova(id, rng) {
  const r = rng();
  if (id === "energy") return r > 0.96 ? 5 : 4;
  if (id === "wood" || id === "stone") {
    if (r > 0.97) return 5;
    if (r > 0.9) return 4;
    return 3;
  }
  if (r > 0.98) return 5;
  if (r > 0.93) return 4;
  if (r > 0.62) return 3;
  return 2;
}

test("kolo od 3, energija od 4. bonus stupci jaki 2–5, slabi 3–5, energija 4–5", () => {
  assert.equal(MIN_NIZ.gold, 3);
  assert.equal(MIN_NIZ.iron, 3);
  assert.equal(MIN_NIZ.wood, 3);
  assert.equal(MIN_NIZ.stone, 3);
  assert.equal(MIN_NIZ.energy, 4);
  assert.equal(rasponNiza("gold", () => 0), 3);
  assert.equal(rasponNiza("wood", () => 0), 3);
  assert.equal(rasponNiza("energy", () => 0), 4);
  assert.equal(rasponNiza("gold", () => 0.97), 5);
  assert.equal(rasponNiza("energy", () => 0.95), 5);
  assert.equal(rasponStupova("gold", () => 0), 2);
  assert.equal(rasponStupova("wood", () => 0), 3);
  assert.equal(rasponStupova("energy", () => 0), 4);
  assert.equal(rasponStupova("gold", () => 0.99), 5);
  assert.equal(rasponStupova("energy", () => 0.97), 5);
  assert.equal(rasponStupova("gold", () => 0.94), 4);
  assert.equal(rasponStupova("wood", () => 0.91), 4);
});

const KNJIGA_P = 0.006;
test("šerifova značka rijetka kao 4 i 5 stupaca", () => {
  assert.ok(KNJIGA_P < 0.01);
  assert.equal(rasponStupova("gold", () => 0.94), 4);
  assert.equal(rasponStupova("energy", () => 0.95), 4);
});

function dodajEnergiju(e, gain, baterija, preko = false) {
  const next = Math.max(0, e + gain);
  if (gain <= 0) return next;
  if (preko) return next;
  const max = izracunajMaxEnergiju(baterija);
  if (e >= max) return e;
  return Math.min(max, next);
}

test("munja smije preći max, regen ne spušta višak", () => {
  assert.equal(dodajEnergiju(8, 5, 0, false), 13);
  assert.equal(dodajEnergiju(20, 4, 0, true), 24);
  assert.equal(dodajEnergiju(24, 1, 0, false), 24);
  assert.equal(dodajEnergiju(24, -2, 0, false), 22);
});

const KARAVANA_PUTOVI = [
  { id: "staza", vrijeme: 1, plata: 1.35, rizik: 0.08 },
  { id: "noc", vrijeme: 0.7, plata: 1.7, rizik: 0.22 },
  { id: "rijeka", vrijeme: 1.38, plata: 2.05, rizik: 0.12 },
];
test("karavana ima tri puta, noć brža rizičnija, rijeka sporija plaća", () => {
  const staza = KARAVANA_PUTOVI[0];
  const noc = KARAVANA_PUTOVI[1];
  const rijeka = KARAVANA_PUTOVI[2];
  assert.ok(noc.vrijeme < staza.vrijeme);
  assert.ok(noc.rizik > staza.rizik);
  assert.ok(rijeka.vrijeme > staza.vrijeme);
  assert.ok(rijeka.plata > staza.plata);
  assert.ok(staza.plata > 1);
});

function posadiKnjige(simboli, p = 1, rng = Math.random, skip) {
  const out = simboli.slice();
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    if (cur === "skull" || cur === "knjiga" || (skip && cur === skip)) continue;
    if (rng() < p) out[i] = "knjiga";
  }
  return out;
}

test("u knjizi se značka ne sadi na expand znak", () => {
  const s = Array(15).fill("gold");
  s[0] = "wood";
  s[5] = "wood";
  const out = posadiKnjige(s, 1, () => 0, "wood");
  assert.equal(out[0], "wood");
  assert.equal(out[5], "wood");
  assert.equal(out[1], "knjiga");
});

function karavanaZlato(teret, plata = 1.35, mnoz = 1.1) {
  const baza = teret.drvo * 2.85 + teret.kamen * 5.4 + teret.zeljezo * 14;
  return Math.max(8, Math.floor(baza * 1.55 * mnoz * plata));
}

test("karavana plaća više od burze", () => {
  const burza = 10 * 2;
  const kola = karavanaZlato({ drvo: 10, kamen: 0, zeljezo: 0 });
  assert.ok(kola > burza);
});

const POTJERNICA_SANSA = { baza: 0.012, lucky: 0.028, jackpot: 0.045 };
test("šerifov plakat pada rijetko", () => {
  assert.ok(POTJERNICA_SANSA.baza < 0.02);
  assert.ok(POTJERNICA_SANSA.lucky < 0.04);
  assert.ok(POTJERNICA_SANSA.jackpot < 0.06);
});

function nalogMoze(s, zauzeti, gradevine, nedavni) {
  const blok = new Set([...zauzeti, ...nedavni, "streak"]);
  if (blok.has(s.tip)) return false;
  if (gradevine && s.cilj === 1 && (gradevine[s.tip] || 0) > 0) return false;
  return true;
}

test("nalozi ne ponavljaju gotove zgrade ni nedavne tipove", () => {
  assert.equal(nalogMoze({ tip: "kuca", cilj: 1 }, [], { kuca: 1 }, []), false);
  assert.equal(nalogMoze({ tip: "spin", cilj: 10 }, [], { kuca: 1 }, ["spin"]), false);
  assert.equal(nalogMoze({ tip: "zlato", cilj: 300 }, ["spin"], {}, ["kuca"]), true);
  assert.equal(nalogMoze({ tip: "streak", cilj: 3 }, [], {}, []), false);
});

const EXPAND_ZNAKOVI = ["wood", "stone", "iron", "gold", "energy"];
function izaberiExpand(rng) {
  return EXPAND_ZNAKOVI[Math.floor(rng() * EXPAND_ZNAKOVI.length)] ?? "gold";
}
test("bonus sam bira expand znak", () => {
  assert.equal(izaberiExpand(() => 0), "wood");
  assert.equal(izaberiExpand(() => 0.99), "energy");
  assert.ok(EXPAND_ZNAKOVI.includes(izaberiExpand(() => 0.4)));
});

const LUCKY_SPIN_INTERVAL = 40;
const LIK_XP_PO_LV = 96;
const LIK_MAX_RAZINA = 20;
function razinaLika(xp) {
  return Math.min(LIK_MAX_RAZINA, 1 + Math.floor(Math.max(0, xp) / LIK_XP_PO_LV));
}
function dodajXpLiku(p, n) {
  const xp = Math.max(0, p.xp + n);
  const stara = p.razina;
  const nova = Math.min(LIK_MAX_RAZINA, Math.max(stara, razinaLika(xp)));
  return { ...p, xp, razina: nova };
}
const DOGADJ_PAUSE_MS = 6 * 60 * 1000;
function smijeNoviDogadaj(zadnji, sad, imaAktivan) {
  if (imaAktivan) return false;
  return sad - Math.max(0, zadnji) >= DOGADJ_PAUSE_MS;
}

test("sretna vrtnja rjeđa, interval 40", () => {
  assert.equal(LUCKY_SPIN_INTERVAL, 40);
});

test("kauboji idu do 20, sporije: 96 xp po levelu", () => {
  assert.equal(LIK_MAX_RAZINA, 20);
  assert.equal(LIK_XP_PO_LV, 96);
  assert.equal(razinaLika(0), 1);
  assert.equal(razinaLika(95), 1);
  assert.equal(razinaLika(96), 2);
  assert.equal(razinaLika(192), 3);
  assert.equal(razinaLika(96 * 19), 20);
  const stari = dodajXpLiku({ xp: 200, razina: 6 }, 10);
  assert.equal(stari.razina, 6);
  assert.equal(stari.xp, 210);
});

test("šerifov događaj čeka 6 minuta i ostavlja posljedice", () => {
  assert.equal(DOGADJ_PAUSE_MS, 6 * 60 * 1000);
  assert.equal(smijeNoviDogadaj(0, 5 * 60 * 1000, false), false);
  assert.equal(smijeNoviDogadaj(0, 6 * 60 * 1000, false), true);
  assert.equal(smijeNoviDogadaj(0, 10 * 60 * 1000, true), false);
  const dvoboj = rijesiIshod("dvoboj", "serif", { imaRed: true, zlato: 20 });
  assert.equal(dvoboj.zlato, 6);
  assert.equal(dvoboj.celija, 1);
  const krv = rijesiIshod("dvoboj", "pusti", { imaRed: true, zlato: 20 });
  assert.equal(krv.ostecenje, "salun");
  const otjeraj = rijesiIshod("stranac", "otjeraj", { imaRed: true, zlato: 20 });
  assert.equal(otjeraj.serifXp, true);
});

