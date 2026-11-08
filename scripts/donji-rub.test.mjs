import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { chromium } from "playwright";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("donji izbornik na 390 ne prekriva sadržaj, uz stvarni CSS i safe-area", async () => {
  const exe = "/opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell";
  assert.ok(existsSync(exe), "nema headless preglednika");
  const navSrc = readFileSync(new URL("../src/components/game/AppNav.tsx", import.meta.url), "utf8");
  const shellSrc = readFileSync(new URL("../src/components/game/GameApp.tsx", import.meta.url), "utf8");
  const pagerSrc = readFileSync(new URL("../src/components/game/ScreenPager.tsx", import.meta.url), "utf8");
  const navCls = navSrc.match(/<nav[\s\S]*?className="([^"]+)"/)?.[1];
  const shellCls = shellSrc.match(/className="(game-shell[^"]+)"/)?.[1];
  const pagerCls = pagerSrc.match(/className="(pager-scroller[^"]+)"/)?.[1];
  assert.ok(navCls && shellCls && pagerCls, "nema stvarnih klasa omotača");
  assert.match(navCls, /env\(safe-area-inset-bottom\)/);
  const stil = css.replace(/@import[^;]+;/g, "");
  assert.match(stil, /padding-bottom:max\(\.6rem, env\(safe-area-inset-bottom\)\)/);
  const browser = await chromium.launch({
    executablePath: exe,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${stil}</style></head><body style="margin:0">
      <div class="atmosphere fixed inset-0 flex flex-col overflow-hidden">
        <div class="${shellCls}">
          <div class="${pagerCls}" id="pager"><div id="kraj" style="height:100%"></div></div>
          <nav class="${navCls}" id="nav"><div style="height:44px"></div></nav>
        </div>
      </div></body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    const mjeri = () =>
      page.evaluate(() => {
        const nav = document.getElementById("nav").getBoundingClientRect();
        const pager = document.getElementById("pager").getBoundingClientRect();
        const kraj = document.getElementById("kraj").getBoundingClientRect();
        const pb = getComputedStyle(document.getElementById("nav")).paddingBottom;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return { overlap: pager.bottom - nav.top, kraj: kraj.bottom - nav.top, pb, navH: nav.height, rem };
      });
    const nula = await mjeri();
    assert.ok(nula.overlap <= 0.5, `preklop ${nula.overlap}`);
    assert.ok(nula.kraj <= 0.5, `kraj ${nula.kraj}`);
    assert.ok(Math.abs(parseFloat(nula.pb) - 0.6 * nula.rem) < 0.2, `padding ${nula.pb} nije 0.6rem`);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 34 } });
    const sa = await mjeri();
    assert.equal(sa.pb, "34px");
    assert.ok(sa.overlap <= 0.5, `safe preklop ${sa.overlap}`);
    assert.ok(sa.kraj <= 0.5, `safe kraj ${sa.kraj}`);
    assert.ok(sa.navH > nula.navH, "safe-area nije povisio izbornik");
  } finally {
    await browser.close();
  }
});
