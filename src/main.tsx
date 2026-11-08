import { pokreniNoviPrijeHidracije } from "@/lib/game/noviPrije";

/** true samo ako je ?novi=1 upravo obrisan. Vezano da bundler ne izbaci poziv. */
export const noviPrijeGotov = pokreniNoviPrijeHidracije();
