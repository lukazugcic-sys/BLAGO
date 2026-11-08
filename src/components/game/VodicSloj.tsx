import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "@/lib/stores/gameStore";
import { ZGRADE } from "@/lib/game/constants";
import {
  useVodic,
  vodicBubbleGotov,
  vodicDrvo,
  vodicDrziDokKucaRaste,
  vodicJosIde,
  vodicMeta,
  vodicOdrediste,
  vodicPostaviBravu,
  vodicPreskociKorak,
  vodicZatvoriFinale,
} from "@/lib/game/vodic";
import { jeSideOtkljucan } from "@/lib/game/sideGate";
import { smanjenPokret } from "@/lib/game/feel";
import { portalKorijen } from "@/lib/game/portal";
import { IDI_EVENT } from "@/lib/game/tokMeni";
import { rupaIzRect, VODIC_RUPA_PAD, type Rupa } from "@/lib/game/vodicRupa";
type Cekaj = { naziv: string; kraj: number; id: string };

function selektor(meta: string) {
  if (meta === "zavrti") return "[data-testid=zavrti]";
  if (meta === "drvo") return "[data-chip=drvo]";
  return `[data-vodic="${meta}"]`;
}

function jeUgasi(el: Element) {
  const b = el instanceof HTMLButtonElement ? el : el.closest("button");
  if (b instanceof HTMLButtonElement && b.disabled) return true;
  return (b ?? el).getAttribute("aria-disabled") === "true";
}

function naEkranu(sel: string) {
  const svi = document.querySelectorAll(sel);
  for (const el of svi) {
    const pane = el.closest(".pager-pane");
    if (pane?.getAttribute("aria-hidden") === "true") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < 4 || r.top > window.innerHeight - 4) continue;
    if (r.right < 4 || r.left > window.innerWidth - 4) continue;
    return el;
  }
  return null;
}

function ciljUPaneli(sel: string) {
  const svi = document.querySelectorAll(sel);
  for (const el of svi) {
    const pane = el.closest(".pager-pane");
    if (pane?.getAttribute("aria-hidden") === "true") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    return el;
  }
  return null;
}

type Rub = { vrh: number; dno: number; lijevo: number; desno: number };

function rubovi(): Rub {
  let vrh = 8;
  let dno = window.innerHeight - 8;
  const header = document.querySelector("header");
  if (header) {
    const r = header.getBoundingClientRect();
    if (r.height > 2) vrh = Math.max(vrh, r.bottom);
  }
  for (const el of [
    document.querySelector("[data-testid='sljedeci-korak']"),
    document.querySelector(".korak-red"),
    document.querySelector("nav"),
  ]) {
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.top < window.innerHeight * 0.35) continue;
    dno = Math.min(dno, r.top);
  }
  if (dno < vrh + 48) dno = window.innerHeight - 8;
  return { vrh, dno, lijevo: 8, desno: Math.max(16, window.innerWidth - 8) };
}

