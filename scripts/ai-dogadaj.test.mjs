import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

test("kontekst: pragovi, xp, energija, štit, sreća, bez sirovih resursa", async () => {
  const ai = await jiti.import("../src/lib/game/aiDogadaj.ts");
  assert.equal(ai.izracunajPotrebniXp ? ai.izracunajPotrebniXp(1) : ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null }).xp.prag, 120);

  const l1 = ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, baterija: 0, oklop: 0, sreca: 0 });
  const l2 = ai.sloziKontekst({ vodicIde: false, razina: 2, xp: 0, odsutnostMs: null });
  const l3 = ai.sloziKontekst({ vodicIde: false, razina: 3, xp: 0, odsutnostMs: null });
  assert.equal(l1.xp.prag, 120);
  assert.equal(l2.xp.prag, 179);
  assert.equal(l3.xp.prag, 249);

  const pun = ai.sloziKontekst({
    vodicIde: false,
    razina: 4,
    xp: 15,
    odsutnostMs: null,
    zlato: 4321,
    dijamanti: 3,
    resursi: { drvo: 777, kamen: 2500, zeljezo: 4242 },
    energija: 9,
    baterija: 1,
    stitovi: 1,
    oklop: 0,
    metci: 8,
    sreca: 5,
    stanovnici: 3.9,
    doba: "dan",
    kisa: true,
    gradevine: { pilana: 1, kuca: 1, bunar: 1, salun: 1, staja: 1, lov: 1 },
  });
  assert.equal(pun.resursiRazina.zlato, "dosta");
  assert.equal(pun.resursiRazina.dijamanti, "malo");
  assert.equal(pun.resursiRazina.drvo, "dosta");
  assert.equal(pun.resursiRazina.kamen, "puno");
  assert.equal(pun.resursiRazina.zeljezo, "puno");
  assert.deepEqual(pun.energija, { trenutno: 9, max: 26 });
  assert.equal(pun.stitovi.max, 1);
  assert.equal(pun.srecaStatus, "vrhunska");
  assert.equal(pun.brojKauboja, 3);
  assert.equal(pun.dobaDana, "podne");
  assert.equal(pun.vrijeme, "kisa");
  assert.equal(pun.fazaPrice, "srednji");
  assert.ok(pun.izgradeneZgrade.length <= 8);
  assert.equal(pun.zabranjeneRijeci.length, 5);
  const json = JSON.stringify(pun);
  for (const zab of ["4321", "777", "2500", "4242"]) assert.equal(json.includes(zab), false, zab);
  assert.equal(ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, baterija: 0 }).energija.max, 20);
  assert.equal(ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, baterija: 6 }).energija.max, 56);
  assert.equal(ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, baterija: 9 }).energija.max, 56);
  assert.equal(ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, oklop: 4 }).stitovi.max, 5);
  assert.equal(ai.sloziKontekst({ vodicIde: false, razina: 1, xp: 0, odsutnostMs: null, oklop: 9 }).stitovi.max, 5);
  assert.equal(ai.srecaStatus(0), "osnovna");
  assert.equal(ai.srecaStatus(2), "osnovna");
  assert.equal(ai.srecaStatus(3), "napredna");
  assert.equal(ai.srecaStatus(4), "napredna");
  assert.equal(ai.srecaStatus(5), "vrhunska");
  assert.equal(ai.srecaStatus(6), "vrhunska");
  assert.equal(ai.srecaStatus(9), "vrhunska");
  assert.equal(ai.resursRazina("zlato", 499), "malo");
  assert.equal(ai.resursRazina("zlato", 500), "dosta");
  assert.equal(ai.resursRazina("zlato", 4999), "dosta");
  assert.equal(ai.resursRazina("zlato", 5000), "puno");
  assert.equal(ai.fazaPrice(true, 20, 20), "uvod");
  assert.equal(ai.fazaPrice(false, 1, 0), "rani");
  assert.equal(ai.fazaPrice(false, 9, 3), "rani");
  assert.equal(ai.fazaPrice(false, 9, 13), "kasni");
  assert.equal(ai.dobaDana("suton"), "vecer");
  assert.equal(ai.dobaDana("noc"), "noc");
  assert.equal(ai.vrijemeOdsutnosti(null), null);
  assert.equal(ai.vrijemeOdsutnosti(30 * 60 * 1000), "nedavno");
  assert.equal(ai.vrijemeOdsutnosti(2 * 60 * 60 * 1000), "sati");
  assert.equal(ai.vrijemeOdsutnosti(24 * 60 * 60 * 1000), "dan_vise");

  const tijelo = ai.tijeloSpawna(pun, 3.2, 4.8);
  assert.equal(tijelo.v, 1);
  assert.equal(tijelo.chapter, "blago1-kauba");
  assert.equal(tijelo.zadatak, "spawn_puni");
  assert.deepEqual(tijelo.player, { x: 3, y: 5 });
  assert.equal(JSON.stringify(tijelo).includes("4321"), false);
  assert.equal(ai.tijeloPovratka(2 * 3600000, ["drvo 120"]).povratak.odsutnost, "kratko");
  assert.equal(ai.tijeloPovratka(5 * 3600000, []).povratak.odsutnost, "nekoliko sati");
  assert.equal(ai.tijeloPovratka(12 * 3600000, []).povratak.odsutnost, "cijeli dan");
  assert.equal(ai.tijeloPovratka(25 * 3600000, []).povratak.odsutnost, "dugo");
  assert.deepEqual(ai.tijeloPovratka(600000, []).player, { x: 0, y: 0 });
});

