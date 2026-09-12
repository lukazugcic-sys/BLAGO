import { useLive } from "@/lib/multiplayer";
import { playSfx } from "@/lib/game/audio";
import { SYMBOL_ART } from "@/lib/game/art";

export function PohodPozivToast() {
  const live = useLive();
  const p = live.pohod;
  const posjet = live.posjet;
  const trojac = live.trojac;

  if (p && p.uloga === "branitelj" && p.faza === "poziv") {
    return (
      <div className="pohod-poziv-toast" role="alertdialog" aria-label="Pohod">
        <img src={SYMBOL_ART.skull} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.2em] text-ruby uppercase">Pohod</span>
          <span className="block text-sm font-bold text-ink">{p.ime} juriša na ostavu.</span>
          <span className="block text-[11px] font-bold text-dim">Stani na ulicu ili pusti šerifa.</span>
        </span>
        <span className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              playSfx("attack");
              live.prihvatiPohod();
            }}
            className="min-h-9 rounded-lg bg-ruby px-2.5 text-[10px] font-bold tracking-wide text-ink uppercase"
          >
            Stani
          </button>
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              live.pustiSerifa();
            }}
            className="min-h-9 rounded-lg border border-line bg-panel-2 px-2.5 text-[10px] font-bold text-ink uppercase"
          >
            Šerif
          </button>
        </span>
      </div>
    );
  }

  if (trojac && trojac.uloga === "saveznik" && trojac.faza === "poziv") {
    return (
      <div className="pohod-poziv-toast pohod-poziv-toast-gold" role="alertdialog" aria-label="Jato">
        <img src={SYMBOL_ART.skull} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Jato</span>
          <span className="block text-sm font-bold text-ink">{trojac.ime} zove na {trojac.meta.ime}.</span>
          <span className="block text-[11px] font-bold text-dim">
            Ti, on, šerif {trojac.meta.serif}. Zadnji žeton nosi sve.
          </span>
        </span>
        <span className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              playSfx("attack");
              live.prihvatiTrojac();
            }}
            className="min-h-9 rounded-lg bg-gold px-2.5 text-[10px] font-bold tracking-wide text-void uppercase"
          >
            Jaši
          </button>
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              live.odbijTrojac();
            }}
            className="min-h-9 rounded-lg border border-line bg-panel-2 px-2.5 text-[10px] font-bold text-ink uppercase"
          >
            Ne
          </button>
        </span>
      </div>
    );
  }

  if (posjet && posjet.uloga === "domacin" && posjet.faza === "poziv") {
    return (
      <div className="pohod-poziv-toast pohod-poziv-toast-gold" role="alertdialog" aria-label="Posjet">
        <img src={SYMBOL_ART.gold} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Posjet</span>
          <span className="block text-sm font-bold text-ink">{posjet.ime} jaše u tabor.</span>
          <span className="block text-[11px] font-bold text-dim">Pusti ga na ulicu ili zatvori kapiju.</span>
        </span>
        <span className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              playSfx("collect");
              live.prihvatiPosjet();
            }}
            className="min-h-9 rounded-lg bg-gold px-2.5 text-[10px] font-bold tracking-wide text-void uppercase"
          >
            Pusti
          </button>
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              live.odbijPosjet();
            }}
            className="min-h-9 rounded-lg border border-line bg-panel-2 px-2.5 text-[10px] font-bold text-ink uppercase"
          >
            Kapija
          </button>
        </span>
      </div>
    );
  }

  return null;
}
