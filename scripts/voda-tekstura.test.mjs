// Strukturni test kaskade (postcss parser + specifičnost), NE stvarni browser computed style.
// Razmatra samo nelayerirana pravila izvan @media/@supports, za selektore oblika ".ziva-izo .a(.b)*".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";

const CSS = process.env.VODA_CSS || new URL("../src/styles.css", import.meta.url).pathname;
const SRC = readFileSync(new URL("../src/components/game/KaubaCesta.tsx", import.meta.url), "utf8");

// Model: element unutar <g class="ziva-izo"> (dnevni prikaz, bez is-noc/is-agenti), bez @media.
const PREDAK = ["ziva-izo"];
function compound(c) { const m = /^((?:\.[\w-]+)+)$/.exec(c); return m ? m[1].slice(1).split(".") : null; }
function rules(css) {
  const out = []; let order = 0;
  postcss.parse(css).walkRules((r) => {
    let p = r.parent, nested = false;
    while (p && p.type !== "root") { if (p.type === "atrule") nested = true; p = p.parent; }
    const decls = {};
    r.walkDecls((d) => { decls[d.prop] = { value: d.value, important: d.important }; });
    for (const raw of r.selectors) {
      const parts = raw.trim().split(/\s+/);
      const subj = compound(parts.at(-1));
      const anc = parts.slice(0, -1).map(compound);
      const ok = subj && anc.length <= 1 && anc.every(Boolean);
      out.push({ sel: raw.trim(), nested, order: order++, ok, subj, anc: anc[0] || [],
        spec: (subj?.length || 0) + (anc[0]?.length || 0), decls });
    }
  });
  return out;
}
function effective(css, classes, attrs = {}) {
  const all = rules(css).filter((r) => !r.nested);
  const relevant = all.filter((r) => r.subj && r.subj.some((c) => classes.includes(c)));
  const unsupported = relevant.filter((r) => !r.ok && r.subj.every((c) => classes.includes(c)));
  const hits = relevant.filter((r) => r.ok && r.subj.every((c) => classes.includes(c)) && r.anc.every((c) => PREDAK.includes(c)));
  hits.sort((a, b) => a.spec - b.spec || a.order - b.order);
  const res = {}, imp = {};
  for (const h of hits) for (const [k, v] of Object.entries(h.decls)) {
    if (imp[k] && !v.important) continue;
    res[k] = v.value; imp[k] = v.important;
  }
  for (const [k, v] of Object.entries(attrs)) if (!(k in res)) res[k] = v; // presentation atribut gubi od svakog CSS-a
  return { res, unsupported, nestedHits: [] };
}

const css = readFileSync(CSS, "utf8");

test("JSX: glavni potok nosi teksturu kao presentation atribut, korito-kamen bez stare klase", () => {
  assert.match(SRC, /className="izo-potok" points=\{POTOK\} stroke="url\(#izo-voda-tk\)"/);
  assert.doesNotMatch(SRC, /className="izo-korito"/);
});

test("glavni potok: CSS ne pregazi stroke teksture, širina 16px", () => {
  const { res, unsupported, nestedHits } = effective(css, ["izo-potok"], { stroke: "url(#izo-voda-tk)" });
  assert.equal(unsupported.length, 0, "neobrađeni selektori: " + unsupported.map((u) => u.sel));
  assert.equal(nestedHits.filter((h) => "stroke" in h.decls).length, 0);
  assert.equal(res.stroke, "url(#izo-voda-tk)");
  assert.equal(res["stroke-width"], "16px");
});

test("jezero: fill ostaje tekstura", () => {
  assert.equal(effective(css, ["izo-lokva"]).res.fill, "url(#izo-voda-tk)");
});

test("is-dno zadržava 1.6px i boju (specifičnost 3 klase)", () => {
  const { res } = effective(css, ["izo-potok", "is-dno"]);
  assert.equal(res.stroke, "#14322ccc");
  assert.equal(res["stroke-width"], "1.6px");
});

test("obale netaknute", () => {
  const o = effective(css, ["izo-potok", "is-obala"]).res;
  assert.deepEqual([o.stroke, o["stroke-width"]], ["#6a5344aa", "24px"]);
  const r = effective(css, ["izo-potok", "is-rub"]).res;
  assert.deepEqual([r.stroke, r["stroke-width"]], ["#d7efe255", "16px"]);
});

test("korito-kamen bez stroke", () => {
  const k = effective(css, ["izo-korito-kamen"]).res;
  assert.equal(k.stroke, "none");
  assert.equal(k["stroke-width"], "0");
});
