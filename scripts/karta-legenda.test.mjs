// Regression: the map layer legend (Voda/Sreća/Rad) must stay a compact chip.
// Base .karta-legenda anchors bottom:8px; the later .ziva-izo .karta-legenda moved it
// to top:12px without clearing bottom, so the absolute chip stretched over the full
// map height (tall pill on the left, label centred halfway, covering map + controls).
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import postcss from "postcss";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8").replace(/@import[^;]+;/g, "");
const root = postcss.parse(css);

// Final value of each property for an element matching `.ziva-ulica.ziva-izo .karta-legenda`
// (only non-media rules; cascade = specificity, then source order).
function zavrsno(ciljevi) {
  const out = {};
  root.walkRules((r) => {
    if (r.parent?.type === "atrule") return;
    for (const sel of r.selectors) {
      const s = sel.trim();
      const spec = ciljevi[s];
      if (spec === undefined) continue;
      r.walkDecls((d) => {
        const prev = out[d.prop];
        const imp = d.important ? 1 : 0;
        if (!prev || imp > prev.imp || (imp === prev.imp && spec >= prev.spec)) out[d.prop] = { v: d.value.trim(), spec, imp };
      });
    }
  });
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.v]));
}

const LEG = { ".karta-legenda": 10, ".ziva-izo .karta-legenda": 20, ".ziva-ulica .karta-legenda": 20 };

test("legend is absolutely positioned on one vertical edge only (no top+bottom stretch)", () => {
  const f = zavrsno(LEG);
  assert.equal(f.position, "absolute");
  const top = f.top && f.top !== "auto";
  const bottom = f.bottom && f.bottom !== "auto";
  assert.ok(!(top && bottom), `legend has both top=${f.top} and bottom=${f.bottom}`);
  assert.ok(!f.height || f.height === "auto", `legend height ${f.height}`);
});

test("legend never anchors both left and right (no horizontal stretch)", () => {
  const f = zavrsno(LEG);
  const left = f.left && f.left !== "auto";
  const right = f.right && f.right !== "auto";
  assert.ok(!(left && right));
});

test("legend does not take pointer input (map and controls stay usable)", () => {
  assert.equal(zavrsno(LEG)["pointer-events"], "none");
});
