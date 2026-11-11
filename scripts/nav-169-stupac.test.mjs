// 0.9.169: long-press nav-stupac clamp — lower half, on-screen at phone widths
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");
const jiti = () => createJiti(import.meta.url, { alias: { "@": `${ROOT}/src` } });

function assertOnScreen(box, vw, vh, safeTop = 0) {
  assert.ok(box.left >= 0, `left>=0 got ${box.left}`);
  assert.ok(box.width >= 0, `width>=0`);
  assert.ok(box.left + box.width <= vw + 0.01, `right edge ${box.left + box.width} <= ${vw}`);
  assert.ok(box.bottom >= 0, `bottom>=0`);
  assert.ok(box.maxHeight >= 0, `maxHeight>=0`);
  // sheet top = vh - bottom - maxHeight stays in lower half / below top safe
  const top = vh - box.bottom - box.maxHeight;
  assert.ok(top >= safeTop - 0.01, `sheet top ${top} >= safeTop ${safeTop}`);
  const mid = safeTop + (vh - safeTop) / 2;
  // with ≤50% usable height and bottom anchoring, top should not go above midline by much;
  // hard rule from product: maxHeight ≤ 50% usable
}

test("stezniNavStupacPoziciju keeps sheet on-screen at 320/360/390/412 and short/landscape", async () => {
  const j = jiti();
  const { stezniNavStupacPoziciju, navStupacPreferredWidth } = await j.import(
    `${ROOT}/src/lib/game/navStupac.ts`,
  );

  const widths = [320, 360, 390, 412];
  const heights = [568, 640, 720, 800, 844]; // short → tall phones
  const landscape = [
    { width: 568, height: 320 },
    { width: 640, height: 360 },
    { width: 844, height: 390 },
  ];

  for (const width of widths) {
    for (const height of heights) {
      for (const anchorX of [24, width * 0.12, width / 2, width * 0.88, width - 24]) {
        for (const tab of ["zid", "selo", "automat", "trznica"]) {
          const box = stezniNavStupacPoziciju({
            anchorX,
            viewport: { width, height, safeTop: 24, safeBottom: 0 },
            preferredWidth: navStupacPreferredWidth(tab, width),
            navStackHeight: 64 + 18, // nav + home indicator-ish
            gap: 8,
            margin: 8,
            maxHeightFraction: 0.5,
          });
          assertOnScreen(box, width, height, 24);
          const usable = height - 24;
          assert.ok(
            box.maxHeight <= usable * 0.5 + 0.01,
            `maxHeight ${box.maxHeight} ≤ 50% usable ${usable * 0.5} @${width}x${height}`,
          );
          // bottom-anchored above nav stack
          assert.ok(box.bottom >= 64, `bottom above nav @${width}`);
        }
      }
    }
  }

  for (const { width, height } of landscape) {
    const box = stezniNavStupacPoziciju({
      anchorX: 20,
      viewport: { width, height, safeTop: 12, safeBottom: 0 },
      preferredWidth: navStupacPreferredWidth("trznica", width),
      navStackHeight: 56,
      gap: 8,
      margin: 8,
      maxHeightFraction: 0.5,
    });
    assertOnScreen(box, width, height, 12);
    assert.ok(box.maxHeight <= (height - 12) * 0.5 + 0.01);
    assert.ok(box.left >= 8);
    assert.ok(box.left + box.width <= width - 8 + 0.01);
  }
});

test("edge anchors (Zid/Tržnica) never overflow horizontally", async () => {
  const j = jiti();
  const { stezniNavStupacPoziciju, navStupacPreferredWidth } = await j.import(
    `${ROOT}/src/lib/game/navStupac.ts`,
  );
  for (const width of [320, 360, 390, 412]) {
    const leftIcon = stezniNavStupacPoziciju({
      anchorX: 40,
      viewport: { width, height: 720 },
      preferredWidth: navStupacPreferredWidth("zid", width),
      navStackHeight: 80,
    });
    const rightIcon = stezniNavStupacPoziciju({
      anchorX: width - 40,
      viewport: { width, height: 720 },
      preferredWidth: navStupacPreferredWidth("trznica", width),
      navStackHeight: 80,
    });
    assert.equal(leftIcon.left, 8);
    assert.ok(rightIcon.left + rightIcon.width <= width - 8 + 0.01);
    assert.equal(Math.round(rightIcon.left + rightIcon.width), width - 8);
  }
});

test("AppNav uses clamped box (left/width/bottom/maxHeight), not translateX center hack", () => {
  const nav = read("src/components/game/AppNav.tsx");
  const css = read("src/styles.css");
  assert.ok(nav.includes("stezniNavStupacPoziciju"));
  assert.ok(nav.includes("meni.box.left"));
  assert.ok(nav.includes("meni.box.maxHeight"));
  assert.ok(!nav.includes("innerWidth - 86"));
  assert.ok(css.includes("0.9.169-test: long-press"));
  assert.ok(css.includes("overflow-y: auto"));
  // must not reintroduce centering transform on the sheet
  const idx = css.indexOf("0.9.169-test: long-press");
  const chunk = css.slice(idx, idx + 1800);
  assert.ok(chunk.includes("translate: none"));
  assert.ok(chunk.includes("transform: none"));
  assert.ok(!chunk.includes("translateX(-50%)"));
});
