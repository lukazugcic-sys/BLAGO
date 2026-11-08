#!/usr/bin/env node
/**
 * Napredni QA živog sela: ulica + prsten + osmica + overlay.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.QA_URL || "http://127.0.0.1:8080";
const outDir = "/workspace/screenshots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-webgpu"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(20000);

const konzola = [];
page.on("pageerror", (err) => konzola.push({ vrsta: "page", rec: String(err.message || err) }));
page.on("console", (msg) => {
  if (msg.type() === "error") konzola.push({ vrsta: "console", rec: msg.text() });
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const fail = [];
const biljezi = (uvjet, rec) => {
  if (!uvjet) fail.push(rec);
};

const dismiss = async () => {
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.locator("input").first().fill("Test").catch(() => {});
  await page.getByTestId("onboard-dalje").click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByTestId("onboard-igraj").click({ force: true, timeout: 2500 }).catch(() => {});
  await page.getByRole("button", { name: "Kasnije", exact: true }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /ostaje u Zadacima/i }).click({ force: true, timeout: 800 }).catch(() => {});
  await page.getByRole("button", { name: /Kreni/i }).click({ force: true, timeout: 400 }).catch(() => {});
};

const izvjestaj = {
  url,
  ariaPregled: "",
  pregled: {},
  hold: {},
  osmica: {},
  dio: {},
  overflow: false,
  cestice: null,
  konzola: [],
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Pokreni igru").click({ force: true });
  await page.waitForTimeout(400);
  await dismiss();
  await page.waitForTimeout(300);
  await page.getByTestId("kauba-ulica").waitFor({ state: "visible" });

  izvjestaj.overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  biljezi(!izvjestaj.overflow, "horizontalni overflow");

  izvjestaj.cestice = await page.locator("[data-testid=cestice-sloj]").getAttribute("data-backend").catch(() => null);

  izvjestaj.ariaPregled = await page.getByTestId("kauba-ulica").ariaSnapshot({
    boxes: true,
    timeout: 4000,
  });
  biljezi(/Drži za izbornik/i.test(izvjestaj.ariaPregled), "ARIA nema prsten");
  biljezi(!/\bTok\b/.test(izvjestaj.ariaPregled), "ARIA i dalje nudi Tok");

  izvjestaj.pregled = await page.evaluate(() => {
    const ulica = document.querySelector("[data-testid=kauba-ulica]");
    const prsten = document.querySelector("[data-testid=kauba-prsten]");
    const video = document.querySelector("[data-testid=mreza-video]");
    const scena = document.querySelector("[data-testid=jutro-scena]");
    const p = ulica?.getBoundingClientRect();
    const pr = prsten?.getBoundingClientRect();
    const scenaPokrije =
      scena && p
        ? (() => {
            const s = scena.getBoundingClientRect();
            const st = getComputedStyle(scena);
            if (st.display === "none" || Number(st.opacity) === 0) return false;
            const preklop = Math.max(0, Math.min(p.bottom, s.bottom) - Math.max(p.top, s.top));
            return preklop > p.height * 0.45;
          })()
        : false;
    return {
      trg: ulica?.getAttribute("data-trg"),
      dio: ulica?.getAttribute("data-dio"),
      imaSliku: !!video?.querySelector("img, video, .video-loop-sloj"),
      prstenTxt: (prsten?.textContent ?? "").trim(),
      prstenY: pr ? Math.round(pr.top) : 0,
      platnoH: p ? Math.round(p.height) : 0,
      scenaPokrije,
      tokGumb: !!document.querySelector("[data-testid=mreza-tok]"),
      overlay: !!document.querySelector("[data-testid=kauba-dio]"),
    };
  });
  biljezi(izvjestaj.pregled.trg === "1", `trg ${izvjestaj.pregled.trg}`);
  biljezi(izvjestaj.pregled.dio === "selo", `dio ${izvjestaj.pregled.dio}`);
  biljezi(izvjestaj.pregled.imaSliku, "trg nema sliku ulice");
  biljezi(!izvjestaj.pregled.prstenTxt, `prsten nije prazan ${izvjestaj.pregled.prstenTxt}`);
  biljezi(izvjestaj.pregled.platnoH >= 220, `pregled kadar nizak ${izvjestaj.pregled.platnoH}`);
  biljezi(!izvjestaj.pregled.scenaPokrije, "jutro prekriva kadar");
  biljezi(!izvjestaj.pregled.tokGumb, "gumb Tok se vratio");
  biljezi(!izvjestaj.pregled.overlay, "overlay na trgu");
  await page.screenshot({ path: `${outDir}/qa-napredni-pregled.png` });

  const box = await page.getByTestId("kauba-prsten").boundingBox();
  if (!box) throw new Error("nema prstena");
  const hx = box.x + box.width / 2;
  const hy = box.y + box.height / 2;
  await page.mouse.move(hx, hy);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const rano = {
    meni: await page.getByTestId("tok-radial").count(),
  };
  await page.mouse.up();
  await page.waitForTimeout(100);
  await page.mouse.move(hx, hy);
  await page.mouse.down();
  await page.waitForTimeout(850);
  const kasno = {
    meni: await page.getByTestId("tok-radial").count(),
  };
  izvjestaj.hold = { rano, kasno };
  biljezi(rano.meni === 0, "meni prerano");
  biljezi(kasno.meni >= 1, "nema osmice na hold");
  if (kasno.meni) {
    await page.screenshot({ path: `${outDir}/qa-napredni-hold.png` });
    izvjestaj.osmica = await page.evaluate(() => {
      const stavke = [...document.querySelectorAll("[data-testid^=tok-precica-]")].map((el) =>
        (el.textContent || "").trim(),
      );
      return { n: stavke.length, stavke };
    });
    biljezi(izvjestaj.osmica.n >= 8, `osmica ${izvjestaj.osmica.n}`);
    biljezi(izvjestaj.osmica.stavke.some((s) => /Zabava/i.test(s)), "nema zabave");
    biljezi(!izvjestaj.osmica.stavke.some((s) => /Almanah|\bTok\b/i.test(s)), "osmica laže Tok/Almanah");
    await page.getByTestId("tok-precica-zabava").click({ force: true });
    await page.waitForTimeout(500);
    await page.getByTestId("kauba-dio").waitFor({ state: "visible", timeout: 3000 });
    izvjestaj.dio = await page.evaluate(() => ({
      id: document.querySelector("[data-testid=kauba-dio]")?.getAttribute("data-dio") ?? "",
      naslov: document.querySelector(".kauba-dio-naslov")?.textContent?.trim() ?? "",
    }));
    biljezi(izvjestaj.dio.id === "zabava", `overlay ${izvjestaj.dio.id}`);
    biljezi(/Zabava/i.test(izvjestaj.dio.naslov), `naslov ${izvjestaj.dio.naslov}`);
    await page.screenshot({ path: `${outDir}/qa-napredni-dio.png` });
  } else {
    await page.mouse.up().catch(() => {});
  }

  const teske = konzola.filter((e) => !/AbortError|play\(\)|ResizeObserver|webkit-masked/i.test(e.rec));
  izvjestaj.konzola = teske;
  biljezi(teske.length === 0, `konzola ${teske.map((e) => e.rec).join(" | ")}`);
} catch (err) {
  fail.push(String(err?.message || err));
} finally {
  await context.tracing.stop({ path: `${outDir}/qa-napredni-trace.zip` }).catch(() => {});
  await browser.close();
}

izvjestaj.fail = fail;
writeFileSync(`${outDir}/qa-napredni.json`, JSON.stringify(izvjestaj, null, 2));
console.log(
  JSON.stringify(
    {
      ok: fail.length === 0,
      fail,
      pregled: izvjestaj.pregled,
      hold: izvjestaj.hold,
      osmica: izvjestaj.osmica,
      dio: izvjestaj.dio,
      overflow: izvjestaj.overflow,
      cestice: izvjestaj.cestice,
      konzola: izvjestaj.konzola,
      ariaPregledLen: izvjestaj.ariaPregled.length,
    },
    null,
    2,
  ),
);
if (fail.length) {
  console.error("FAIL", fail.join("; "));
  process.exit(1);
}
console.log("OK napredni QA");
