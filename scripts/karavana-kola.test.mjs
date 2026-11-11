// Caravan view uses the vector wagon (no photo, no frame).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { runInNewContext } from "node:vm";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("KaravanaIgra no longer renders the kola photo", () => {
  const s = read("src/components/game/KaravanaIgra.tsx");
  assert.ok(!s.includes("ART.kola"));
  assert.ok(!/<img[^>]*karavana-kola/.test(s));
  assert.equal((s.match(/<KaravanaKola /g) || []).length, 2);
});

test("KaravanaKola renders an SVG without any raster image and passes position through", () => {
  const js = ts.transpileModule(read("src/components/game/KaravanaKola.tsx"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  runInNewContext(js, { module, exports: module.exports, require: (n) => (n === "react/jsx-runtime" ? { jsx, jsxs: jsx } : {}) });
  const el = module.exports.KaravanaKola({ className: "karavana-kola-slika karavana-kola-svg", style: { left: "40%" } });
  assert.equal(el.type, "svg");
  assert.equal(el.props.style.left, "40%");
  const all = [];
  const walk = (n) => { if (!n || typeof n !== "object") return; if (Array.isArray(n)) return n.forEach(walk); all.push(n); walk(n.props?.children); };
  walk(el);
  assert.ok(!all.some((n) => n.type === "image" || n.type === "img" || n.type === "foreignObject"));
  assert.ok(!all.some((n) => n.type === "rect" && Number(n.props.width) >= 90), "no full-size background rect/frame");
});

test("vector wagon CSS removes the photo frame", () => {
  const css = read("src/styles.css");
  const m = css.match(/\.karavana-kola-slika\.karavana-kola-svg\{([^}]*)\}/);
  assert.ok(m);
  for (const d of ["border:0", "box-shadow:none", "border-radius:0"]) assert.ok(m[1].includes(d), d);
});

test("live map cart agent (KaubaHodaci .izo-kola-agent) uses the vector wagon, not the kola.webp photo", () => {
  const h = read("src/components/game/KaubaHodaci.tsx");
  const i = h.indexOf('className="izo-kola-agent"');
  assert.ok(i > 0);
  const blok = h.slice(i, h.indexOf("</span>", i));
  assert.ok(blok.includes("<KaravanaKola"), "cart agent must render KaravanaKola");
  const css = read("src/styles.css");
  assert.ok(!css.includes("/art/hub/kola.webp\")"), "no CSS background uses the kola photo");
  assert.ok(!/izo-kola-agent[^{]*\{[^}]*url\(/.test(css), "cart agent has no raster background");
});
