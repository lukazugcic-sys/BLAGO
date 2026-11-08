#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = "http://127.0.0.1:8080";
mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-webgpu"],
});

const dismissChrome = async (page) => {
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.locator("input").first().fill("Test").catch(() => {});
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByTestId("onboard-igraj").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 800 }).catch(() => {});
};

const nova = async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch { /* ignore */ }
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Pokreni igru").click({ force: true });
  await page.waitForTimeout(400);
  await dismissChrome(page);
  await page.waitForTimeout(300);
  await page.getByTestId("kauba-prsten").waitFor({ state: "visible" });
  return page;
};

const holdEl = async (page, testId) => {
  const box = await page.getByTestId(testId).boundingBox();
  if (!box) return false;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(850);
  await page.mouse.up();
  return true;
};

const holdNav = async (page, label) => {
  const btn = page.locator("nav").getByLabel(label, { exact: true });
  const box = await btn.boundingBox();
  if (!box) return false;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(850);
  await page.mouse.up();
  return true;
};

const clipStavke = async (page) => {
  return page.evaluate(() => {
    const nav = document.querySelector("nav");
    const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
    const stavke = [...document.querySelectorAll("[data-testid^=tok-precica-]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        t: el.textContent?.trim(),
        top: Math.round(r.top),
        bot: Math.round(r.bottom),
        left: Math.round(r.left),
        right: Math.round(r.right),
      };
    });
    const clipped = stavke.filter(
      (s) => s.top < -4 || s.bot > window.innerHeight + 4 || s.left < -4 || s.right > window.innerWidth + 4 || s.bot > navTop + 6,
    );
    return { n: stavke.length, stavke: stavke.map((s) => s.t), clipped: clipped.map((s) => s.t) };
  });
};

const zatvoriRadial = async (page) => {
  await page.locator(".tok-radial-poz").click({ force: true, timeout: 1200 }).catch(() => {});
  await page.waitForTimeout(150);
};