test("validator: tip, naziv, znamenke, isplata, ponavljanje", async () => {
  const ai = await jiti.import("../src/lib/game/aiDogadaj.ts");
  const dobar = { id: "stari_kovceg", tip: "skrinja_s_blagom", naziv: "Stari kovčeg", opis: "Običan drveni kovčeg." };
  assert.equal(ai.validirajObjekt(dobar, []), true);
  assert.equal(ai.validirajObjekt({ ...dobar, tip: "zlato" }, []), false);
  assert.equal(ai.validirajObjekt({ ...dobar, id: "Krivo" }, []), false);
  assert.equal(ai.validirajObjekt({ ...dobar, naziv: "A".repeat(29) }, []), false);
  assert.equal(ai.validirajObjekt({ ...dobar, opis: "Kutija 2 metka." }, []), false);
  assert.equal(ai.validirajObjekt({ ...dobar, opis: "Ovo je jackpot stranče." }, []), false);
  assert.equal(ai.validirajObjekt({ ...dobar, opis: "Šansa je mala stranče." }, []), false);
  assert.equal(ai.validirajObjekt(dobar, [{ tip: "skrinja_s_blagom", naziv: "Stari kovčeg" }]), false);
  const iz = ai.objektIzOdg({ ok: true, object: { ...dobar, x: 9, y: 8 } }, []);
  assert.equal(iz.id, "stari_kovceg");
  assert.equal(iz.x, undefined);
  assert.equal(ai.objektIzOdg({ ok: false, object: dobar }, []), null);

  const pov = { ok: true, model: "mali", object: { tekst: "Dok te nije bilo, drvo je stiglo." } };
  assert.equal(ai.validirajPovratak(pov, []), "Dok te nije bilo, drvo je stiglo.");
  assert.equal(ai.validirajPovratak({ ...pov, model: "pravilo" }, []), null);
  assert.equal(ai.validirajPovratak({ ...pov, object: { tekst: "Stiglo je drvo 99 komada." } }, ["drvo 120"]), null);
  assert.equal(ai.validirajPovratak({ ...pov, object: { tekst: "Stiglo je drvo 120 i mir." } }, ["drvo 120"]), "Stiglo je drvo 120 i mir.");
  assert.equal(ai.validirajPovratak({ ...pov, object: { tekst: "Vidi {ovu} zamku odmah." } }, []), null);
  assert.equal(ai.validirajPovratak({ ...pov, object: { tekst: "Otvori http://x.hr odmah sada." } }, []), null);
});

