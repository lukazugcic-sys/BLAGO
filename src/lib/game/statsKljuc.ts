import { createHash, timingSafeEqual } from "node:crypto";

/** Ako okolina nema ključ, server uspoređuje samo ovaj hash. Sam ključ nije u kodu. */
export const UGRADJENI_STATS_SHA256 = "ed8a0e0819239a2bc568b35ce739f87b4b43610084ba1e1cf804901e5e6e99b9";

function sha(s: string) {
  return createHash("sha256").update(s).digest();
}

function hexBuf(hex: string) {
  const cist = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(cist)) return null;
  return Buffer.from(cist, "hex");
}

export function statsKljucOdgovara(uneseni: string) {
  if (!uneseni) return false;
  const a = sha(uneseni);
  const izTeksta = process.env.BLAGO_STATS_KEY?.trim();
  const izHasha = process.env.BLAGO_STATS_KEY_SHA256?.trim();
  const b = izTeksta ? sha(izTeksta) : hexBuf(izHasha || "") ?? hexBuf(UGRADJENI_STATS_SHA256);
  if (!b || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
