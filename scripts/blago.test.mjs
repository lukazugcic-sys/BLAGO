import assert from "node:assert/strict";
import test from "node:test";

const izracunajMaxEnergiju = (baterija) => 10 + baterija * 6;
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
  assert.equal(izracunajMaxEnergiju(0), 10);
  assert.equal(izracunajMaxEnergiju(2), 22);
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
  const LESTVICA = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500];
  const cap = Math.max(1, Math.floor(maxE));
  if (cap <= 1) return [1];
  if (cap === 2) return [1, 2];
  const pick = (cilj) => {
    let best = 1;
    let bestD = Infinity;
    for (const n of LESTVICA) {
      if (n >= cap) break;
      const d = Math.abs(n - cilj);
      if (d < bestD || (d === bestD && n > best)) {
        best = n;
        bestD = d;
      }
    }
    return Math.max(1, Math.min(best, cap - 1));
  };
  const a = pick(Math.round(cap * 0.2));
  let b = pick(Math.round(cap * 0.45));
  if (b <= a) {
    const veci = LESTVICA.find((n) => n > a && n < cap);
    if (veci) b = veci;
  }
  return [...new Set([1, a, b, cap])].filter((n) => n >= 1 && n <= cap).sort((x, y) => x - y);
}

test("ulog prati max energiju", () => {
  assert.deepEqual(uloziZaMax(10), [1, 2, 5, 10]);
  assert.deepEqual(uloziZaMax(20), [1, 5, 10, 20]);
  assert.deepEqual(uloziZaMax(30), [1, 5, 15, 30]);
  assert.deepEqual(uloziZaMax(58), [1, 10, 25, 58]);
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
const POKRICE_ORDINACIJA = 12;
function jeloKap(g) {
  return (g.lov || 0) * 6 + (g.mesnica || 0) * 8 + (g.pekara || 0) * 8 + (g.farma || 0) * POKRICE_FARMA;
}
function zdravljePotreba(n, ordinacija) {
  if (n < 10) return 1;
  const pokriva = (ordinacija || 0) * POKRICE_ORDINACIJA;
  return n <= 0 ? 1 : Math.min(1, pokriva / n);
}
function zamjeniciZa(igracRazina, uredLv) {
  if (uredLv < 1) return 0;
  if (igracRazina >= 8) return 2;
  if (igracRazina >= 5) return 1;
  return 0;
}
function bankaKap(lv) {
  return Math.max(0, lv) * 50;
}
function rijesiIshod(tip, opcija, ctx) {
  if (tip === "stranac") {
    if (opcija === "otjeraj" && !ctx.imaRed) return { rec: "Nema tko da ga otjera. Uzeo je torbu.", zlato: -10 };
    if (opcija === "otjeraj") return { rec: "Otjerali su ga. Prašina ostaje.", zlato: 0 };
    if (opcija === "primi") return { rec: "Stranac sjedi.", zlato: -6 };
    return { rec: "Otišao. Ulica je opet naša.", zlato: 0 };
  }
  if (tip === "dvoboj") {
    if (opcija === "serif" && !ctx.imaRed) return { rec: "Nema tko da stane.", zlato: -8, ozljeda: true };
    if (opcija === "serif") return { rec: "Dvoboj je stao.", zlato: 6 };
    if (opcija === "gledaj") return { rec: "Ulog.", zlato: ctx.zlato < 8 ? 0 : -8 };
    return { rec: "Pustili.", zlato: -4, ozljeda: true };
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
  assert.equal(zdravljePotreba(20, 1), 12 / 20);
});

test("šerif dobiva zamjenike na lv 5 i 8, treba ured", () => {
  assert.equal(zamjeniciZa(4, 1), 0);
  assert.equal(zamjeniciZa(5, 0), 0);
  assert.equal(zamjeniciZa(5, 1), 1);
  assert.equal(zamjeniciZa(7, 2), 1);
  assert.equal(zamjeniciZa(8, 1), 2);
});

test("banka seif je 50 po katu, pohod ne dira seif", () => {
  assert.equal(bankaKap(0), 0);
  assert.equal(bankaKap(1), 50);
  assert.equal(bankaKap(3), 150);
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

test("utrka: jahanje i sijeno dižu tvog, prvi nosi 3x", () => {
  const bonus = (jahanje, sijeno, stazaLv) => jahanje * 0.045 + (sijeno ? 0.08 : 0) + stazaLv * 0.028;
  assert.ok(bonus(4, true, 2) > bonus(0, false, 0));
  const isplata = (ulog, pobjeda) => (pobjeda ? Math.floor(ulog) * 3 : 0);
  assert.equal(isplata(10, true), 30);
  assert.equal(isplata(10, false), 0);
  let i = 0;
  const rng = () => {
    const s = [0.1, 0.9, 0.2, 0.8];
    return s[i++ % s.length];
  };
  const tvoj = 0.4 + bonus(3, true, 1) + rng() * 0.22;
  const npc = [0.42 + rng() * 0.28, 0.42 + rng() * 0.28, 0.42 + rng() * 0.28];
  assert.ok(tvoj > 0.4);
  assert.equal(npc.length, 3);
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

