import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createJiti } from "jiti";

const root = new URL("..", import.meta.url);

function citaj(rel) {
  return fs.readFileSync(new URL(rel, root), "utf8");
}

test("svaki korak vodiča ima cilj na ekranu", () => {
  const vodic = citaj("src/lib/game/vodic.ts");
  const slot = citaj("src/components/game/SlotScreen.tsx");
  const zgrade = citaj("src/components/game/BuildingCard.tsx");
  const header = citaj("src/components/game/Header.tsx");
  const selo = citaj("src/components/game/VillageScreen.tsx");
  const zadaci = citaj("src/components/game/MissionsScreen.tsx");
  const trznica = citaj("src/components/game/ShopScreen.tsx");
  const sloj = citaj("src/components/game/VodicSloj.tsx");
  const kartica = citaj("src/components/game/EventKartica.tsx");

  assert.match(vodic, /vrtnja1: "zavrti"/);
  assert.match(vodic, /kuca: "kuca"/);
  assert.match(vodic, /proizvod: "drvo"/);
  assert.match(vodic, /nalog: "nalog-kauba"/);
  assert.match(vodic, /kauboj: "zaposli"/);
  assert.match(vodic, /burza: "burza"/);
  assert.match(vodic, /zgrada: "bunar"/);
  assert.match(slot, /data-testid="zavrti"/);
  assert.match(zgrade, /zgrada\.id === "kuca" \|\| zgrada\.id === "bunar"/);
  assert.match(header, /fullName: "drvo"/);
  assert.match(sloj, /data-chip=drvo/);
  assert.match(kartica, /data-vodic=\{oznaka\}/);
  assert.match(selo, /oznaka[=:] ?\{?dogadaj\.tip === "stranac" \? "nalog-kauba"/);
  assert.match(selo, /vodicNalog\(true\)/);
  assert.match(zadaci, /oznaka="stranac"/);
  assert.match(zadaci, /vodicNalog\(true\)/);
  assert.match(vodic, /Otvori prvi nalog/);
  assert.match(vodic, /izKartice = false/);
  assert.doesNotMatch(citaj("src/lib/stores/sliceSat.ts"), /vodicNalog/);
  assert.doesNotMatch(citaj("src/lib/game/idiNalog.ts"), /vodicNalog/);
  assert.match(sloj, /Pričekaj da se/);
  assert.match(sloj, /Ubrzaj/);
  assert.match(sloj, /b\.disabled/);
  assert.match(citaj("src/lib/game/noviPocetak.ts"), /indexedDB/);
  assert.match(citaj("src/lib/game/noviPocetak.ts"), /brise = true/);
  assert.match(citaj("src/lib/game/persist.ts"), /postaviBlokaduSpremanja/);
  assert.match(citaj("src/styles.css"), /\.ziva-red\{[^}]*width:\s*100%;[^}]*min-width:\s*0/);
  const ulica = [
    citaj("src/components/game/KaubaZivaUlica.tsx"),
    citaj("src/components/game/KaubaKuce.tsx"),
    citaj("src/components/game/KaubaCesta.tsx"),
  ].join("\n");
  assert.match(ulica, /ziva-izo/);
  assert.doesNotMatch(ulica, /ziva-dvapol/);
  assert.doesNotMatch(ulica, /dvapol-dalje/);
  assert.doesNotMatch(ulica, /izo-centar/);
  assert.match(ulica, /DVO_MS = 300/);
  assert.match(ulica, /OTVORI_MS = 320/);
  assert.match(ulica, /blago-centriraj/);
  const scena = citaj("src/components/game/KaubaScena.tsx");
  assert.match(scena, /KaubaZivaUlica/);
  assert.doesNotMatch(scena, /Centriraj/);
  assert.doesNotMatch(scena, /data-testid="centriraj"/);
  assert.match(sloj, /rupaIzRect/);
  assert.doesNotMatch(sloj, /Math\.max\(rub\.vrh/);
  assert.match(ulica, /data-lock-pan/);
  assert.match(ulica, /ZOOM_MIN = 0\.6/);
  assert.match(ulica, /ZOOM_MAX = 2/);
  assert.match(ulica, /izoZgrada/);
  assert.match(ulica, /IZO_DEKOR\.skela/);
  assert.match(ulica, /izo-kolac/);
  assert.match(ulica, /loading="lazy"/);
  assert.match(ulica, /otvoriCiljZgradu/);
  assert.match(ulica, /is-gradi/);
  assert.doesNotMatch(ulica, /data-vodic/);
  const novi = citaj("src/lib/game/noviPocetak.ts");
  assert.match(novi, /novi-obraden/);
  assert.match(novi, /replaceState/);
  assert.match(novi, /location\.reload/);
  assert.match(citaj("src/components/game/GameApp.tsx"), /noviUpitTreba/);
  assert.match(selo, /data-vodic=\{p\.hub === h\.id \? undefined : "zaposli"\}|"data-vodic": p\.hub === h\.id \? void 0 : "zaposli"/);
  assert.match(trznica, /oznaka=\{r\.id === "drvo" \? "burza"/);
  assert.match(sloj, /vodicPreskociKorak/);
  assert.match(vodic, /export function vodicIdi/);
  assert.match(vodic, /Čeka te dnevna nagrada|Otvori prvi nalog/);
  assert.doesNotMatch(vodic, /Popis/);
  assert.doesNotMatch(selo, /kauba-popis/);
  assert.doesNotMatch(selo, /"Popis"/);
  assert.match(sloj, /Čeka te dnevna nagrada/);
  assert.match(sloj, /vodicDrziDokKucaRaste/);
});

test("IDI za vrijeme kuće ne otvara tržnicu ni vodu", async () => {
  const jiti = createJiti(import.meta.url);
  const v = await jiti.import("../src/lib/game/vodic.ts");
  assert.deepEqual(v.vodicOdrediste("kuca"), { tab: "selo", hub: "krov" });
  assert.deepEqual(v.vodicOdrediste("proizvod"), { tab: "selo", trg: true });
  assert.deepEqual(v.vodicOdrediste("nalog"), { tab: "selo", trg: true });
  assert.deepEqual(v.vodicOdrediste("burza"), { tab: "trznica", trznica: "burza" });
  assert.deepEqual(v.vodicOdrediste("zgrada"), { tab: "selo", hub: "voda" });
  assert.equal(v.vodicDrziDokKucaRaste("proizvod"), true);
  assert.equal(v.vodicDrziDokKucaRaste("kuca"), true);
  assert.equal(v.vodicDrziDokKucaRaste("zgrada"), false);
  assert.equal(v.vodicDrziDokKucaRaste("burza"), false);
  const tijelo = citaj("src/lib/game/vodic.ts").slice(citaj("src/lib/game/vodic.ts").indexOf("export function vodicIdi"));
  assert.match(tijelo, /usmjeri\(stanje\.korak\)/);
  assert.doesNotMatch(tijelo.slice(0, 80), /vodicPokupi/);
});

test("rupa vodiča je u koordinatama overlaya", async () => {
  const jiti = createJiti(import.meta.url);
  const { rupaIzRect } = await jiti.import("../src/lib/game/vodicRupa.ts");
  const rupa = rupaIzRect(
    { left: 20, top: 100, right: 120, bottom: 148, width: 100, height: 48 },
    { left: 0, top: 40, right: 360, bottom: 800, width: 360, height: 760 },
    8,
  );
  assert.ok(rupa);
  assert.equal(rupa.t, 52);
  assert.equal(rupa.l, 12);
  assert.equal(rupa.r, 128);
  assert.equal(rupa.b, 116);
  assert.equal(rupa.t - (100 - 40), -8);
  assert.equal(rupa.l - (20 - 0), -8);
});

test("vodič dođe do Kauba je rođena", async () => {
  const jiti = createJiti(import.meta.url);
  const v = await jiti.import("../src/lib/game/vodic.ts");
  v.vodicNaUcitavanju(false);
  assert.equal(v.vodicSnapshot().korak, "gotovo");
  assert.equal(v.vodicSnapshot().staro, true);
  assert.equal(v.vodicSnapshot().prikaz, false);
  assert.equal(v.vodicJosIde(), false);
  assert.equal(v.vodicPrikazan(), false);
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), true);
  assert.equal(v.vodicKolo(), null);
  const upute = v.vodicUpute();
  assert.ok(upute.some((u) => u.naslov === "Zavrti prvo kolo"));
  assert.equal(v.vodicSnapshot().korak, "gotovo");

  v.vodicPonovi();
  assert.equal(v.vodicSnapshot().korak, "prica");
  assert.equal(v.vodicSnapshot().prikaz, false);
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), false);

  v.vodicKrajPrice();
  v.vodicPlijen();
  v.vodicPlijen();
  assert.equal(v.vodicSnapshot().korak, "kuca");
  v.vodicIdi();
  assert.equal(v.vodicSnapshot().korak, "kuca");
  v.vodicGradnja("kuca");
  v.vodicPokupi();
  v.vodicNalog();
  assert.equal(v.vodicSnapshot().korak, "nalog");
  v.vodicNalog(true);
  v.vodicZaposli();
  v.vodicProdaja();
  v.vodicGradnja("bunar");

  const s = v.vodicSnapshot();
  assert.equal(s.korak, "finale");
  assert.equal(s.finale, true);
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), false);
  for (const c of v.vodicCiljevi()) assert.ok(c.cilj, c.korak);

  v.vodicZatvoriFinale();
  assert.equal(v.vodicSnapshot().korak, "gotovo");
  assert.equal(v.vodicSnapshot().finaleVidjen, true);
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), true);

  v.vodicPonovi();
  assert.equal(v.vodicSnapshot().korak, "prica");
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), false);
  v.vodicPreskoci();
  assert.equal(v.vodicDnevnaSmije("1999-01-01"), false);
  assert.equal(v.vodicDnevnaSmije("2999-01-01"), true);

  v.vodicNaUcitavanju(true);
  assert.equal(v.vodicSnapshot().staro, true);
  assert.equal(v.vodicDnevnaSmije("1999-01-01"), true);
});

