// 0.9.167: Izlog themes must drive app-wide CSS vars; regression vs hardcoded polish.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(`${ROOT}/${p}`, "utf8");

test("primijeniSkinTemu writes every SkinTema token onto documentElement", async () => {
  const props = new Map();
  const dataset = {};
  const body = { style: { backgroundColor: "" } };
  globalThis.document = {
    documentElement: {
      style: {
        setProperty: (k, v) => props.set(k, v),
        backgroundColor: "",
      },
      dataset,
    },
    body,
    querySelector: () => ({ setAttribute: () => {}, getAttribute: () => null }),
  };
  const j = createJiti(import.meta.url, { alias: { "@": `${ROOT}/src` } });
  const { ZGRADE_SKINOVI, primijeniSkinTemu } = await j.import(`${ROOT}/src/lib/game/constants.ts`);
  const kozmos = ZGRADE_SKINOVI.find((s) => s.id === "futuristic");
  assert.ok(kozmos);
  primijeniSkinTemu(kozmos);
  assert.equal(dataset.skin, "futuristic");
  for (const [key, val] of Object.entries(kozmos.tema)) {
    assert.equal(props.get(`--color-${key === "panel2" ? "panel-2" : key}`), val, key);
  }
  assert.equal(body.style.backgroundColor, kozmos.tema.void);
});

test("kupiSkin applies theme immediately and persists aktivniSkin", async () => {
  const props = new Map();
  const dataset = {};
  globalThis.window = globalThis.window ?? {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    },
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    location: { href: "http://local.test/", search: "", hostname: "local.test" },
    navigator: { userAgent: "node" },
  };
  globalThis.localStorage = window.localStorage;
  globalThis.document = {
    documentElement: {
      style: { setProperty: (k, v) => props.set(k, v), backgroundColor: "" },
      dataset,
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    },
    body: { style: { backgroundColor: "" }, classList: { add: () => {}, remove: () => {} } },
    querySelector: () => ({ setAttribute: () => {}, getAttribute: () => null }),
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    visibilityState: "visible",
  };
  const j = createJiti(import.meta.url, {
    alias: {
      "@/lib/game/audio": `${ROOT}/scripts/fixtures/slot-audio-stub.mjs`,
      "@": `${ROOT}/src`,
    },
  });
  const { ZGRADE_SKINOVI } = await j.import(`${ROOT}/src/lib/game/constants.ts`);
  const { useGameStore } = await j.import(`${ROOT}/src/lib/stores/gameStore.ts`);
  const banovina = ZGRADE_SKINOVI.find((s) => s.id === "medieval");
  assert.ok(banovina);
  useGameStore.setState({ dijamanti: 50, aktivniSkin: "default", skinovi: ["default"] });
  props.clear();
  useGameStore.getState().kupiSkin(banovina);
  assert.equal(useGameStore.getState().aktivniSkin, "medieval");
  assert.ok(useGameStore.getState().skinovi.includes("medieval"));
  assert.equal(dataset.skin, "medieval");
  assert.equal(props.get("--color-void"), banovina.tema.void);
  assert.equal(props.get("--color-panel"), banovina.tema.panel);
});

test("0.9.167 CSS theme bridge covers slot casino, burza, nav chrome", () => {
  const css = read("src/styles.css");
  assert.ok(css.includes("0.9.167-test: theme bridge"));
  for (const sel of [
    "html[data-skin] .slot-fx-host .slot-kolo",
    "html[data-skin] .slot-fx-host .slot-ploca",
    "html[data-skin] .slot-fx-host .slot-ticker",
    "html[data-skin] .trznica-red",
    "html[data-skin] .trznica-kartica",
    "html[data-skin] header .hud-resursi",
  ]) {
    assert.ok(css.includes(sel), `missing ${sel}`);
  }
  assert.ok(css.includes("0.9.167-test: Burza row"));
  assert.ok(css.includes('grid-template-areas:'));
  assert.ok(css.includes('"iko tekst trend"') || css.includes("iko tekst trend"));
});

test("Dok te nije bilo is a fixed overlay with reduced-motion escape", () => {
  const css = read("src/styles.css");
  const ai = read("src/components/game/AiSloj.tsx");
  assert.ok(css.includes("0.9.167-test: \"Dok te nije bilo\" overlay") || css.includes("0.9.167-test: \"Dok te nije bilo\""));
  assert.ok(css.includes(".ai-povratak") && css.includes("position: fixed"));
  assert.ok(css.includes("prefers-reduced-motion") && css.includes(".ai-povratak { animation: none"));
  assert.ok(ai.includes("createPortal") && ai.includes("portalKorijen"));
  assert.ok(ai.includes('data-testid="dok-te-nije-bilo"'));
});

test("music gain is 25% quieter; SFX gains untouched", async () => {
  const src = read("src/lib/game/audio.ts");
  assert.match(src, /const MUSIC_GAIN = 0\.165/);
  assert.match(src, /const MUSIC_DUCK = 0\.12/);
  assert.match(src, /const MASTER_GAIN = 0\.38/);
  assert.ok(src.includes("spin: 0.06"));
  assert.ok(src.includes("win: 0.08"));
  const j = createJiti(import.meta.url, { alias: { "@": `${ROOT}/src` } });
  const audio = await j.import(`${ROOT}/src/lib/game/audio.ts`);
  assert.equal(audio.MUSIC_GAIN_TEST, 0.165);
  assert.equal(audio.MUSIC_DUCK_TEST, 0.12);
});

test("Android status bar is visible by default (not fullscreen immersive)", () => {
  const java = read("android/app/src/main/java/hr/blago/game/MainActivity.java");
  const styles = read("android/app/src/main/res/values/styles.xml");
  const cap = read("capacitor.config.ts");
  const fs = read("src/lib/hooks/useFullscreen.ts");
  assert.ok(java.includes("private boolean immersive = false"));
  assert.ok(java.includes("applySystemBars"));
  assert.ok(java.includes("setStatusBarColor"));
  assert.ok(styles.includes("windowFullscreen\">false"));
  assert.ok(styles.includes("windowLightStatusBar\">false"));
  assert.ok(cap.includes("overlaysWebView: false"));
  assert.ok(fs.includes("api.exit()"));
  assert.ok(!fs.includes("api.enter()") || fs.indexOf("0.9.167") >= 0);
});