function skrolajUSigurno(el: Element) {
  const rub = rubovi();
  const margina = 12;
  let node: HTMLElement | null = el.parentElement;
  let dirao = false;
  while (node && node !== document.body) {
    const stil = getComputedStyle(node);
    const moze = /(auto|scroll)/.test(stil.overflowY) && node.scrollHeight > node.clientHeight + 8;
    if (moze) {
      const er = el.getBoundingClientRect();
      const nr = node.getBoundingClientRect();
      const vrh = Math.max(nr.top, rub.vrh) + margina;
      const dno = Math.min(nr.bottom, rub.dno) - margina;
      if (dno > vrh) {
        if (er.top < vrh) {
          node.scrollTop -= vrh - er.top;
          dirao = true;
        } else if (er.bottom > dno) {
          node.scrollTop += er.bottom - dno;
          dirao = true;
        }
      }
    }
    node = node.parentElement;
  }
  if (!dirao && !el.closest(".pager-scroller")) el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function rupaOd(el: Element, overlay: DOMRect | { left: number; top: number; right: number; bottom: number }): Rupa | null {
  return rupaIzRect(el.getBoundingClientRect(), overlay, VODIC_RUPA_PAD);
}

function istaRupa(a: Rupa | null, b: Rupa | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return Math.abs(a.l - b.l) < 1 && Math.abs(a.t - b.t) < 1 && Math.abs(a.r - b.r) < 1 && Math.abs(a.b - b.b) < 1;
}

function kartaJeOtvorena() {
  const ulica = document.querySelector('.pager-pane[aria-hidden="false"] [data-testid="kauba-ulica"][data-trg="1"]');
  if (!ulica) return false;
  const skrol = ulica.closest(".kauba-skrol");
  if (skrol?.querySelector("[data-testid=kauba-dio], .kauba-natrag")) return false;
  return true;
}

let kartaRucnoDo = 0;
let postavkeDo = 0;
if (typeof window !== "undefined") {
  window.addEventListener("blago-karta-rucno", () => {
    kartaRucnoDo = performance.now() + 15000;
  });
  window.addEventListener("blago-postavke", () => {
    postavkeDo = performance.now() + 4000;
  });
}

function postavkeMiruju() {
  const gumb = document.querySelector('header button[aria-label="Izbornik"]');
  if (gumb?.getAttribute("aria-expanded") === "true") return true;
  return performance.now() < postavkeDo;
}

function pokazivac(meta: string, korak: string): Element | null {
  const sel = meta ? selektor(meta) : "";
  const na = sel ? naEkranu(sel) : null;
  if (na && !jeUgasi(na)) return na;
  const od = vodicOdrediste(korak as Parameters<typeof vodicOdrediste>[0]);
  if (!od?.tab) return na;
  const pane = document.querySelector('.pager-pane[aria-hidden="false"]');
  if (pane?.getAttribute("data-tab") === od.tab) return na;
  return document.querySelector(`[data-vodic-tab="${od.tab}"]`) ?? na;
}

function mmss(kraj: number, sad: number) {
  const sec = Math.max(0, Math.ceil((kraj - sad) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function cekajOd(meta: string): Cekaj {
  const lista = useGameStore.getState().gradnje;
  const g = lista.find((x) => x.zgrada === meta) ?? [...lista].sort((a, b) => a.kraj - b.kraj)[0];
  if (!g) return { naziv: "", kraj: 0, id: "" };
  const naziv = ZGRADE.find((z) => z.id === g.zgrada)?.naziv ?? "zgrada";
  return { naziv, kraj: g.kraj, id: g.zgrada };
}

function istiCekaj(a: Cekaj | null, b: Cekaj | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.kraj === b.kraj && a.naziv === b.naziv;
}

/** Samo za vrijeme vodiča: ista nagrada kao da je vrijeme isteklo, bez dodatnog zlata. */
function ubrzaj(id: string) {
  if (!vodicJosIde()) return;
  const s = useGameStore.getState();
  const g = s.gradnje.find((x) => x.zgrada === id) ?? [...s.gradnje].sort((a, b) => a.kraj - b.kraj)[0];
  if (!g) return;
  const t = Date.now() - 1;
  useGameStore.setState({
    gradnje: s.gradnje.map((x) => (x.zgrada === g.zgrada && x.start === g.start ? { ...x, kraj: t } : x)),
  });
  useGameStore.getState().zavrsiGradnju();
}

export function VodicSloj() {
  const v = useVodic();
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const kuca = useGameStore((s) => s.gradevine.kuca || 0);
  const bunar = useGameStore((s) => s.gradevine.bunar || 0);
  const gradnje = useGameStore((s) => s.gradnje);
  const [rupa, setRupa] = useState<Rupa | null>(null);
  const [cekaj, setCekaj] = useState<Cekaj | null>(null);
  const [sad, setSad] = useState(() => Date.now());
  const slojRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vodicPostaviBravu((tab) => {
      if (tab !== "trznica") return true;
      if (jeSideOtkljucan(useGameStore.getState().gradevine)) return true;
      useGameStore.getState().setPoruka("Prvo pričekaj da se Kuća dovrši.");
      return false;
    });
    return () => vodicPostaviBravu(() => true);
  }, []);

  useEffect(() => {
    if (v.korak === "proizvod") vodicDrvo(drvo);
  }, [v.korak, drvo]);

  useEffect(() => {
    setRupa(null);
    setCekaj(null);
    if (!v.prikaz || !v.traka) return;
    const meta = vodicMeta();
    let zivi = true;
    let zadnjiSkrol = 0;
    let raf = 0;
    let kasni: number[] = [];
    const mjeri = () => {
      if (!zivi) return;
      setSad(Date.now());
      const sel = meta ? selektor(meta) : "";
      const pravi = sel ? naEkranu(sel) ?? ciljUPaneli(sel) : null;
      const ugasen = !!(pravi && jeUgasi(pravi));
      const el = pravi && !ugasen ? pravi : pokazivac(meta, v.korak);
      if (!el || ugasen || el.getBoundingClientRect().width < 2) {
        setRupa(null);
      } else {
        const rub = rubovi();
        const r = el.getBoundingClientRect();
        const izvan = r.bottom > rub.dno + 1 || r.top < rub.vrh - 1 || r.right < 0 || r.left > window.innerWidth;
        const naNavigaciji = el.hasAttribute("data-vodic-tab");
        const sadMs = performance.now();
        if (izvan && !naNavigaciji && sadMs - zadnjiSkrol > 650) {
          zadnjiSkrol = sadMs;
          skrolajUSigurno(el);
          setRupa(null);
        } else {
          const sloj = slojRef.current;
          const overlay = sloj
            ? sloj.getBoundingClientRect()
            : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
          const sljedeca = rupaOd(el, overlay);
          setRupa((prev) => (istaRupa(prev, sljedeca) ? prev : sljedeca));
        }
      }
      const next = ugasen ? cekajOd(meta) : null;
      setCekaj((prev) => (istiCekaj(prev, next) ? prev : next));
    };
    const zakazi = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (zivi) mjeri();
      });
    };
    const kasnije = () => {
      for (const id of kasni) window.clearTimeout(id);
      kasni = [50, 280, 700].map((ms) => window.setTimeout(zakazi, ms));
    };
    const ro = new ResizeObserver(zakazi);
    const prati = () => {
      ro.disconnect();
      ro.observe(document.documentElement);
      const el = meta ? naEkranu(selektor(meta)) ?? ciljUPaneli(selektor(meta)) : null;
      if (el) ro.observe(el);
      if (slojRef.current) ro.observe(slojRef.current);
    };
    prati();
    mjeri();
    kasnije();
    window.addEventListener("resize", zakazi);
    window.addEventListener("scroll", zakazi, true);
    window.addEventListener("transitionend", zakazi, true);
    window.addEventListener("animationend", zakazi, true);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", zakazi);
    vv?.addEventListener("scroll", zakazi);
    const naIdi = () => {
      zadnjiSkrol = 0;
      zakazi();
      kasnije();
    };
    window.addEventListener(IDI_EVENT, naIdi);
    const id = window.setInterval(() => {
      prati();
      mjeri();
    }, 400);
    return () => {
      zivi = false;
      if (raf) cancelAnimationFrame(raf);
      for (const t of kasni) window.clearTimeout(t);
      ro.disconnect();
      window.clearInterval(id);
      window.removeEventListener("resize", zakazi);
      window.removeEventListener("scroll", zakazi, true);
      window.removeEventListener("transitionend", zakazi, true);
      window.removeEventListener("animationend", zakazi, true);
      vv?.removeEventListener("resize", zakazi);
      vv?.removeEventListener("scroll", zakazi);
      window.removeEventListener(IDI_EVENT, naIdi);
      setRupa(null);
      setCekaj(null);
    };
  }, [v.prikaz, v.traka, v.korak, gradnje]);

  useEffect(() => {
    if (!v.prikaz || !v.traka) return;
    const meta = vodicMeta();
    if (!meta) {
      vodicPreskociKorak();
      return;
    }
    let cek = 0;
    let kostur = 0;
    const id = window.setInterval(() => {
      const sel = selektor(meta);
      const el = naEkranu(sel);
      if (el && !jeUgasi(el)) {
        cek = 0;
        kostur = 0;
        return;
      }
      if (postavkeMiruju()) {
        cek = 0;
        return;
      }
      if (el && jeUgasi(el)) {
        cek = 0;
        kostur = 0;
        return;
      }
      const kucaIde = useGameStore.getState().gradnje.some((g) => g.zgrada === "kuca");
      const drzi = kucaIde && vodicDrziDokKucaRaste(v.korak);
      const kucaLv = useGameStore.getState().gradevine.kuca || 0;
      const drziKarta =
        (kartaJeOtvorena() && (v.korak === "kuca" || v.korak === "zgrada" || performance.now() < kartaRucnoDo)) ||
        (v.korak === "burza" && kucaLv < 1);
      if (drziKarta || drzi || document.querySelector(sel) || vodicOdrediste(v.korak)) {
        cek = 0;
        return;
      }
      if (document.querySelector('.pager-pane[aria-hidden="false"] .tab-kostur')) {
        kostur += 1;
        if (kostur < 40) return;
      }
      cek += 1;
      if (cek >= 12) vodicPreskociKorak();
    }, 400);
    return () => window.clearInterval(id);
  }, [v.prikaz, v.traka, v.korak]);

  const tijelo = (
    <>
      {v.traka && !cekaj && (
        <div className="vodic-sloj" ref={slojRef} aria-hidden>
          {rupa && (
            <>
              <div
                className="vodic-tamno"
                style={{
                  clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rupa.l}px ${rupa.t}px, ${rupa.r}px ${rupa.t}px, ${rupa.r}px ${rupa.b}px, ${rupa.l}px ${rupa.b}px, ${rupa.l}px ${rupa.t}px)`,
                }}
              />
              <span
                className="vodic-strelica"
                style={{ left: (rupa.l + rupa.r) / 2, top: Math.max(8, rupa.t - 28) }}
              />
            </>
          )}
        </div>
      )}
      {v.traka && cekaj && (
        <div className="vodic-cekaj" role="status">
          <p>
            {cekaj.naziv
              ? `Pričekaj da se ${cekaj.naziv} dovrši (${mmss(cekaj.kraj, sad)})`
              : "Pričekaj da gumb postane aktivan."}
          </p>
          {cekaj.naziv ? (
            <button type="button" onClick={() => ubrzaj(cekaj.id)}>
              Ubrzaj
            </button>
          ) : null}
        </div>
      )}
      {v.bubble && (
        <div className="vodic-bubble" role="status">
          <p>{v.bubble}</p>
          <button type="button" onClick={vodicBubbleGotov}>
            Dobro
          </button>
        </div>
      )}
      {v.finale && (
        <div className="modal-pozadina fixed inset-0 z-[85] flex items-end justify-center bg-void/80 p-4 sm:items-center">
          {!smanjenPokret() && (
            <div className="vodic-konfeti" aria-hidden>
              {Array.from({ length: 18 }, (_, i) => (
                <i key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i % 6) * 80}ms` }} />
              ))}
            </div>
          )}
          <div className="modal-ulaz relative z-[1] w-full max-w-sm rounded-3xl border border-gold/50 bg-panel p-5">
            <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">Kraj uvoda</p>
            <h2 className="mt-1 font-display text-3xl text-gold">Kauba je rođena</h2>
            <p className="mt-2 text-sm font-bold text-ink/85">
              Kuća {kuca > 0 ? "stoji" : "se diže"}. Bunar {bunar > 0 ? "radi" : "je naručen"}. U džepu je {zlato} zlata.
            </p>
            <p className="mt-2 text-sm font-bold text-ink/70">Čeka te dnevna nagrada.</p>
            <button
              type="button"
              onClick={vodicZatvoriFinale}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.18em] text-void uppercase"
            >
              U kaubu
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (typeof document === "undefined") return null;
  if (!v.prikaz || (!v.traka && !v.bubble && !v.finale)) return null;
  return createPortal(tijelo, portalKorijen());
}