test("upute ne pale sloj i ne dupliciraju nagradu", async () => {
  const jiti = createJiti(import.meta.url);
  const v = await jiti.import("../src/lib/game/vodic.ts");
  const { SAVE_KEYS } = await jiti.import("../src/lib/game/persist.ts");
  const nagrade = [];
  const mem = new Map();
  const prije = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, val) => mem.set(k, String(val)),
      removeItem: (k) => mem.delete(k),
    },
    setTimeout: () => 0,
    clearTimeout: () => {},
    dispatchEvent(e) {
      if (e?.type === "blago:vodic-nagrada") nagrade.push(e.detail);
    },
    addEventListener() {},
    removeEventListener() {},
  };
  try {
    mem.set(
      SAVE_KEYS.vodic,
      JSON.stringify({
        korak: "kuca",
        staro: false,
        finaleVidjen: false,
        preskokDan: "",
        pocetak: 1,
        drvoBaza: -1,
        novi: [],
        vidjeno: [],
      }),
    );
    v.vodicNaUcitavanju(true);
    assert.equal(v.vodicSnapshot().korak, "kuca");
    assert.equal(v.vodicSnapshot().prikaz, false);
    assert.equal(v.vodicJosIde(), true);
    assert.equal(v.vodicDnevnaSmije("2999-01-01"), false);
    v.vodicUpute();
    assert.equal(v.vodicSnapshot().korak, "kuca");
    assert.equal(nagrade.length, 0);
    v.vodicGradnja("kuca");
    assert.equal(v.vodicSnapshot().korak, "proizvod");
    assert.equal(nagrade.length, 1);
    assert.deepEqual(nagrade[0], { zlato: 6 });
    v.vodicGradnja("kuca");
    v.vodicUpute();
    assert.equal(nagrade.length, 1);
    assert.equal(v.vodicSnapshot().korak, "proizvod");
    assert.equal(v.vodicSnapshot().prikaz, false);
  } finally {
    if (prije === undefined) delete globalThis.window;
    else globalThis.window = prije;
    v.vodicNaUcitavanju(false);
  }
});
