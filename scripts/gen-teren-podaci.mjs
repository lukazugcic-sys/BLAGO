// 0.9.176: peče pješačke staze (t443u), njihove mostiće i ukrase dvorišta (23/t436u/t439u)
// u src/lib/game/terenPodaci.ts. Pokreni nakon promjene parcela, puteljaka, potoka ili ukrasa:
//   node scripts/gen-teren-podaci.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { "@": ROOT + "src" } });
const pj = await jiti.import("../src/lib/game/pjesine.ts");
const dv = await jiti.import("../src/lib/game/dvorista.ts");
const staze = pj.izracunajPjesine();
const mostovi = pj.izracunajMostovePjesina(staze);
const dvor = dv.izracunajDvorista({ pj: staze, mo: mostovi });
const js = (v) => JSON.stringify(v);
const src = `// GENERIRANO: node scripts/gen-teren-podaci.mjs (0.9.176). Ne uređivati ručno.
// Pješačke staze naselja (t443u), njihovi mostići i ukrasi dvorišta (23, t436u, t439u).
// Test scripts/teren-176.test.mjs provjerava da je ovo jednako svježem izračunu.
export const PJESINE_PODACI: unknown[] = ${js(staze)};
export const MOSTOVI_PJESINA_PODACI: { x: number; y: number; kut: number }[] = ${js(mostovi)};
export const DVORISTA_PODACI: unknown = ${js(dvor)};
`;
writeFileSync(ROOT + "src/lib/game/terenPodaci.ts", src);
console.log(`staza ${staze.length}, mostića ${mostovi.length}, ukrasa ${dvor.ukrasi.length}, gazeno ${dvor.gazeno.length}, ${src.length} B`);
