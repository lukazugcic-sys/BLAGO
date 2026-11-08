import { ZGRADE } from "./constants";
import { playSfx } from "./audio";
import { idi } from "./tokMeni";
import { otvoriCiljZgradu } from "./sljedeciCilj";
import type { Gradevine } from "./types";

const ZGRADA_ID = new Set<string>(ZGRADE.map((z) => z.id));

/** IDI s naloga — isto mjesto kao gumb na kartici. */
export function idiNaNalog(tip: string) {
  playSfx("button");
  const zgrada =
    tip === "govedo" ? "tor" : tip === "kisa" ? "cisterna" : tip === "utrka" ? "staza" : tip === "dvadesetjedan" ? "karte" : tip;
  if (ZGRADA_ID.has(zgrada)) {
    otvoriCiljZgradu(zgrada as keyof Gradevine);
    return;
  }
  if (tip === "oprema") {
    idi({ tab: "trznica", trznica: "alati" });
    return;
  }
  if (tip === "knjiga") {
    idi({ tab: "automat", slot: "bonus" });
    return;
  }
  if (tip === "ljudi" || tip === "zgrada") {
    idi({ tab: "selo" });
    return;
  }
  idi({ tab: "automat" });
}
