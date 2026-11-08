import { HOD } from "./pokret";

type Slijetanje = (t: number, skoro: boolean) => number;

const UZORCI = [0, 0.15, 0.4, 0.62, 0.78, 0.9, 1];

let slijetanje: Slijetanje = (t, skoro) => (skoro ? HOD.skoro(t) : HOD.udarac(t));

/** Pomak slijetanja. Wasm samo ako se broj poklopi s današnjom krivuljom. */
export function hodSlijetanje(t: number, skoro: boolean) {
  return slijetanje(Math.max(0, t), skoro);
}

function poklapa(raw: (t: number, skoro: number) => number) {
  for (const skoro of [0, 1]) {
    for (const t of UZORCI) {
      const ts = skoro ? HOD.skoro(t) : HOD.udarac(t);
      const wasm = raw(t, skoro);
      if (!Number.isFinite(wasm) || Math.abs(wasm - ts) > 1e-4) return false;
    }
  }
  return true;
}

export function ucitajHodJezgru() {
  if (typeof window === "undefined" || typeof WebAssembly === "undefined") return;
  void fetch("/hod.wasm")
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .then((buf) => (buf ? WebAssembly.instantiate(buf) : null))
    .then((mod) => {
      const fn = mod?.instance.exports.slijetanje;
      if (typeof fn !== "function") return;
      const raw = fn as (t: number, skoro: number) => number;
      if (!poklapa(raw)) return;
      slijetanje = (t, skoro) => raw(t, skoro ? 1 : 0);
    })
    .catch(() => {});
}
