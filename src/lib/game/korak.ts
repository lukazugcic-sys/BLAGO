import { odaberiSljedeciCilj } from "./sljedeciCilj";
import { kaubaOd, zgradaAkuzativ } from "./ljudi";
import type { Gradevine, Gradnja, Misija, Resursi } from "./types";
import type { GovedoDuznost, KaubaDuznost } from "./economy";

export type KorakPrikaz = {
  id: string;
  rec: string;
  vrsta: "preuzmi" | "nalog" | "zgrada";
  tip: string;
  zgrada: keyof Gradevine | "";
};

type Ulaz = {
  misije: Misija[];
  gradevine: Gradevine;
  zlato: number;
  resursi: Resursi;
  gradnje?: Gradnja[];
  prestigeRazina?: number;
  stanovnici: number;
  zamjenici?: { spreman?: boolean; hub?: string | null }[];
  konjiBroj?: number;
  konjiDuznost?: KaubaDuznost;
  sijenoDo?: number;
  potkoveDo?: number;
  kisaDo?: number;
  travaDo?: number;
  govedaBroj?: number;
  govedaDuznost?: GovedoDuznost;
  celijaBroj?: number;
  ljudi?: Array<{ hub?: string | null }>;
  segrti?: Array<{ hub?: string | null }>;
};

function kratko(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 46 ? `${t.slice(0, 44)}…` : t;
}

function veliko(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Jedan sljedeći korak: spreman nalog, pa zgrada koju može odmah, pa nalog, pa Almanah. */
export function odaberiKorak(s: Ulaz): KorakPrikaz | null {
  const spreman = s.misije.find((m) => m.trenutno >= m.cilj);
  if (spreman) {
    return {
      id: `preuzmi-${spreman.id}-${spreman.tip}`,
      rec: `Preuzmi: ${kratko(spreman.opis)}`,
      vrsta: "preuzmi",
      tip: "",
      zgrada: "",
    };
  }

  const usko = kaubaOd(s).usko;
  const cilj = odaberiSljedeciCilj({
    gradevine: s.gradevine,
    zlato: s.zlato,
    resursi: s.resursi,
    gradnje: s.gradnje,
    usko,
    prestigeRazina: s.prestigeRazina,
  });

  const zgradaKorak = (): KorakPrikaz | null => {
    if (!cilj) return null;
    const ime = veliko(zgradaAkuzativ(cilj.zgrada.id));
    const rec = cilj.uGradnji
      ? `Gradi se ${ime}`
      : cilj.lv <= 0
        ? `Izgradi ${ime}`
        : `Nadogradi ${ime} na razinu ${cilj.ciljLv}`;
    return {
      id: `zgrada-${cilj.zgrada.id}-${cilj.ciljLv}-${cilj.uGradnji ? "g" : "s"}`,
      rec,
      vrsta: "zgrada",
      tip: "",
      zgrada: cilj.zgrada.id,
    };
  };

  if (cilj && cilj.mozeKupiti && !cilj.uGradnji) return zgradaKorak();

  const nalog = [...s.misije].sort((a, b) => b.trenutno / Math.max(1, b.cilj) - a.trenutno / Math.max(1, a.cilj))[0];
  if (nalog) {
    return {
      id: `nalog-${nalog.id}-${nalog.tip}-${nalog.cilj}`,
      rec: `${kratko(nalog.opis)} · ${nalog.trenutno}/${nalog.cilj}`,
      vrsta: "nalog",
      tip: nalog.tip,
      zgrada: "",
    };
  }

  return zgradaKorak();
}
