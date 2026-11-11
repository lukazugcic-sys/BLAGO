import { memo, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { IZO_DEKOR, SYMBOL_ART, artSrc, izoZgrada } from "@/lib/game/art";
import { ZGRADE } from "@/lib/game/constants";
import { playSfx, vibrate } from "@/lib/game/audio";
import {
  cetvrtNaziv,
  cetvrtPasa,
  cetvrtZgrade,
  rastSkala,
} from "@/lib/game/kartaPogled";
import {
  CELIJA_H,
  CELIJA_W,
  KOLAC_H,
  KOLAC_W,
  PARCELE,
  ZGRADA_H,
  ZGRADA_W,
  centarSpritea,
} from "@/lib/game/ulicaRaspored";
import type { Gradevine } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { TrakaGradnje } from "./KaubaSat";

const DVO_MS = 300;
const OTVORI_MS = 320;
const HOLD_MS = 450;

const ROBA: Record<string, { src: string; chip: string; naziv: string }> = {
  pilana: { src: SYMBOL_ART.wood, chip: ".chip-drvo", naziv: "Drvo" },
  kamenolom: { src: SYMBOL_ART.stone, chip: ".chip-kamen", naziv: "Kamen" },
  rudnik: { src: SYMBOL_ART.iron, chip: ".chip-zeljezo", naziv: "Željezo" },
};

const DIMLJIVE = new Set(["kuca", "pekara", "kovacnica", "banja", "mesnica", "tvornica"]);
const VECE = new Set(["rudnik", "kamenolom", "staja", "korali"]);

const STROP_LV: Record<string, number> = {};
for (const z of ZGRADE) STROP_LV[z.id] = z.maxLv;

type Tap = { id: string; t: number; timer: number };
type Hold = { timer: number };

export type KucaDodir = {
  gut: RefObject<number>;
  tap: RefObject<Tap | null>;
  centriraj: RefObject<() => void>;
  otvoreno: RefObject<number>;
  hold: RefObject<Hold | null>;
  izbornikU: RefObject<number>;
  vodic: (id: string) => void;
  odaberi: (id: string) => void;
  drzi: (id: string | null) => void;
  izbornik: (m: { id: keyof Gradevine; x: number; y: number }) => void;
};

export let kucaSlaganja = 0;

function odletiRobu(od: HTMLElement, src: string, chip: string) {
  const cilj = document.querySelector(chip);
  if (!cilj) return;
  const a = od.getBoundingClientRect();
  const b = cilj.getBoundingClientRect();
  const img = document.createElement("img");
  img.className = "izo-odlet";
  img.alt = "";
  img.src = src;
  const ax = a.left + a.width / 2 - 11;
  const ay = a.top + a.height / 2 - 11;
  img.style.left = `${ax}px`;
  img.style.top = `${ay}px`;
  document.body.appendChild(img);
  const dx = b.left + b.width / 2 - (ax + 11);
  const dy = b.top + b.height / 2 - (ay + 11);
  const anim = img.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.35)`, opacity: 0.15 },
    ],
    { duration: 380, easing: "ease-out", fill: "forwards" },
  );
  const gotovo = () => img.remove();
  anim.onfinish = gotovo;
  window.setTimeout(gotovo, 520);
}

function KaubaKuceUnutra({
  gradevine,
  gradnje,
  skok,
  otkljuc,
  birana,
  drzimId,
  dodir,
}: {
  gradevine: Gradevine;
  gradnje: { zgrada: string; start: number; kraj: number }[];
  skok: keyof Gradevine | null;
  otkljuc: string | null;
  birana: string | null;
  drzimId: string | null;
  dodir: KucaDodir;
}) {
  kucaSlaganja += 1;
  const dodirRef = useRef(dodir);
  dodirRef.current = dodir;

  const jedanDodir = (id: string) => (e: { stopPropagation: () => void }) => {
    const d = dodirRef.current;
    e.stopPropagation();
    const sad = performance.now();
    if (sad < d.gut.current) return;
    const pret = d.tap.current;
    if (pret && pret.id === id && sad - pret.t < DVO_MS) {
      window.clearTimeout(pret.timer);
      d.tap.current = null;
      d.gut.current = sad + 450;
      window.dispatchEvent(new CustomEvent("blago-karta-reset"));
      d.centriraj.current();
      return;
    }
    if (pret) window.clearTimeout(pret.timer);
    const timer = window.setTimeout(() => {
      const sad2 = dodirRef.current;
      sad2.tap.current = null;
      if (performance.now() < sad2.gut.current) return;
      sad2.otvoreno.current = performance.now();
      playSfx("button");
      sad2.odaberi(id);
    }, OTVORI_MS);
    d.tap.current = { id, t: sad, timer };
  };

  const naDrzi = (id: keyof Gradevine) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const d = dodirRef.current;
    if (d.hold.current) {
      window.clearTimeout(d.hold.current.timer);
      d.hold.current = null;
      d.drzi(null);
    }
    const el = e.currentTarget;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const timer = window.setTimeout(() => {
      const sadD = dodirRef.current;
      sadD.hold.current = null;
      sadD.drzi(null);
      const host = el.closest(".ziva-ulica")?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = host ? (r.left + r.right) / 2 - host.left : 8;
      const y = host ? (r.top + r.bottom) / 2 - host.top : 8;
      const sad = performance.now();
      sadD.gut.current = sad + 900;
      sadD.izbornikU.current = sad;
      if (sadD.tap.current) {
        window.clearTimeout(sadD.tap.current.timer);
        sadD.tap.current = null;
      }
      vibrate(10);
      playSfx("button");
      sadD.odaberi(id);
      sadD.izbornik({ id, x, y });
    }, HOLD_MS);
    d.hold.current = { timer };
    d.drzi(id);
    const naPomak = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) <= 16) return;
      const sadD = dodirRef.current;
      if (!sadD.hold.current) return;
      window.clearTimeout(sadD.hold.current.timer);
      sadD.hold.current = null;
      sadD.drzi(null);
    };
    const naKraj = () => {
      window.removeEventListener("pointermove", naPomak, true);
      window.removeEventListener("pointerup", naKraj, true);
      window.removeEventListener("pointercancel", naKraj, true);
      const sadD = dodirRef.current;
      if (!sadD.hold.current) return;
      window.clearTimeout(sadD.hold.current.timer);
      sadD.hold.current = null;
      sadD.drzi(null);
    };
    window.addEventListener("pointermove", naPomak, true);
    window.addEventListener("pointerup", naKraj, true);
    window.addEventListener("pointercancel", naKraj, true);
  };

  return (
    <>
      {PARCELE.map((z) => {
        const id = z.id as keyof Gradevine;
        const lv = gradevine[id] || 0;
        const ima = lv > 0;
        const posao = gradnje.find((g) => g.zgrada === id);
        const gradi = !!posao;
        const src = gradi ? IZO_DEKOR.skela : ima ? izoZgrada(z.id, lv) : "";
        const veca = VECE.has(z.id);
        const sirina = gradi || ima ? (veca ? 128 : ZGRADA_W) : veca ? 84 : KOLAC_W;
        const visina = gradi || ima ? (veca ? 110 : ZGRADA_H) : veca ? 74 : KOLAC_H;
        const c = centarSpritea(z, gradi ? "skela" : ima ? "zgrada" : "kolci");
        return (
          <button
            key={z.id}
            type="button"
            className={cn(
              "izo-kuca",
              ima && !gradi ? "is-ima" : "is-prazna",
              z.strana === "d" && "is-desno",
              skok === id && "is-skok",
              gradi && "is-gradi",
              otkljuc === z.id && "is-otkljuc",
              birana === z.id && "is-birana",
              drzimId === z.id && "is-drzim",
            )}
            data-stupanj={ima && !gradi ? (lv >= 3 ? "kat" : lv >= 2 ? "trijem" : "drvo") : undefined}
            style={{ left: c.x, top: c.y, zIndex: Math.round(c.y), ["--rast" as string]: rastSkala(ima && !gradi ? lv : 1) }}
            data-testid={`ulica-${z.id}`}
            data-izo={z.id}
            data-cetvrt={cetvrtZgrade(z.id)}
            aria-label={ima ? `${z.naziv}, razina ${lv}` : `${z.naziv}, ${cetvrtNaziv(z.id)}. Paše: ${cetvrtPasa(z.id)}`}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const d = dodirRef.current;
              if (d.tap.current) {
                window.clearTimeout(d.tap.current.timer);
                d.tap.current = null;
              }
              d.gut.current = performance.now() + 450;
              window.dispatchEvent(new CustomEvent("blago-karta-reset"));
              d.centriraj.current();
            }}
            onPointerDown={naDrzi(id)}
            onPointerUp={(e) => {
              if (e.button !== 0 && e.pointerType === "mouse") return;
              dodirRef.current.vodic(z.id);
            }}
            onClick={jedanDodir(z.id)}
          >
            <span className="izo-romb" style={{ width: CELIJA_W, height: CELIJA_H }} aria-hidden />
            <span className="izo-pogodak" style={{ width: CELIJA_W, height: CELIJA_H }} />
            {drzimId === z.id ? (
              <svg className="karta-prsten" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15" />
              </svg>
            ) : null}
            <span className="izo-skala" style={{ width: sirina, height: visina }}>
              <span className="izo-skok">
                <img className="izo-sjena-img" src={artSrc(IZO_DEKOR.sjena)} alt="" draggable={false} decoding="async" />
                {src ? (
                  <img
                    className="izo-tijelo"
                    src={artSrc(src)}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    width={sirina}
                    height={visina}
                  />
                ) : (
                  <i className="izo-kolac" aria-hidden />
                )}
                {ima && !gradi ? <span className="izo-prozor" aria-hidden /> : null}
                {DIMLJIVE.has(id) && ima && !gradi ? (
                  <span className="izo-dim" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
                {ima && !gradi && lv < (STROP_LV[id] ?? 99) ? <i className="izo-znak-gore" title="Nadogradnja" aria-hidden /> : null}
                {id === "mlin" && ima && !gradi ? <span className="izo-zastava" aria-hidden /> : null}
                {gradi || skok === id ? <span className="izo-prasina" aria-hidden /> : null}
              </span>
            </span>
            {gradi && posao ? (
              <span className="izo-gradiliste" aria-hidden>
                <i className="izo-daske" />
                <i className="izo-cekic" />
                <span className="izo-traka">
                  <TrakaGradnje start={posao.start} kraj={posao.kraj} />
                </span>
              </span>
            ) : null}
            {ima && !gradi && ROBA[z.id] ? (
              <span
                role="button"
                tabIndex={0}
                className="izo-roba"
                aria-label={`${ROBA[z.id]!.naziv} ide u zalihu`}
                onPointerDownCapture={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  odletiRobu(e.currentTarget, artSrc(ROBA[z.id]!.src), ROBA[z.id]!.chip);
                }}
              >
                <img src={artSrc(ROBA[z.id]!.src)} alt="" draggable={false} />
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

export const KaubaKuce = memo(KaubaKuceUnutra);
