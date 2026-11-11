/**
 * 0.9.177 (t455u, t456u): iznos = broj + ikona resursa (ikona iza broja, visine ~1em, kao u traci).
 * Svi prikazi cijena/nagrada koriste ovo umjesto kratica (slovo „g" iza broja).
 */
import { Fragment, type CSSProperties } from "react";
import { artSrc } from "@/lib/game/art";
import { formatIznos, rastaviTekst, RESURSI, type ResursId } from "@/lib/game/resursi";
import { cn } from "@/lib/utils";

export function ResursIkona({ resurs, className }: { resurs: ResursId; className?: string }) {
  const r = RESURSI[resurs];
  if (!r.art) return <span className={cn("iznos-xp", className)}>XP</span>;
  // isti mali „žeton" kao u traci resursa (IconBadge .iko), samo visine ~1.15em
  return (
    <span
      className={cn("iko iznos-ikona", r.art.includes("gold") && "iko-gold", className)}
      style={{ ["--sym" as string]: r.boja } as CSSProperties}
      title={r.ime}
      aria-hidden
    >
      <img src={artSrc(r.art)} alt="" draggable={false} decoding="async" width={16} height={16} />
    </span>
  );
}

export function Iznos({
  resurs,
  kolicina,
  predznak = false,
  className,
  tekst,
}: {
  resurs: ResursId;
  kolicina: number;
  predznak?: boolean;
  className?: string;
  /** gotov zapis broja (npr. iz teksta) umjesto formatiranja */
  tekst?: string;
}) {
  const r = RESURSI[resurs];
  const broj = tekst ?? formatIznos(kolicina, predznak);
  return (
    <span className={cn("iznos", className)} data-resurs={resurs} aria-label={`${broj} ${r.gen}`}>
      <span className="iznos-broj" aria-hidden>
        {broj}
      </span>
      <ResursIkona resurs={resurs} />
    </span>
  );
}

/** Tekst u kojem se „8 zlata" / „+2 dijamanta" prikazuju kao broj + ikona. */
export function TekstResursa({ tekst }: { tekst: string | null | undefined }) {
  if (!tekst) return null;
  const d = rastaviTekst(tekst);
  if (d.length === 1 && typeof d[0] === "string") return <>{tekst}</>;
  return (
    <>
      {d.map((x, i) =>
        typeof x === "string" ? (
          <Fragment key={i}>{x}</Fragment>
        ) : (
          <Iznos key={i} resurs={x.resurs} kolicina={0} tekst={`${x.znak}${x.broj}`} />
        ),
      )}
    </>
  );
}
