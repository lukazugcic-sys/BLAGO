import type { Dobitak } from "@/lib/game/types";

/** Presentational win tier only — never changes credits or timing. */
export type DobitakRazina = "mali" | "veliki" | "mega";

/**
 * Maps an already-credited win to a banner tier relative to the stake.
 * Thresholds are visual only; the credited amount is untouched.
 */
export function razinaDobitka(d: Pick<Dobitak, "zlato" | "dijamanti" | "linije">, ulog: number): DobitakRazina {
  const u = Math.max(1, ulog);
  const tezina = d.zlato / u + d.dijamanti * 4 + d.linije;
  if (tezina >= 20) return "mega";
  if (tezina >= 5) return "veliki";
  return "mali";
}

export function natpisRazina(r: DobitakRazina): string {
  return r === "mega" ? "MEGA DOBITAK" : r === "veliki" ? "VELIKI DOBITAK" : "DOBITAK";
}
