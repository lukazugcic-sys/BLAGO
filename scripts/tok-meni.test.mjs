import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/game/tokMeni.ts", import.meta.url), "utf8");

assert.doesNotMatch(src, /naziv: "Tok"/);
assert.doesNotMatch(src, /Žive linije, sadašnji stil/);
assert.doesNotMatch(src, /export function tokMeniZa\(/);
assert.doesNotMatch(src, /export function tokMeniZaExtra/);
assert.doesNotMatch(src, /vrsta: "nacin"/);
assert.match(src, /naziv: "Almanah"/);
assert.match(src, /vrsta: "travar"/);
assert.match(src, /vrsta: "kisa"/);
assert.match(src, /id: "salun"/);
assert.match(src, /id: "pohod"/);
assert.match(src, /Tezga i burza/);
assert.match(src, /id: "kuca"/);
assert.match(src, /Diži krov/);
assert.doesNotMatch(src, /Tezgah/);
assert.match(src, /export function tokMeniRaspored/);
assert.match(src, /export function tokMeniPolukrug/);
assert.match(src, /otvara prema sredini/);
assert.match(src, /export function tokMeniZaLika/);
assert.match(src, /export function tokMeniZaTab/);
assert.match(src, /export function tokMeniZaResurs/);
assert.match(src, /vrsta: "premjesti"/);
assert.match(src, /export function tokMeniZaPlakat/);
assert.match(src, /export function tokMeniZaSimbol/);
assert.match(src, /export function tokMeniEkran/);
assert.match(src, /TOK_MENI_NAV/);
assert.match(src, /TOK_MENI_STAVKA_R/);
assert.match(src, /export function tokMeniOsmica/);
assert.match(src, /export function tokMeniZaDio/);
assert.match(src, /Tko vuče koga u kaubi/);
assert.match(src, /vrsta: "ruke"/);
assert.match(src, /naziv: "Kauboji"/);
assert.match(src, /id === "ruke"/);
assert.match(src, /naziv: "5 knjiga"/);
assert.doesNotMatch(src, /naziv: "3 knjige"/);
assert.match(src, /OSMICA_RED/);
assert.match(src, /naziv: "Casino"/);
assert.match(src, /Stolovi i kocke/);
assert.match(src, /PLAKAT_HUB/);
assert.match(src, /vrsta: "info"/);
assert.match(src, /id === "skull"/);
assert.match(src, /id === "knjiga"/);

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.match(css, /kauba-prsten/);
assert.match(css, /kauba-osmica-stavka/);
assert.match(css, /kauba-scena-slika/);
assert.match(css, /kauba-osmica-sloj/);
assert.match(css, /padding-bottom:max\(\.6rem, env\(safe-area-inset-bottom\)\)/);
assert.match(css, /zid-gori/);
assert.match(css, /kauba-dio-hero/);
assert.match(css, /position:\s*fixed/);
assert.match(css, /mreza-dio-prikaz/);
assert.match(css, /kauba-scena/);
assert.match(css, /kauba-dio/);
assert.match(css, /almanah-sloj/);
assert.match(css, /almanah-veza/);

const villageEkran = readFileSync(new URL("../src/components/game/VillageScreen.tsx", import.meta.url), "utf8");
assert.match(villageEkran, /kauba-dio/);
assert.match(villageEkran, /KaubaScena/);
assert.match(villageEkran, /tokMeniPrsten/);
assert.match(villageEkran, /a\.vrsta === "hub"/);
assert.match(villageEkran, /odaberiHub/);
assert.match(villageEkran, /setDio\(id\)/);
assert.match(villageEkran, /tokMeniZaDio/);
assert.match(villageEkran, /drziPrsten/);
assert.match(villageEkran, /kadriScena/);
assert.match(villageEkran, /imeNaselja/);
assert.match(villageEkran, /AlmanahSloj/);
assert.match(villageEkran, /vrsta === "almanah"/);
assert.match(villageEkran, /aktivan/);
assert.doesNotMatch(villageEkran, /setNacin/);
assert.doesNotMatch(villageEkran, /POHOD — nešto gori/);
assert.doesNotMatch(villageEkran, /zgradeListak/);
assert.doesNotMatch(villageEkran, /JutroTraka/);
assert.doesNotMatch(villageEkran, /dogadaj && \(/);

const zidEkran = readFileSync(new URL("../src/components/game/ZidScreen.tsx", import.meta.url), "utf8");
assert.match(zidEkran, /serif-zid-cin/);
assert.match(zidEkran, /EventKartica/);

const dijalozi = readFileSync(new URL("../src/lib/game/dijalozi.ts", import.meta.url), "utf8");
assert.match(dijalozi, /Koža je tijesna/);
assert.match(dijalozi, /Lijepa sela lijepo gore/);
assert.match(dijalozi, /Maratonci trče počasni krug/);
assert.match(dijalozi, /Nema smrti dok šerif drži kaubu/);
assert.match(dijalozi, /Valter\. To je ovaj grad/);
assert.match(dijalozi, /Dobar, loš, ružan/);
assert.match(dijalozi, /Na Drini ćuprija/);
assert.match(dijalozi, /Winnetou ne laže/);
assert.match(dijalozi, /Svi su sumnjivi/);

const zid = readFileSync(new URL("../src/components/game/ZidScreen.tsx", import.meta.url), "utf8");
assert.match(zid, /serif-zid/);
assert.match(zid, /Obavijesti šerifa/);
assert.match(zid, /serifPlakati/);
assert.match(zid, /tokMeniZaPlakat/);
assert.match(zid, /HOLD_KADAR_MS/);
assert.match(zid, /chip-drzi/);
assert.match(zid, /holdDosta/);
assert.match(zid, /LiveTicker/);
assert.match(zid, /PotjernicaToast/);
assert.match(zid, /TjedanTraka/);
assert.match(zid, /EventBanner/);
assert.match(zid, /zid-gori/);
assert.match(zid, /idiNaZgradu/);

const slotEkran = readFileSync(new URL("../src/components/game/SlotScreen.tsx", import.meta.url), "utf8");
assert.match(slotEkran, /data-chip="energija"/);
assert.match(slotEkran, /zavrtiMasinu/);
assert.doesNotMatch(slotEkran, /slot-tv-traka/);
assert.doesNotMatch(slotEkran, /slot-tv\b/);
assert.doesNotMatch(slotEkran, /2 · 4 · 1 · 5 · 3/);

const slotFx = readFileSync(new URL("../src/lib/game/slotFx.ts", import.meta.url), "utf8");
assert.match(slotFx, /2, 4, 1, 5, 3/);
assert.match(slotFx, /\[1, 3, 0, 4, 2\]/);
assert.doesNotMatch(slotEkran, /TjedanTraka/);
assert.doesNotMatch(slotEkran, /EventBanner/);

const header = readFileSync(new URL("../src/components/game/Header.tsx", import.meta.url), "utf8");
assert.match(header, /data-chip="štitovi"/);
assert.doesNotMatch(header, /Profil/);
assert.doesNotMatch(header, /AuthChip/);

const raid = readFileSync(new URL("../src/components/game/RaidModal.tsx", import.meta.url), "utf8");
assert.match(raid, /Valter · okupi kaubu/);
assert.match(raid, /okupiValter/);
assert.match(raid, /kreniSMostom/);
assert.match(raid, /osjeti\("hold"\)/);
assert.match(raid, /HOLD_KADAR_MS/);
assert.match(raid, /pohod-valter/);

const jato = readFileSync(new URL("../src/lib/game/pohodJato.ts", import.meta.url), "utf8");
assert.match(jato, /export function okupiValter/);
assert.match(jato, /posao === "Šerif"/);
assert.match(jato, /hub === "red"/);

const obav = readFileSync(new URL("../src/components/game/ObavijestSloj.tsx", import.meta.url), "utf8");
assert.doesNotMatch(obav, /obavijest-rec-alarm/);
assert.match(obav, /jeSerifovaPoruka/);


const village = readFileSync(new URL("../src/components/game/VillageScreen.tsx", import.meta.url), "utf8");
assert.match(village, /tokMeniPrsten/);
assert.match(village, /tokMeniZaDio/);
assert.match(village, /a\.vrsta === "hub"/);
assert.match(village, /odaberiHub/);
assert.match(village, /closest\("\.kauba-dio-skrol"\)/);
assert.doesNotMatch(village, /kauba-tabor-pun/);
assert.match(village, /closest\("\.kauba-skrol"\)/);
assert.match(village, /Salun, casino i blackjack/);
assert.match(village, /vrsta === "zgrada"/);
assert.doesNotMatch(village, /Salun, asovi/);

const karteIgra = readFileSync(new URL("../src/components/game/IgraKarata.tsx", import.meta.url), "utf8");
assert.match(karteIgra, /Casino/);
assert.match(karteIgra, /igra-casino/);
assert.doesNotMatch(karteIgra, /Asovi/);

const constants = readFileSync(new URL("../src/lib/game/constants.ts", import.meta.url), "utf8");
assert.match(constants, /naziv: "Casino"/);
assert.match(constants, /Otvori casino/);


const store = readFileSync(new URL("../src/lib/stores/gameStore.ts", import.meta.url), "utf8");
const stoka = readFileSync(new URL("../src/lib/stores/sliceStoka.ts", import.meta.url), "utf8");
assert.match(store, /sliceStoka/);
assert.match(store, /premjestiLika:/);
assert.match(stoka, /premjestiLika:/);
assert.match(stoka, /recPremjesti/);

const eco = readFileSync(new URL("../src/lib/game/economy.ts", import.meta.url), "utf8");
assert.match(eco, /RADNIK_POKRICE/);
assert.match(eco, /hubovi\?:/);
assert.match(eco, /export function hubBroj/);
assert.match(eco, /export function hubKap/);
assert.match(eco, /Math.min\(nRuku, kap\)/);

const ljudiSrc = readFileSync(new URL("../src/lib/game/ljudi.ts", import.meta.url), "utf8");
assert.match(ljudiSrc, /export function hubSada/);
assert.match(ljudiSrc, /mjesto === "ulica"/);
assert.match(ljudiSrc, /recFilma/);
assert.match(ljudiSrc, /recUlicaFilma/);

const radial = readFileSync(new URL("../src/components/game/TokRadial.tsx", import.meta.url), "utf8");
assert.match(radial, /tokMeniRaspored/);
assert.match(radial, /tokMeniPolukrug/);
assert.match(radial, /krug &&/);
assert.match(radial, /polukrug/);

const korijen = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
assert.doesNotMatch(korijen, /fonts\.googleapis/);
assert.doesNotMatch(korijen, /fonts\.gstatic/);
assert.match(korijen, /BarlowCondensed-SemiBold\.woff2/);
assert.match(korijen, /CinzelDecorative-Bold\.woff2/);
assert.match(korijen, /rel: "preload"/);

const fontovi = readFileSync(new URL("../src/apk-fonts.css", import.meta.url), "utf8");
assert.match(fontovi, /format\("woff2"\)/);
assert.match(fontovi, /font-display: block/);
assert.doesNotMatch(fontovi, /Cinzel-Bold/);

const stilovi = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.doesNotMatch(stilovi, /fonts\.googleapis/);
assert.match(stilovi, /mreza-dio-prikaz/);
assert.match(stilovi, /serif-zid/);
assert.match(stilovi, /tok-radial-luk/);
assert.match(stilovi, /flex:\s*0 0 100%/);
assert.doesNotMatch(stilovi, /content-visibility/);
assert.match(stilovi, /--dio-kader/);
assert.match(stilovi, /chip-drzi::?after/);
assert.match(stilovi, /object-fit:\s*cover\s*!important/);
assert.match(stilovi, /animation:\.48s|animation-duration:\s*480ms/);
assert.match(stilovi, /mreza-dio-kadar/);
assert.match(stilovi, /kauba-scena/);
assert.match(stilovi, /kauba-dio/);
assert.match(stilovi, /kauba-prsten/);
assert.match(stilovi, /slot-token-energy/);
assert.match(stilovi, /slot-token-iron/);
assert.match(stilovi, /kauba-osmica-sloj/);

const scenaSrc = readFileSync(new URL("../src/components/game/KaubaScena.tsx", import.meta.url), "utf8");
assert.match(scenaSrc, /imeNaselja/);
assert.match(scenaSrc, /ART\.ulica/);
assert.match(scenaSrc, /imePrstena/);
assert.match(scenaSrc, /if \(id === "selo"\) return ""/);
assert.doesNotMatch(scenaSrc, /360 \/ n/);
assert.match(radial, /portalKorijen/);
assert.match(scenaSrc, /data-testid="kauba-prsten"/);
assert.match(scenaSrc, /VideoLoop/);
assert.match(scenaSrc, /fit="cover"/);
assert.match(scenaSrc, /startViewTransition/);
assert.match(scenaSrc, /holdDosta/);
assert.match(scenaSrc, /KaubaZivaUlica/);
assert.match(scenaSrc, /onHold/);
assert.doesNotMatch(scenaSrc, /MrezaSela/);

assert.match(ljudiSrc, /lv \* lv \* 9/);
assert.doesNotMatch(ljudiSrc, /Math\.min\(60,/);

const portalSrc = readFileSync(new URL("../src/lib/game/portal.ts", import.meta.url), "utf8");
assert.match(portalSrc, /fullscreenElement/);
assert.match(radial, /portalKorijen/);

const apkMain = readFileSync(new URL("../src/apk-main.tsx", import.meta.url), "utf8");
assert.match(apkMain, /import "\.\/styles\.css"/);
assert.doesNotMatch(apkMain, /apk-fonts\.css/);

assert.doesNotMatch(src, /Natrag u selo/);

const navSrc = readFileSync(new URL("../src/components/game/AppNav.tsx", import.meta.url), "utf8");
assert.match(navSrc, /t\.id === "selo"/);
assert.match(navSrc, /idi\(\{ trg: true \}\)/);
assert.match(navSrc, /idi\(\{ almanah: true \}\)/);
assert.match(navSrc, /idi\(\{ ruke: true \}\)/);

const dioSrc = readFileSync(new URL("../src/components/game/KaubaDio.tsx", import.meta.url), "utf8");
assert.doesNotMatch(dioSrc, /kauba-dio-karta/);
assert.doesNotMatch(dioSrc, />Karta</);
assert.doesNotMatch(villageEkran, /onZatvori=\{zatvoriDio\}/);
assert.doesNotMatch(stilovi, /slot-tv-traka/);
assert.match(stilovi, /slot-tv-tipka/);
assert.match(stilovi, /slot-tv-zlato/);
assert.match(villageEkran, /KaubojiMreza/);
assert.match(villageEkran, /kauboji-mreza/);
assert.match(villageEkran, /otvoriDio\("ruke"\)/);
assert.doesNotMatch(villageEkran, /Kauboji kaube/);
assert.match(dioSrc, /ruke: "Kauboji"/);
assert.match(src, /Svi ljudi u kaubi/);
assert.match(src, /broj <= 3 \? 118/);
assert.match(stilovi, /slot-niz/);
assert.match(stilovi, /slot-tv-scan/);
assert.match(stilovi, /kauba-dio-ulaz/);
assert.match(stilovi, /animation-delay:\s*\.22s|animation-delay:\s*220ms/);

assert.equal(existsSync(new URL("../src/components/game/MrezaSela.tsx", import.meta.url)), true);
const ulicaTok = readFileSync(new URL("../src/components/game/KaubaZivaUlica.tsx", import.meta.url), "utf8");
assert.match(ulicaTok, /Tok kaube/);
assert.match(ulicaTok, /MrezaSela/);
assert.doesNotMatch(scenaSrc, /MrezaSela/);
assert.equal(existsSync(new URL("../src/components/game/KaubaKolo.tsx", import.meta.url)), false);
assert.equal(existsSync(new URL("../src/components/game/VillageMap.tsx", import.meta.url)), false);
assert.equal(existsSync(new URL("../src/components/game/SocialHub.tsx", import.meta.url)), false);
assert.equal(existsSync(new URL("../src/components/game/TaborGrad.tsx", import.meta.url)), false);

const PAD = 28;
const R = 66;
const RAZMAK = 48;

function stezni(cx, cy, dx, dy, W, H) {
  const x = Math.max(PAD, Math.min(W - PAD, cx + dx));
  const y = Math.max(PAD, Math.min(H - PAD, cy + dy));
  return { dx: x - cx, dy: y - cy };
}

function raspored(cx, cy, n, sirina, visina) {
  const broj = Math.max(1, n);
  const W = Math.max(PAD * 2 + 8, sirina);
  const H = Math.max(PAD * 2 + 8, visina);
  const krug = cx - R >= PAD && cy - R >= PAD && cx + R <= W - PAD && cy + R <= H - PAD;
  const tocke = [];
  if (krug) {
    for (let i = 0; i < broj; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / broj;
      tocke.push(stezni(cx, cy, Math.cos(a) * R, Math.sin(a) * R, W, H));
    }
  } else {
    const toward = Math.atan2(H / 2 - cy, W / 2 - cx);
    const span = broj <= 1 ? 0 : Math.min(Math.PI * 1.2, (broj - 1) * 0.88);
    const dist = Math.hypot(W / 2 - cx, H / 2 - cy);
    const r = Math.min(R, Math.max(52, dist * 0.42));
    for (let i = 0; i < broj; i++) {
      const t = broj === 1 ? 0.5 : i / (broj - 1);
      const a = toward - span / 2 + t * span;
      tocke.push(stezni(cx, cy, Math.cos(a) * r, Math.sin(a) * r, W, H));
    }
  }
  for (let k = 0; k < 8; k++) {
    for (let i = 0; i < tocke.length; i++) {
      for (let j = i + 1; j < tocke.length; j++) {
        const a = tocke[i];
        const b = tocke[j];
        const ddx = b.dx - a.dx;
        const ddy = b.dy - a.dy;
        const d = Math.hypot(ddx, ddy) || 0.01;
        if (d >= RAZMAK) continue;
        const push = (RAZMAK - d) / 2;
        a.dx -= (ddx / d) * push;
        a.dy -= (ddy / d) * push;
        b.dx += (ddx / d) * push;
        b.dy += (ddy / d) * push;
      }
    }
  }
  return tocke.map((t) => stezni(cx, cy, t.dx, t.dy, W, H));
}

function unutra(tocke, cx, cy, W, H) {
  const half = 22;
  return tocke.every((t) => {
    const x = cx + t.dx;
    const y = cy + t.dy;
    return x - half >= 0 && x + half <= W && y - half >= 0 && y + half <= H;
  });
}

const W = 320;
const H = 320;
assert.ok(unutra(raspored(160, 147, 3, W, H), 160, 147, W, H), "sredina");
assert.ok(unutra(raspored(160, 51, 3, W, H), 160, 51, W, H), "gore");
assert.ok(unutra(raspored(51, 173, 4, W, H), 51, 173, W, H), "lijevo");
assert.ok(unutra(raspored(269, 166, 4, W, H), 269, 166, W, H), "desno");
assert.ok(unutra(raspored(160, 250, 3, W, H), 160, 250, W, H), "dolje");
assert.ok(unutra(raspored(64, 96, 4, W, H), 64, 96, W, H), "gore-lijevo");
assert.ok(unutra(raspored(243, 230, 4, W, H), 243, 230, W, H), "dolje-desno");

const { createJiti } = await import("jiti");
const jiti = createJiti(import.meta.url);
const { tokMeniOsmica, tokMeniPrsten, tokMeniZaTab, tokMeniZaSimbol, tokMeniZaGlas } = await jiti.import("../src/lib/game/tokMeni.ts");
const { HUB_TOCKE } = await jiti.import("../src/lib/game/mrezaPrikaz.ts");
const osmica = tokMeniOsmica();
assert.equal(osmica.length, 8);
assert.deepEqual(
  osmica.map((s) => s.id).sort(),
  HUB_TOCKE.map((h) => h.id).sort(),
);
for (const s of osmica) {
  assert.equal(s.akcija.vrsta, "hub");
  assert.equal(s.akcija.hub, s.id);
}
assert.equal(osmica.some((s) => s.id === "oruzje"), false);

const seloTab = tokMeniZaTab("selo");
for (const s of osmica) {
  assert.ok(
    seloTab.some((x) => x.akcija.vrsta === "hub" && x.akcija.hub === s.id),
    s.id,
  );
}
const prsten = tokMeniPrsten(true);
assert.ok(prsten.some((s) => s.akcija.vrsta === "almanah" && s.naziv === "Almanah"));
assert.ok(prsten.some((s) => s.akcija.vrsta === "ruke" && s.naziv === "Kauboji"));
assert.ok(prsten.some((s) => s.akcija.vrsta === "pohod" && s.naziv === "Pohod"));
assert.equal(tokMeniZaTab("automat", { dijamanti: 0, bonusCijena: 15 }).length, 0);
const automat = tokMeniZaTab("automat", { dijamanti: 20, bonusCijena: 15 });
assert.ok(automat.some((s) => s.akcija.vrsta === "slot" && s.akcija.slot === "auto"));
assert.equal(automat.some((s) => s.akcija.vrsta === "trg"), false);

const lubanja = tokMeniZaSimbol("skull");
assert.ok(lubanja.some((s) => s.id === "opasnost"));
const knjiga = tokMeniZaSimbol("knjiga");
assert.ok(knjiga.some((s) => s.naziv === "5 knjiga"));
assert.equal(knjiga.some((s) => s.naziv === "3 knjige"), false);
const glas = tokMeniZaGlas("zabava");
assert.ok(glas.some((s) => s.akcija.vrsta === "zgrada"));
assert.ok(glas.some((s) => s.naziv === "Casino"));

console.log("OK tok-meni");

