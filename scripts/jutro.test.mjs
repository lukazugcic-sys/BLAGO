import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const parse = readFileSync(new URL("../src/lib/stores/gameParse.ts", import.meta.url), "utf8");
const dan = readFileSync(new URL("../src/lib/stores/sliceDan.ts", import.meta.url), "utf8");
assert.match(parse, /jutroList: false/);
assert.match(dan, /const novaZora = !!bilo && bilo !== dan/);
assert.match(dan, /jutroList: novaZora/);
assert.doesNotMatch(dan, /Keep sheet open so completion/);

const sheet = readFileSync(new URL("../src/components/game/JutroSheet.tsx", import.meta.url), "utf8");
assert.match(sheet, /jutro-scena/);
assert.match(sheet, /data-testid="jutro-scena"/);
assert.match(sheet, /jutro-scena-list/);
assert.match(sheet, /data-testid="jutro-traka"/);
assert.match(sheet, /Kauba ostaje iza/);
assert.doesNotMatch(sheet, /bg-void\/75/);

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.match(css, /\.jutro-scena/);
assert.match(css, /view-transition-name:\s*kauba-kadar/);
assert.doesNotMatch(css, /@keyframes kauboj-prasina/);
assert.doesNotMatch(css, /\.mreza-kauboj-slet/);
