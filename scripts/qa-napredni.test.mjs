import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./qa-napredni.mjs", import.meta.url), "utf8");
assert.match(src, /tracing\.start/);
assert.match(src, /snapshots: true/);
assert.match(src, /ariaSnapshot/);
assert.match(src, /boxes: true/);
assert.match(src, /kauba-ulica/);
assert.match(src, /kauba-prsten/);
assert.match(src, /tok-radial/);
assert.match(src, /scenaPokrije/);
assert.match(src, /scrollWidth/);
assert.match(src, /tok-precica-zabava/);
assert.doesNotMatch(src, /getByTestId\("mreza-tok"\)/);
assert.doesNotMatch(src, /mreza-platno/);
console.log("OK qa-napredni");