test("lokalni tekstovi i prednost", async () => {
  const ai = await jiti.import("../src/lib/game/aiDogadaj.ts");
  const odmor = ai.lokalniObjekt({ energija: 4, maxEnergija: 20, stitovi: 1, metci: 9, ostecene: 0, korak: 0 });
  assert.equal(odmor.tip, "logorska_vatra");
  assert.equal(odmor.naziv, "Logorska vatra");
  assert.equal(odmor.opis, "Topla vatra i kava. Odmori se, stranče.");
  const pojilo = ai.lokalniObjekt({ energija: 4, maxEnergija: 20, stitovi: 0, metci: 0, ostecene: 3, korak: 1 });
  assert.equal(pojilo.naziv, "Pojilo u hladu");
  const kova = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 0, metci: 0, ostecene: 2, korak: 0 });
  assert.equal(kova.naziv, "Stara kovačnica");
  assert.equal(kova.opis, "Nakovanj je još topao. Popravi svoj štit.");
  const metci = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 1, metci: 2, ostecene: 4, korak: 0 });
  assert.equal(metci.naziv, "Kutija metaka");
  assert.equal(metci.opis, "Banda je pobjegla. Ostavila je kutiju metaka.");
  const daske = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 1, metci: 6, ostecene: 1, korak: 0 });
  assert.equal(daske.naziv, "Hrpa dasaka");
  const grumen = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 1, metci: 6, ostecene: 1, korak: 1 });
  assert.equal(grumen.naziv, "Grumen zlata");
  assert.equal(grumen.opis, "Viri iz pijeska. Uzmi ga brzo.");
  const kovceg = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 1, metci: 6, ostecene: 0, korak: 0 });
  assert.equal(kovceg.naziv, "Stari kovčeg");
  assert.equal(kovceg.opis, "Običan drveni kovčeg.");
  const konj = ai.lokalniObjekt({ energija: 20, maxEnergija: 20, stitovi: 1, metci: 6, ostecene: 0, korak: 2 });
  assert.equal(konj.naziv, "Tragovi konja");
  assert.equal(konj.opis, "Banda je prošla ovuda. Budi oprezan, stranče.");
  const nagrada = ai.nagradaZaAiTip("napusteni_kamp");
  assert.equal(nagrada.metci, 6);
  assert.equal(nagrada.nagrada.drvo, 16);
  assert.equal(ai.nagradaZaAiTip("skrinja_s_blagom").nagrada.dijamanti, 4);
  assert.equal(ai.nagradaZaAiTip("zakopano_zlato").nagrada.zlato, 50);
  assert.equal(ai.nagradaZaAiTip("logorska_vatra").nagrada.energija, 4);
  assert.deepEqual(ai.nagradaZaAiTip("stari_bunar").nagrada, { energija: 4, kamen: 6 });
  assert.equal(ai.nagradaZaAiTip("kovacnica").nagrada.stitovi, 1);
  assert.equal(ai.nagradaZaAiTip("trag_bande").nagrada.zlato, 16);
});

test("redak po pravilu i granica 10 min", async () => {
  const ai = await jiti.import("../src/lib/game/aiDogadaj.ts");
  assert.equal(ai.redakPravila([]), "Dok te nije bilo, sve je bilo mirno.");
  assert.equal(ai.redakPravila(["drvo 120"]), "Dok te nije bilo: drvo 120.");
  assert.equal(ai.redakPravila(["drvo 120", "kamen 8"]), "Dok te nije bilo: drvo 120 i kamen 8.");
  assert.equal(
    ai.redakPravila(["drvo 120", "kamen 8", "Pilana gotova", "zlato 4"]),
    "Dok te nije bilo: drvo 120, kamen 8 i Pilana gotova.",
  );
  assert.equal(ai.smijePovratak(10 * 60 * 1000 - 1), false);
  assert.equal(ai.smijePovratak(10 * 60 * 1000), true);
  assert.equal(ai.ocistiStavku("drvo 120"), "drvo 120");
  assert.equal(ai.ocistiStavku("Pilana gotova"), "Pilana gotova");
  assert.equal(ai.ocistiStavku("jackpot 10"), null);
});

function mem() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

