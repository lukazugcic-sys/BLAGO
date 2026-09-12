import { useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { ZGRADA_ART } from "@/lib/game/art";
import { mozeKrupije } from "@/lib/game/ljudi";
import { playSfx, vibrate } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { FARO_MIN, FARO_ULOG, faroBankaDobit, faroDobitak, faroKrupijeBonus } from "@/lib/game/tuning";
import { UlogTraka } from "./UtrkaStaza";

const LICE: Array<{ znak: string; boja: string }> = [
  { znak: "A♠", boja: "#1a120c" },
  { znak: "9♥", boja: "#8a2030" },
  { znak: "4♣", boja: "#1a120c" },
];

export function IgraKarata() {
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const salun = useGameStore((s) => s.gradevine.salun || 0);
  const karteLv = useGameStore((s) => s.gradevine.karte || 0);
  const ljudi = useGameStore((s) => s.ljudi);
  const faroKrupije = useGameStore((s) => s.faroKrupije);
  const postaviKrupija = useGameStore((s) => s.postaviKrupija);
  const [uloga, setUloga] = useState<"igraj" | "banka">("igraj");
  const [mijesa, setMijesa] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [pobjeda, setPobjeda] = useState<boolean | null>(null);
  const [adut, setAdut] = useState(0);
  const [ulogRaw, setUlogRaw] = useState(FARO_ULOG);
  const krupije = ljudi.find((p) => p.id === faroKrupije && mozeKrupije(p)) ?? null;
  const kandidati = ljudi.filter(mozeKrupije);
  const maxUlog = Math.max(0, zlato);
  const ulog = Math.min(maxUlog, Math.max(pick === null && !mijesa ? FARO_MIN : 0, ulogRaw));
  const dobit = faroDobitak(ulog, karteLv);
  const bankaDobit = faroBankaDobit(ulog);
  const zakljucan = mijesa || pick !== null;

  const igraj = (i: number) => {
    if (mijesa || pick !== null) return;
    if (!jeSideOtkljucan(useGameStore.getState().gradevine)) {
      useGameStore.getState().setPoruka(SIDE_GATE_REC);
      return;
    }
    if (salun < 1) {
      useGameStore.getState().setPoruka("PRVO SALUN");
      return;
    }
    const u = Math.min(Math.floor(useGameStore.getState().zlato), Math.max(FARO_MIN, Math.floor(ulogRaw)));
    if (u < FARO_MIN) {
      useGameStore.getState().setPoruka("NEDOVOLJNO ZLATA");
      playSfx("skull");
      return;
    }
    const winAt = Math.floor(Math.random() * 3);
    const bonus = krupije ? faroKrupijeBonus(u) : 0;
    setUlogRaw(u);
    setMijesa(true);
    playSfx("spin");
    window.setTimeout(() => {
      setAdut(winAt);
      setPick(i);
      setMijesa(false);
      if (uloga === "banka") {
        const ok = i !== winAt;
        setPobjeda(ok);
        if (ok) {
          playSfx("win");
          vibrate(24);
          const dobitBanka = faroBankaDobit(u) + bonus;
          useGameStore.setState((s) => ({
            zlato: s.zlato + dobitBanka,
            poruka: krupije ? `BANKA +${dobitBanka}. ${krupije.ime} drži stol.` : `BANKA +${dobitBanka} ZLATA`,
          }));
          useGameStore.getState().azurirajMisiju("zlato", dobitBanka);
        } else {
          playSfx("skull");
          useGameStore.setState((s) => ({
            zlato: s.zlato - u,
            poruka: u >= Math.floor(s.zlato) ? "BANKA — sve je otišlo s asom." : "BANKA — gost je pogodio as.",
          }));
        }
        return;
      }
      const ok = i === winAt;
      setPobjeda(ok);
      if (ok) {
        playSfx("win");
        vibrate(24);
        const d = faroDobitak(u, karteLv);
        useGameStore.setState((s) => ({
          zlato: s.zlato - u + d + bonus,
          poruka: krupije ? `ASOVI +${d - u + bonus}. ${krupije.ime} dijeli.` : `ASOVI +${d - u} ZLATA`,
        }));
        useGameStore.getState().azurirajMisiju("zlato", d - u + bonus);
      } else {
        playSfx("skull");
        useGameStore.setState((s) => ({
          zlato: s.zlato - u,
          poruka: u >= Math.floor(s.zlato) ? "ASOVI — sve u prašinu." : "ASOVI — promašaj",
        }));
      }
    }, 720);
  };

  const opet = () => {
    setPick(null);
    setPobjeda(null);
  };

  return (
    <article className="mb-2.5 overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="relative h-20 overflow-hidden" aria-hidden>
        <img src={ZGRADA_ART.karte} alt="" className="size-full object-cover object-center" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="p-4 pt-2">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-gold uppercase">Asovi</h3>
            <p className="mt-0.5 text-xs font-semibold text-dim">
              {salun < 1
                ? "Otvori salun pa igraj."
                : uloga === "banka"
                  ? `Ti si banka. Gost vuče. Ulog ${ulog}, uzmeš ${bankaDobit} ako promaši.`
                  : `Pogodi as. Ulog ${ulog}, dobit ${dobit}. Sve ide, sve pada.`}
            </p>
          </div>
          {pick !== null && (
            <button type="button" onClick={opet} className="min-h-9 rounded-full bg-gold px-3 text-[11px] font-bold text-void">
              OPET
            </button>
          )}
        </div>
        <div className="mb-3 flex gap-1.5">
          {(["igraj", "banka"] as const).map((id) => (
            <button
              key={id}
              type="button"
              disabled={zakljucan}
              onClick={() => {
                playSfx("button");
                setUloga(id);
              }}
              className={cn(
                "min-h-9 flex-1 rounded-full text-[11px] font-bold tracking-wide uppercase",
                uloga === id ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
              )}
            >
              {id === "igraj" ? "Igraj" : "Banka"}
            </button>
          ))}
        </div>
        {kandidati.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-bold tracking-wide text-dim uppercase">Djelitelj</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => postaviKrupija(null)}
                className={cn(
                  "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                  !krupije ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
                )}
              >
                Nema
              </button>
              {kandidati.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => postaviKrupija(p.id)}
                  className={cn(
                    "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                    krupije?.id === p.id ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
                  )}
                >
                  {p.ime}
                </button>
              ))}
            </div>
          </div>
        )}
        {!zakljucan && salun >= 1 && (
          <div className="mb-3">
            <UlogTraka ulog={ulog} max={maxUlog} onUlog={setUlogRaw} />
          </div>
        )}
        {uloga === "banka" && pick === null && (
          <button
            type="button"
            disabled={mijesa || salun < 1 || ulog < FARO_MIN}
            onClick={() => igraj(Math.floor(Math.random() * 3))}
            className="mb-3 min-h-11 w-full rounded-xl bg-gold text-xs font-bold tracking-widest text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            Gost vuče · {ulog}g
          </button>
        )}
        <div className="faro-red flex justify-center gap-2">
          {[0, 1, 2].map((i) => {
            const otvorena = pick !== null;
            const dobitna = otvorena && i === adut;
            const lice = dobitna ? LICE[0]! : LICE[(i % 2) + 1]!;
            return (
              <button
                key={i}
                type="button"
                disabled={mijesa || pick !== null || salun < 1 || uloga === "banka" || ulog < FARO_MIN}
                onClick={() => igraj(i)}
                className={cn(
                  "faro-karta",
                  mijesa && "faro-mijesaj",
                  otvorena && "faro-otvorena",
                  otvorena && (dobitna ? "faro-adut" : "faro-prazna"),
                  pick === i && "faro-pick",
                )}
                style={{ animationDelay: `${i * 80}ms` }}
                aria-label={uloga === "banka" ? `Karta ${i + 1}` : `Karta ${i + 1}`}
              >
                <span className="faro-unutra">
                  <span className="faro-ledja">
                    <span className="faro-ledja-uzorak" />
                  </span>
                  <span className="faro-lice" style={{ color: lice.boja }}>
                    {lice.znak}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {uloga === "igraj" && pobjeda === true && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-xp">As. Pogađaš.</p>}
        {uloga === "igraj" && pobjeda === false && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-ruby">Nije as.</p>}
        {uloga === "banka" && pobjeda === true && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-xp">Gost promašio. Banka uzima.</p>}
        {uloga === "banka" && pobjeda === false && <p className="faro-pobjeda mt-3 text-center text-sm font-bold text-ruby">Gost pogodio. Plaćaš.</p>}
      </div>
    </article>
  );
}