const fail = [];
try {
  const page = await nova();
  const info = await page.evaluate(() => {
    const video = document.querySelector("[data-testid=mreza-video]");
    const prsten = document.querySelector("[data-testid=kauba-prsten]");
    const scenaEl = document.querySelector("[data-testid=kauba-ulica]");
    const scena = document.querySelector("[data-testid=jutro-scena]");
    const traka = document.querySelector("[data-testid=jutro-traka]");
    const modal = document.querySelector(".modal-pozadina");
    const vr = video?.getBoundingClientRect();
    const pr = prsten?.getBoundingClientRect();
    return {
      videoH: Math.round(vr?.height || 0),
      videoTop: Math.round(vr?.top || 0),
      prstenY: Math.round(pr?.top || 0),
      prstenTxt: (prsten?.textContent ?? "").trim(),
      trg: scenaEl?.getAttribute("data-trg"),
      imaSliku: !!video?.querySelector("img, video, .video-loop-sloj"),
      ulicaSrc: video?.querySelector("img")?.getAttribute("src") ?? "",
      dio: video?.getAttribute("data-dio"),
      scena: !!scena,
      traka: !!traka,
      modal: !!modal,
      osmica: !!document.querySelector("[data-testid=tok-radial]"),
      ulica: !!document.querySelector("[data-testid=kauba-ulica]"),
      karta: !!document.querySelector("[data-testid=kauba-dio-karta]"),
      mid: Math.round(window.innerHeight / 2),
    };
  });
  await page.screenshot({ path: "/workspace/screenshots/v98-kauba.png" });

  if (info.videoH < 200) fail.push(`video nizak ${info.videoH}`);
  if (info.scena) fail.push("jutro scena prekriva ulaz");
  if (info.modal) fail.push("modal-pozadina na kaubi");
  if (info.traka) fail.push("jutro traka na kaubi");
  if (info.osmica) fail.push("osmica prije holda");
  if (!info.ulica) fail.push("nema ulice");
  if (info.karta) fail.push("karta gumb još postoji");
  const ime = (info.prstenTxt || "").trim();
  if (ime) fail.push(`prsten nije prazan ${info.prstenTxt}`);
  if (info.prstenY < info.mid - 40) fail.push(`prsten nije dolje ${info.prstenY}`);
  if (info.dio !== "selo") fail.push(`dio ${info.dio}`);
  if (info.trg !== "1") fail.push(`trg ${info.trg}`);
  if (!info.imaSliku) fail.push("trg nema sliku ulice");
  if (!/ulica/i.test(info.ulicaSrc || "")) fail.push(`trg src ${info.ulicaSrc}`);

  if (!(await holdEl(page, "kauba-prsten"))) fail.push("nema prstena za hold");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(200);
  await page.screenshot({ path: "/workspace/screenshots/v98-osmica.png" });
  const holdInfo = await clipStavke(page);
  if (holdInfo.n < 8) fail.push(`osmica ${holdInfo.n}`);
  if (holdInfo.clipped.length) fail.push(`osmica clip ${holdInfo.clipped.join(",")}`);
  if (!holdInfo.stavke.some((s) => /Zabava/i.test(s ?? ""))) fail.push("nema zabave u osmici");

  await page.getByTestId("tok-precica-zabava").click({ force: true });
  await page.waitForTimeout(500);
  await page.getByTestId("kauba-dio").waitFor({ state: "visible", timeout: 3000 });
  await page.screenshot({ path: "/workspace/screenshots/v98-zabava-dio.png" });
  const zabava = await page.evaluate(() => {
    const dio = document.querySelector("[data-testid=kauba-dio]");
    const prsten = document.querySelector("[data-testid=kauba-prsten]");
    const pr = prsten?.getBoundingClientRect();
    const hit = pr
      ? document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2)
      : null;
    return {
      dio: dio?.getAttribute("data-dio"),
      naslov: document.querySelector(".kauba-dio-naslov")?.textContent?.trim() ?? "",
      osmica: !!document.querySelector("[data-testid=tok-radial]"),
      karta: !!document.querySelector("[data-testid=kauba-dio-karta]"),
      prstenVidi: hit ? !hit.closest("[data-testid=kauba-dio]") : false,
    };
  });
  if (zabava.dio !== "zabava") fail.push(`zabava dio ${zabava.dio}`);
  if (!/Zabava/i.test(zabava.naslov)) fail.push(`zabava naslov ${zabava.naslov}`);
  if (zabava.osmica) fail.push("osmica ostaje nakon odabira");
  if (zabava.prstenVidi) fail.push("prsten se vidi preko dijela");
  if (zabava.karta) fail.push("karta gumb na dijelu");

  if (!(await holdEl(page, "kauba-dio-drzi"))) fail.push("nema hero za hold");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(250);
  await page.screenshot({ path: "/workspace/screenshots/v98-zabava-hold.png" });
  const hubMeni = await clipStavke(page);
  if (!hubMeni.stavke.some((s) => /Salun|Casino|Kauboji|Kauba/i.test(s ?? ""))) {
    fail.push(`hub meni ${hubMeni.stavke.join(",")}`);
  }
  if (hubMeni.clipped.length) fail.push(`hold clip ${hubMeni.clipped.join(",")}`);
  const hubKauba = hubMeni.stavke.find((s) => /^Kauba/i.test(s ?? ""));
  if (!hubKauba) fail.push("nema Kauba u holdu dijela");
  if (!hubMeni.stavke.some((s) => /Kauboji/i.test(s ?? ""))) fail.push("nema Kauboji u holdu");
  if (!hubMeni.stavke.some((s) => /Almanah/i.test(s ?? ""))) fail.push("nema Almanah u holdu");
  if (hubMeni.stavke.some((s) => /\bTok\b/i.test(s ?? ""))) fail.push(`hub hold laže Tok ${hubMeni.stavke.join(",")}`);

  await page.getByTestId("tok-precica-almanah").click({ force: true });
  await page.waitForTimeout(400);
  await page.getByTestId("almanah-sloj").waitFor({ state: "visible", timeout: 3000 });
  await page.screenshot({ path: "/workspace/screenshots/v102-almanah.png" });
  const almanah = await page.evaluate(() => ({
    naslov: document.querySelector("[data-testid=almanah-sloj] h2")?.textContent?.trim() ?? "",
    veze: document.querySelectorAll("[data-testid=almanah-veza]").length,
    potrebe: document.querySelectorAll("[data-testid^=almanah-potreba-]").length,
  }));
  if (!/Almanah/i.test(almanah.naslov)) fail.push(`almanah naslov ${almanah.naslov}`);
  if (almanah.potrebe < 8) fail.push(`almanah potrebe ${almanah.potrebe}`);
  await page.getByTestId("almanah-zatvori").click({ force: true });
  await page.waitForTimeout(250);

  if (!(await holdEl(page, "kauba-dio-drzi"))) fail.push("nema hero za hold poslije almanaha");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(150);

  await page.getByTestId("tok-precica-ruke").click({ force: true });
  await page.waitForTimeout(450);
  await page.getByTestId("kauboji-mreza").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: "/workspace/screenshots/v99-kauboji.png" });
  const roster = await page.evaluate(() => {
    const mreza = document.querySelector("[data-testid=kauboji-mreza]");
    const style = mreza ? getComputedStyle(mreza) : null;
    return {
      dio: document.querySelector("[data-testid=kauba-dio]")?.getAttribute("data-dio"),
      naslov: document.querySelector(".kauba-dio-naslov")?.textContent?.trim() ?? "",
      rec: document.querySelector(".kauba-dio-rec")?.textContent?.trim() ?? "",
      cols: style?.gridTemplateColumns.split(" ").filter(Boolean).length ?? 0,
      kartice: document.querySelectorAll(".kauboj-kartica").length,
      avatari: document.querySelectorAll(".kauboji-mreza .kauba-chip-avatar").length,
      glava: document.querySelectorAll(".kauboj-glava").length,
      dupliNaslov: document.querySelectorAll(".kauboji-naslov").length,
    };
  });
  if (roster.dio !== "ruke") fail.push(`kauboji dio ${roster.dio}`);
  if (!/Kauboji/i.test(roster.naslov)) fail.push(`kauboji naslov ${roster.naslov}`);
  if (/Kauboji kaube/i.test(roster.rec)) fail.push("kauboji rec ostaje");
  if (roster.dupliNaslov) fail.push("kauboji naslov u mreži ostaje");
  if (roster.cols < 2) fail.push(`kauboji stupci ${roster.cols}`);
  if (roster.kartice < 4) fail.push(`kauboji kartice ${roster.kartice}`);
  if (roster.avatari < 4) fail.push(`kauboji avatari ${roster.avatari}`);

  await page.locator(".kauboj-glava").first().click({ force: true });
  await page.waitForTimeout(250);
  const otvoren = await page.evaluate(() => {
    const letEl = document.querySelector(".kauboj-kartica-otvoren .lik-let");
    const txt = letEl?.textContent ?? "";
    return {
      n: document.querySelectorAll(".kauboj-kartica-otvoren").length,
      letEl: !!letEl,
      imaLv: /lv\s*\d/i.test(txt),
      samoPreimenuj: /^Preimenuj$/i.test(txt.trim()),
    };
  });
  if (otvoren.n !== 1) fail.push(`kauboj otvoren ${otvoren.n}`);
  if (!otvoren.letEl) fail.push("nema lik-let na otvorenom");
  if (!otvoren.imaLv) fail.push("kauboj kartica nema ime/lv");
  if (otvoren.samoPreimenuj) fail.push("kauboj kartica kaže Preimenuj");
  await page.screenshot({ path: "/workspace/screenshots/v99-kauboji-otvoren.png" });

  if (!(await holdEl(page, "kauba-dio-drzi"))) fail.push("nema ruke hold");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(150);
  const rukeMeni = await clipStavke(page);
  if (!rukeMeni.stavke.some((s) => /^Kauba/i.test(s ?? ""))) fail.push(`ruke hold nema Kauba ${rukeMeni.stavke.join(",")}`);
  if (rukeMeni.stavke.some((s) => /Almanah|\bTok\b/i.test(s ?? ""))) fail.push(`ruke hold laže ${rukeMeni.stavke.join(",")}`);
  await zatvoriRadial(page);

  await page.locator("nav").getByLabel("Zid", { exact: true }).click({ force: true });
  await page.waitForTimeout(500);
  const naZidu = await page.evaluate(() => !!document.querySelector("[data-testid=kauba-dio]"));
  if (naZidu) fail.push("dio ostaje na zidu");
  await page.locator("nav").getByLabel("Kauba", { exact: true }).click({ force: true });
  await page.waitForTimeout(500);
  const natrag = await page.evaluate(() => ({
    dio: !!document.querySelector("[data-testid=kauba-dio]"),
    trg: document.querySelector("[data-testid=kauba-ulica]")?.getAttribute("data-trg"),
    karta: !!document.querySelector("[data-testid=kauba-dio-karta]"),
  }));
  if (natrag.dio) fail.push("dio ostaje nakon Kauba u navi");
  if (natrag.trg !== "1") fail.push(`nav kauba trg ${natrag.trg}`);
  await page.waitForTimeout(400);

  const navPrecice = {};
  for (const label of ["Igraj", "Zid", "Kauba", "Zadaci"]) {
    await holdNav(page, label);
    await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(150);
    const m = await clipStavke(page);
    navPrecice[label] = m;
    if (m.clipped.length) fail.push(`nav ${label} clip ${m.clipped.join(",")}`);
    if (label === "Kauba") {
      const sudar = await page.evaluate(() => {
        const luk = document.querySelector(".tok-radial-luk")?.getBoundingClientRect();
        const chip = document.querySelector("[data-testid=tok-precica-ruke]");
        if (!luk || !chip) return "nema";
        const dijelovi = [chip, chip.querySelector("span")].filter(Boolean);
        const sijece = (a, b) => !(a.right < b.left + 2 || a.left > b.right - 2 || a.bottom < b.top + 2 || a.top > b.bottom - 2);
        return dijelovi.some((el) => sijece(el.getBoundingClientRect(), luk)) ? "da" : "ne";
      });
      if (sudar !== "ne") fail.push(`kauboji na luku ${sudar}`);
    }
    await page.screenshot({ path: `/workspace/screenshots/v98-nav-${label.toLowerCase()}.png` });
    await zatvoriRadial(page);
  }
  if (!navPrecice.Igraj?.stavke.some((s) => /Kauba/i.test(s ?? ""))) fail.push("igraj hold nema Kauba");
  if (!navPrecice.Zid?.stavke.some((s) => /Kauba/i.test(s ?? ""))) fail.push("zid hold nema Kauba");
  const kaubaHold = navPrecice.Kauba?.stavke ?? [];
  if (!kaubaHold.some((s) => /Almanah/i.test(s ?? ""))) fail.push(`kauba hold nema Almanah ${kaubaHold.join(",")}`);
  if (!kaubaHold.some((s) => /Kauboji/i.test(s ?? ""))) fail.push(`kauba hold nema Kauboji ${kaubaHold.join(",")}`);
  if (!kaubaHold.some((s) => /Pohod/i.test(s ?? ""))) fail.push(`kauba hold nema Pohod ${kaubaHold.join(",")}`);
  if (kaubaHold.some((s) => /Trg|Igraj/i.test(s ?? ""))) fail.push(`kauba hold višak ${kaubaHold.join(",")}`);
  if (!navPrecice.Zadaci?.stavke.some((s) => /Kauba/i.test(s ?? ""))) fail.push("zadaci hold nema Kauba");

  let navRuke = false;
  for (let i = 0; i < 2 && !navRuke; i++) {
    await holdNav(page, "Kauba");
    navRuke = await page.getByTestId("tok-precica-ruke").waitFor({ state: "visible", timeout: 2500 }).then(() => true).catch(() => false);
  }
  if (!navRuke) fail.push("nav kauboji se ne otvara");
  else {
    await page.getByTestId("tok-precica-ruke").click({ force: true });
    await page.waitForTimeout(500);
    const izNavRuke = await page.evaluate(() => document.querySelector("[data-testid=kauba-dio]")?.getAttribute("data-dio") ?? "");
    if (izNavRuke !== "ruke") fail.push(`nav kauboji ${izNavRuke}`);
  }
  await page.locator("nav").getByLabel("Kauba", { exact: true }).click({ force: true });
  await page.waitForTimeout(500);
  await page.locator("[data-testid=kauba-dio]").waitFor({ state: "hidden", timeout: 2500 }).catch(() => {});
  await holdNav(page, "Kauba");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
  const almanahGumb = page.getByTestId("tok-precica-almanah");
  if ((await almanahGumb.count()) < 1) fail.push("nav almanah se ne otvara");
  else {
    await almanahGumb.click({ force: true });
    await page.waitForTimeout(400);
    const izNavAlmanah = await page.getByTestId("almanah-sloj").isVisible().catch(() => false);
    if (!izNavAlmanah) fail.push("nav almanah se ne otvara");
    await page.getByTestId("almanah-zatvori").click({ force: true }).catch(() => {});
  }

  await page.locator("nav").getByLabel("Igraj", { exact: true }).click({ force: true });
  await page.waitForTimeout(700);
  await holdNav(page, "Igraj");
  await page.getByTestId("tok-radial").waitFor({ state: "visible", timeout: 2500 }).catch(() => {});
  await page.getByTestId("tok-precica-kauba").click({ force: true });
  await page.waitForTimeout(600);
  const izIgraj = await page.evaluate(() => ({
    tab: document.querySelector("nav [aria-current=page]")?.getAttribute("aria-label") ?? "",
    dio: !!document.querySelector("[data-testid=kauba-dio]"),
    trg: document.querySelector("[data-testid=kauba-ulica]")?.getAttribute("data-trg"),
  }));
  if (izIgraj.tab !== "Kauba") fail.push(`igraj-kauba tab ${izIgraj.tab}`);
  if (izIgraj.dio) fail.push("igraj-hold Kauba ostavlja dio");
  if (izIgraj.trg !== "1") fail.push(`igraj-hold Kauba trg ${izIgraj.trg}`);

  await page.locator("nav").getByLabel("Igraj", { exact: true }).click({ force: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "/workspace/screenshots/v98-slot.png" });
  const slot = await page.evaluate(() => {
    const tocke = [...document.querySelectorAll(".pay-tocka")].map((el) => (el.textContent || "").trim());
    const linije = document.querySelector(".slot-metar-linije")?.textContent?.trim() ?? "";
    const okvir = document.querySelector(".slot-kolo-okvir");
    const tv = document.querySelector(".slot-tv");
    const traka = document.querySelector("[data-testid=slot-tv-traka]");
    const tipke = document.querySelectorAll("[data-testid=slot-tv-tipke] .slot-tv-tipka");
    const stol = document.querySelector(".slot-reel-stol");
    const first = document.querySelector(".pay-tocka")?.getBoundingClientRect();
    const cell = document.querySelector(".reel-cell")?.getBoundingClientRect();
    const overlap = first && cell ? first.right > cell.left + 4 : false;
    const trakaTxt = traka?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const cs = tv ? getComputedStyle(tv) : null;
    const skin = document.documentElement.dataset.skin ?? "";
    const panel = cs?.backgroundImage || cs?.backgroundColor || "";
    return {
      tocke,
      linije,
      imaOkvir: !!okvir,
      imaTv: !!tv,
      imaTraka: !!traka,
      trakaTxt,
      tipke: tipke.length,
      grid: stol ? getComputedStyle(stol).gridTemplateColumns : "",
      overlap,
      tab: document.querySelector("nav [aria-current=page]")?.getAttribute("aria-label") ?? "",
      padTop: cs ? parseFloat(cs.paddingTop) : 0,
      skin,
      panel,
      imaNiz: !!document.querySelector("[data-testid=slot-niz]"),
    };
  });
  if (slot.tab !== "Igraj") fail.push(`tab ${slot.tab}`);
  if (slot.linije !== "5") fail.push(`linije ${slot.linije}`);
  if (/2\s*·\s*4\s*·\s*1/.test(slot.trakaTxt || "")) fail.push(`traka 24153 ${slot.trakaTxt}`);
  const unique = [...new Set(slot.tocke)];
  if (unique.join("") !== "24153") fail.push(`tocke ${slot.tocke.join(",")}`);
  if (slot.overlap) fail.push("tocke preklapaju simbole");
  if (!slot.imaOkvir) fail.push("nema obruba slota");
  if (!slot.imaTv) fail.push("nema crt kućišta");
  if (slot.imaTraka) fail.push("zlatna traka ostaje");
  if (slot.imaNiz) fail.push("niz na praznom kolu");
  if (slot.tipke !== 4) fail.push(`tipke ${slot.tipke}`);

  await page.getByLabel("Izbornik").click({ force: true });
  await page.waitForTimeout(200);
  const karta = await page.locator(".karta-izbornik").innerText().catch(() => "");
  if (/Profil|Prijava/i.test(karta)) fail.push(`karta ima profil ${karta.replace(/\s+/g, " ")}`);
  await page.getByLabel("Izbornik").click({ force: true });

  await page.evaluate(async () => {
    const m = await import("/src/lib/stores/gameStore.ts");
    m.useGameStore.setState({ winStreak: 4 });
  });
  await page.locator(".slot-tv").waitFor({ state: "visible", timeout: 4000 });
  const nizTxt = (await page.getByTestId("slot-niz").textContent().catch(() => ""))?.replace(/\s+/g, " ").trim() ?? "";
  if (nizTxt !== "Niz ×1,4") fail.push(`niz natpis ${nizTxt}`);
  await page.screenshot({ path: "/workspace/screenshots/v105-niz.png" });
  await page.evaluate(async () => {
    const m = await import("/src/lib/stores/gameStore.ts");
    m.useGameStore.setState({ winStreak: 0 });
  });

  console.log(JSON.stringify({ info, holdInfo, zabava, hubMeni, almanah, roster, otvoren, natrag, navPrecice, izIgraj, slot }, null, 2));
  if (fail.length) {
    console.error("FAIL", fail.join("; "));
    process.exit(1);
  }
  console.log("OK 0.9.109");
} finally {
  await browser.close();
}