function lokalno() {
  return { energija: 20, maxEnergija: 20, stitovi: 1, metci: 6, ostecene: 0 };
}

test("fallback: timeout, 403, 429 i 10 min bez fetcha; prekidač gasi fetch", async () => {
  const ai = await jiti.import("../src/lib/game/aiDogadaj.ts");
  const poz = await jiti.import("../src/lib/game/aiPoziv.ts");
  const baz = await jiti.import("../src/lib/game/aiBazen.ts");
  baz.resetAiTest();

  const ctx = ai.sloziKontekst({ vodicIde: true, razina: 1, xp: 0, odsutnostMs: null, zlato: 1, resursi: { drvo: 1, kamen: 1, zeljezo: 1 } });
  let n = 0;
  const visi = (_url, init) =>
    new Promise((_res, rej) => {
      n += 1;
      init.signal.addEventListener("abort", () => rej(new DOMException("Aborted", "AbortError")));
    });
  const prvi = await ai.dohvatiSpawn({
    ai: true,
    kontekst: ctx,
    x: 10,
    y: 20,
    lokal: lokalno(),
    posljednji: [],
    fetch: visi,
    sad: 5000,
    rokMs: 40,
    spremnik: mem(),
  });
  assert.equal(n, 1);
  assert.equal(prvi.naziv, "Stari kovčeg");
  assert.equal(prvi.x, 10);
  assert.ok(prvi.nagrada);

  baz.resetAiTest();
  const s403 = mem();
  let n403 = 0;
  const f403 = async () => {
    n403 += 1;
    return { ok: false, status: 403, json: async () => ({}) };
  };
  const ulaz = {
    ai: true,
    sad: 1_000_000,
    fetch: f403,
    rokMs: 1000,
    spremnik: s403,
    lokal: lokalno(),
    kontekst: ctx,
    posljednji: [],
    gradevine: {},
    gradnje: [],
  };
  await baz.napuniBazen(ulaz);
  assert.equal(n403, 1);
  assert.ok(baz.bazenSnapshot().length >= 1);
  await baz.napuniBazen({ ...ulaz, sad: 1_000_000 + 60_000 });
  assert.equal(n403, 1);
  assert.equal(baz.bazenSnapshot().length, 4);
  baz.isprazniBazen();
  await baz.napuniBazen({ ...ulaz, sad: 1_000_000 + 10 * 60 * 1000 });
  assert.equal(n403, 2);

  baz.resetAiTest();
  const s429 = mem();
  let n429 = 0;
  const f429 = async (url, init) => {
    n429 += 1;
    assert.equal(url, poz.AI_URL);
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.ok(init.headers["X-Blago-Install"]);
    return { ok: false, status: 429, json: async () => ({}) };
  };
  await ai.dohvatiSpawn({
    ai: true,
    kontekst: ctx,
    x: 1,
    y: 2,
    lokal: lokalno(),
    posljednji: [],
    fetch: f429,
    sad: 8000,
    rokMs: 500,
    spremnik: s429,
  });
  await ai.dohvatiSpawn({
    ai: true,
    kontekst: ctx,
    x: 1,
    y: 2,
    lokal: lokalno(),
    posljednji: [],
    fetch: f429,
    sad: 8000 + 5 * 60 * 1000,
    rokMs: 500,
    spremnik: s429,
  });
  assert.equal(n429, 1);
  await ai.dohvatiSpawn({
    ai: true,
    kontekst: ctx,
    x: 1,
    y: 2,
    lokal: lokalno(),
    posljednji: [],
    fetch: f429,
    sad: 8000 + 10 * 60 * 1000,
    rokMs: 500,
    spremnik: s429,
  });
  assert.equal(n429, 2);

  baz.resetAiTest();
  let nOff = 0;
  await baz.napuniBazen({
    ...ulaz,
    ai: false,
    fetch: async () => {
      nOff += 1;
      return { ok: true, status: 200, json: async () => ({}) };
    },
    spremnik: mem(),
    sad: 50_000,
  });
  assert.equal(nOff, 0);
  assert.equal(baz.bazenSnapshot().length, 4);
});
