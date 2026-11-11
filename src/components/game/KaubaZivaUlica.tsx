import { Droplet, Hammer, Layers, Smile, Workflow } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { IZO_DEKOR, artSrc } from "@/lib/game/art";
import { pjesine } from "@/lib/game/pjesine";
import { smanjenPokret } from "@/lib/game/feel";
import { vidljiviInterval } from "@/lib/game/helpers";
import { kameraSeMakla } from "@/lib/game/kartaPetlja";
import { zgradaUvjet } from "@/lib/game/economy";
import {
  brojSloja,
  cetvrtNaziv,
  detaljOdZooma,
  detaljStabilan,
  ogradeRanca,
  stazeKretanja,
  type Detalj,
  type Sloj,
} from "@/lib/game/kartaPogled";
import { otvoriCiljZgradu } from "@/lib/game/sljedeciCilj";
import {
  DEKOR,
  PARCELE,
  SVIJET,
  centarSpritea,
  kameraPogleda,
  okvirNaselja,
  putelji,
} from "@/lib/game/ulicaRaspored";
import { NASELJA, natpisNaselja } from "@/lib/game/teren";
import { playSfx } from "@/lib/game/audio";
import { idi } from "@/lib/game/tokMeni";
import { Obzor, NASELJE, OBZOR } from "@/components/game/KaubaObzor";
import { KaubaCesta } from "@/components/game/KaubaCesta";
import { KaubaTrgVoda } from "@/components/game/KaubaDvorista";
import { KaubaBroj } from "@/components/game/KaubaBroj";
import { KaubaHodaci } from "@/components/game/KaubaHodaci";
import { stokaNaKarti } from "@/lib/game/stokaKarta";
import { KaubaKuce, type KucaDodir } from "@/components/game/KaubaKuce";
import { RokGradnje } from "@/components/game/KaubaSat";
import { vodicJosIde, vodicSnapshot } from "@/lib/game/vodic";
import type { Gradevine } from "@/lib/game/types";
import { useGameStore } from "@/lib/stores/gameStore";
import { cn } from "@/lib/utils";
import { KartaIzbornik } from "./KartaIzbornik";
import { AiOznaka } from "./AiSloj";
import { MrezaSela } from "./MrezaSela";

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;
const ZOOM_ODMAK = Math.min(ZOOM_MIN, 0.22);
const TAP_PX = 8;
const VUC_PX = Math.min(6, TAP_PX);
const DVO_MS = 300;
/** 0.9.176 (t442u): ime dodirnute zgrade nestaje nakon ~3 s. */
const NATPIS_MS = 3000;
const DVO_PX = 36;

const OGRADE = ogradeRanca();


const DEKOR_SRC = {
  kaktus: IZO_DEKOR.kaktus,
  bacva: IZO_DEKOR.bacva,
  ograda: IZO_DEKOR.ograda,
  kola: IZO_DEKOR.kola,
} as const;

type Faza = "dan" | "zora" | "sumrak" | "noc";

function ulicaFaza(d = new Date()): Faza {
  const h = d.getHours();
  if (h >= 20 || h < 6) return "noc";
  if (h < 8) return "zora";
  if (h >= 18) return "sumrak";
  return "dan";
}

type Cam = { x: number; y: number; z: number; vx: number; vy: number };

export function KaubaZivaUlica({ ziva }: { ziva: boolean }) {
  const gradevine = useGameStore((s) => s.gradevine);
  const gradnje = useGameStore((s) => s.gradnje);
  const [natpisId, setNatpisId] = useState<string | null>(null);
  const [birana, setBirana] = useState<string | null>(null);
  /** 0.9.176 (t442u): svaki dodir zgrade ponovno pokreće prikaz imena (fade-in + 3 s). */
  const [natpisTik, setNatpisTik] = useState(0);
  const natpisRef = useRef<string | null>(null);
  natpisRef.current = natpisId;
  useEffect(() => {
    if (!natpisId) return;
    const t = window.setTimeout(() => setNatpisId(null), NATPIS_MS);
    // dodir bilo gdje izvan zgrade sakrije ime (dodir druge zgrade prebaci ime na nju)
    const van = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el && el.closest && el.closest(".izo-kuca")) return;
      setNatpisId(null);
      setBirana(null);
    };
    window.addEventListener("pointerdown", van, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", van, true);
    };
  }, [natpisId, natpisTik]);
  const [izbornik, setIzbornik] = useState<{ id: keyof Gradevine; x: number; y: number } | null>(null);
  const izbornikRef = useRef(false);
  useEffect(() => {
    izbornikRef.current = !!izbornik;
  }, [izbornik]);
  useLayoutEffect(() => {
    const sidro = sidroRef.current;
    const host = sidro?.closest(".ziva-ulica") as HTMLElement | null;
    const menu = sidro?.querySelector(".karta-izbornik") as HTMLElement | null;
    if (!sidro || !host || !menu || !izbornik) return;
    const pad = 8;
    const stavi = () => {
      const mw = menu.offsetWidth || 176;
      const mh = menu.offsetHeight || 220;
      const hw = host.clientWidth;
      const hh = host.clientHeight;
      let x = izbornik.x + 12;
      if (x + mw > hw - pad) x = izbornik.x - mw - 12;
      x = Math.max(pad, Math.min(x, Math.max(pad, hw - pad - mw)));
      let y = izbornik.y - 8;
      y = Math.max(pad, Math.min(y, Math.max(pad, hh - pad - mh)));
      sidro.style.left = `${Math.round(x)}px`;
      sidro.style.top = `${Math.round(y)}px`;
    };
    stavi();
    const ro = new ResizeObserver(stavi);
    ro.observe(menu);
    return () => ro.disconnect();
  }, [izbornik]);
  const [drzimId, setDrzimId] = useState<string | null>(null);
  const [faza, setFaza] = useState<Faza>(() => ulicaFaza());
  const [skriven, setSkriven] = useState(false);
  const [skok, setSkok] = useState<keyof Gradevine | null>(null);
  const [otkljuc, setOtkljuc] = useState<string | null>(null);
  const [pogled, setPogled] = useState<Sloj | null>(null);
  const [tok, setTok] = useState(false);
  const [izbor, setIzbor] = useState(false);
  const [detalj, setDetalj] = useState<Detalj>("srednje");
  const detaljRef = useRef<Detalj>("srednje");
  const prev = useRef<Gradevine | null>(null);
  const slobodneRef = useRef<Set<string> | null>(null);
  const okvirRef = useRef<HTMLDivElement>(null);
  const svijetRef = useRef<HTMLDivElement>(null);
  const kadarRef = useRef({ x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9, z: 1 });
  const natpisIzvorRef = useRef<Map<string, number | null> | null>(null);
  const centrirajRef = useRef<() => void>(() => {});
  const gutRef = useRef(0);
  const tapRef = useRef<{ id: string; t: number; timer: number } | null>(null);
  const vodicDodirU = useRef(0);
  const holdRef = useRef<{ timer: number } | null>(null);
  const izbornikU = useRef(0);
  const sidroRef = useRef<HTMLDivElement>(null);
  const otvorenoU = useRef(0);

  useEffect(() => vidljiviInterval(() => setFaza(ulicaFaza()), 60_000), []);

  useEffect(() => {
    const el = okvirRef.current;
    let uKadru = true;
    const sync = () => setSkriven(document.visibilityState === "hidden" || !uKadru);
    const io = new IntersectionObserver(
      ([e]) => {
        uKadru = !!e?.isIntersecting;
        sync();
      },
      { threshold: 0.04 },
    );
    if (el) io.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    const last = prev.current;
    prev.current = gradevine;
    if (!last) return;
    for (const z of PARCELE) {
      if ((gradevine[z.id as keyof Gradevine] || 0) <= (last[z.id as keyof Gradevine] || 0)) continue;
      setSkok(z.id as keyof Gradevine);
      const t = window.setTimeout(() => setSkok((cur) => (cur === z.id ? null : cur)), 600);
      return () => window.clearTimeout(t);
    }
  }, [gradevine]);

  useEffect(() => {
    const sad = new Set<string>();
    for (const z of PARCELE) {
      const id = z.id as keyof Gradevine;
      if ((gradevine[id] || 0) > 0 || gradnje.some((g) => g.zgrada === id)) continue;
      if (!zgradaUvjet(id, gradevine)) sad.add(z.id);
    }
    const prije = slobodneRef.current;
    slobodneRef.current = sad;
    if (!prije) return;
    for (const id of sad) {
      if (prije.has(id)) continue;
      setOtkljuc(id);
      const t = window.setTimeout(() => setOtkljuc((cur) => (cur === id ? null : cur)), 700);
      return () => window.clearTimeout(t);
    }
  }, [gradevine, gradnje]);

  const vodicDodir = (id: string) => {
    if (!vodicJosIde() || !vodicSnapshot().prikaz) return;
    const sad = performance.now();
    if (sad - vodicDodirU.current < 450) return;
    vodicDodirU.current = sad;
    const snap = vodicSnapshot();
    if (!snap.traka) return;
    if (snap.korak === "kuca" && id === "kuca") {
      idi({ tab: "selo", hub: "krov" });
      return;
    }
    if (snap.korak === "zgrada" && id === "bunar") {
      idi({ tab: "selo", hub: "voda" });
      return;
    }
    if (snap.rec) useGameStore.getState().setPoruka(`${snap.rec}. To nije ovaj dodir.`);
  };

  useEffect(() => {
    const el = okvirRef.current;
    const world = svijetRef.current;
    if (!el || !world) return;
    const cam: Cam = { x: 0, y: 0, z: 1, vx: 0, vy: 0 };
    // 0.9.177 (t448u): mjere okvira iz ResizeObservera — čitanje clientWidth odmah nakon pisanja
    // transforma tjeralo je sinkroni layout u svakom kadru vučenja.
    const dim = { w: el.clientWidth, h: el.clientHeight };
    // t452u/t448u: dok traje vučenje, blur ispod ikona izbornika se gasi (samo tamni prijelaz)
    let navBlur: Element | null = null;
    const vuce = (on: boolean) => {
      el.classList.toggle("is-vuce", on);
      if (!navBlur || !navBlur.isConnected) navBlur = document.querySelector(".nav-blur");
      navBlur?.classList.toggle("is-vuce", on);
    };
    const roDim = new ResizeObserver(() => {
      dim.w = el.clientWidth;
      dim.h = el.clientHeight;
    });
    roDim.observe(el);
    const pts = new Map<number, { x: number; y: number }>();
    let pinch: { dist: number; z: number; mx: number; my: number } | null = null;
    let pan: { x: number; y: number; lx: number; ly: number; t: number; moved: boolean } | null = null;
    let raf = 0;
    let gutDo = 0;
    let rucno = false;
    let slusa = false;
    let zadnjiDodir: { t: number; x: number; y: number } | null = null;
    const reduce = smanjenPokret();
    type Nat = { el: HTMLElement; x: number; y: number; van: boolean; dx: number; dy: number };
    let natCache: Nat[] = [];
    let natCacheIzvor: Map<string, number | null> | null = null;
    type Kut = { el: HTMLElement; x: number; y: number; van: number };
    const statika: Kut[] = [];
    const pokupi = (sel: string) => {
      world.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (el.dataset.agent) return;
        const left = el.style.left;
        let x = 0;
        let y = 0;
        if (left) {
          x = parseFloat(left) || 0;
          y = parseFloat(el.style.top) || 0;
        } else {
          const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform);
          if (!m) return;
          x = parseFloat(m[1]!) || 0;
          y = parseFloat(m[2]!) || 0;
        }
        statika.push({ el, x, y, van: -1 });
      });
    };
    pokupi(".izo-kuca");
    pokupi(".izo-dekor");
    pokupi(".izo-ograda-html");
    pokupi(".izo-koko");
    pokupi(".izo-konj-staja");
    pokupi(".izo-konj");
    const izrez = () => {
      const vw = dim.w;
      const vh = dim.h;
      const otvoreno = vw >= 2 && vh >= 2;
      const k = kadarRef.current;
      const pad = 140;
      const x0 = k.x0 - pad;
      const y0 = k.y0 - pad;
      const x1 = k.x1 + pad;
      const y1 = k.y1 + pad;
      for (let i = 0; i < statika.length; i++) {
        const b = statika[i]!;
        let van = 0;
        if (otvoreno && (b.x < x0 || b.x > x1 || b.y < y0 || b.y > y1)) van = 1;
        if (b.van === van) continue;
        b.van = van;
        b.el.classList.toggle("is-van-kadar", van === 1);
      }
    };

    const zNajdalje = () => {
      const vw = dim.w;
      const o = okvirNaselja();
      return Math.max(ZOOM_ODMAK, (vw * 0.85) / o.w);
    };

    const clamp = () => {
      const vw = dim.w;
      const vh = dim.h;
      if (vw < 2 || vh < 2) return;
      const b = NASELJE;
      const z = cam.z;
      const pad = 48;
      let loX = (vw - pad) / z - b.maxX;
      let hiX = pad / z - b.minX;
      if (loX > hiX) {
        const mid = (loX + hiX) / 2;
        loX = mid;
        hiX = mid;
      }
      let loY = (vh - pad) / z - b.maxY;
      let hiY = pad / z - b.minY;
      if (loY > hiY) {
        const mid = (loY + hiY) / 2;
        loY = mid;
        hiY = mid;
      }
      const nx = Math.min(hiX, Math.max(loX, cam.x));
      const ny = Math.min(hiY, Math.max(loY, cam.y));
      if (nx !== cam.x) cam.vx = 0;
      if (ny !== cam.y) cam.vy = 0;
      cam.x = nx;
      cam.y = ny;
    };

    const natpisi = () => {
      if (natCacheIzvor !== natpisIzvorRef.current) {
        natCacheIzvor = natpisIzvorRef.current;
        natCache = [];
        world.querySelectorAll<HTMLElement>(".izo-natpis").forEach((n) => {
          natCache.push({
            el: n,
            x: parseFloat(n.style.left) || 0,
            y: parseFloat(n.style.top) || 0,
            van: n.classList.contains("is-van"),
            dx: 9999,
            dy: 9999,
          });
        });
      }
      const vw = dim.w;
      const vh = dim.h;
      const z = cam.z;
      const pola = 46;
      const pad = 6;
      for (let i = 0; i < natCache.length; i++) {
        const n = natCache[i]!;
        const sx = (n.x + cam.x) * z;
        const sy = (n.y + cam.y) * z;
        const van = sx + pola < pad || sx - pola > vw - pad || sy < -28 || sy > vh - 8;
        if (n.van !== van) {
          n.van = van;
          n.el.classList.toggle("is-van", van);
        }
        if (van) continue;
        const dx = Math.round(Math.max(pad + pola - sx, Math.min(vw - pad - pola - sx, 0)));
        const dy = Math.round(sy < pad + 14 ? pad + 14 - sy : 0);
        if (n.dx !== dx) {
          n.dx = dx;
          n.el.style.setProperty("--dx", `${dx}px`);
        }
        if (n.dy !== dy) {
          n.dy = dy;
          n.el.style.setProperty("--dy", `${dy}px`);
        }
      }
    };

    let zakazano = 0;
    const apply = (natpis = true) => {
      world.style.transform = `scale(${cam.z}) translate3d(${cam.x}px, ${cam.y}px, 0)`;
      kameraSeMakla();
      const vw = dim.w;
      const vh = dim.h;
      const kadr = kadarRef.current;
      const z = cam.z || 1;
      kadr.z = z;
      kadr.x0 = -cam.x;
      kadr.y0 = -cam.y;
      kadr.x1 = vw / z - cam.x;
      kadr.y1 = vh / z - cam.y;
      izrez();
      const zMin = zNajdalje();
      const sljedeci = cam.z <= zMin + 0.02 ? "daleko" : detaljStabilan(detaljRef.current, cam.z);
      detaljOdZooma(cam.z);
      if (sljedeci !== detaljRef.current) {
        detaljRef.current = sljedeci;
        setDetalj(sljedeci);
      }
      if (natpis) natpisi();
    };
    const zatrazi = () => {
      if (zakazano) return;
      zakazano = requestAnimationFrame(() => {
        zakazano = 0;
        apply(false);
      });
    };

    const zoomAt = (sx: number, sy: number, nz: number) => {
      const z1 = cam.z;
      const z2 = Math.min(ZOOM_MAX, Math.max(zNajdalje(), nz));
      const wx = sx / z1 - cam.x;
      const wy = sy / z1 - cam.y;
      cam.z = z2;
      cam.x = sx / z2 - wx;
      cam.y = sy / z2 - wy;
      clamp();
    };

    // 0.9.180: tijekom zumiranja samo transform. Filter i izrez na kraju geste.
    const karta = () => el.parentElement;
    let zumTajmer = 0;
    const samoTransform = () => {
      world.style.transform = `scale(${cam.z}) translate3d(${cam.x}px, ${cam.y}px, 0)`;
    };
    const pocniZum = () => {
      karta()?.classList.add("is-zum");
      vuce(true);
    };
    const krajZuma = () => {
      if (zumTajmer) window.clearTimeout(zumTajmer);
      zumTajmer = 0;
      const bio = !!karta()?.classList.contains("is-zum");
      karta()?.classList.remove("is-zum");
      if (!pan) vuce(false);
      if (bio) apply(true);
    };

    const centriraj = () => {
      dim.w = el.clientWidth;
      dim.h = el.clientHeight;
      const vw = dim.w;
      const vh = dim.h;
      if (vw < 2 || vh < 2) return;
      rucno = false;
      cam.vx = 0;
      cam.vy = 0;
      const pogled = kameraPogleda(vw, vh);
      cam.z = pogled.z;
      cam.x = pogled.x;
      cam.y = pogled.y;
      clamp();
      apply();
    };
    centrirajRef.current = centriraj;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      cam.vx = 0;
      cam.vy = 0;
    };

    const inercija = () => {
      if (Math.hypot(cam.vx, cam.vy) < 0.12) {
        cam.vx = 0;
        cam.vy = 0;
        raf = 0;
        return;
      }
      cam.x += cam.vx;
      cam.y += cam.vy;
      cam.vx *= 0.96;
      cam.vy *= 0.96;
      clamp();
      apply();
      raf = requestAnimationFrame(inercija);
    };

    const lokal = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      if (izbornikRef.current) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const meta = (e.target as Element | null)?.closest?.(
        "button, a, .karta-izbornik, .karta-izbornik-pozadina, .karta-info, .karta-pogled, .karta-kontrole",
      );
      if (!meta) e.preventDefault();
      pts.set(e.pointerId, lokal(e));
      stop();
      if (!slusa) {
        slusa = true;
        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onUp, true);
        window.addEventListener("pointercancel", onUp, true);
      }
      if (pts.size >= 2) {
        pan = null;
        rucno = true;
        const [a, b] = [...pts.values()];
        pinch = {
          dist: Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1,
          z: cam.z,
          mx: (a!.x + b!.x) / 2,
          my: (a!.y + b!.y) / 2,
        };
        pocniZum();
        return;
      }
      const p = lokal(e);
      pan = { x: p.x, y: p.y, lx: p.x, ly: p.y, t: performance.now(), moved: false };
    };

    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, lokal(e));
      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
        const mx = (a!.x + b!.x) / 2;
        const my = (a!.y + b!.y) / 2;
        if (!pinch) pinch = { dist, z: cam.z, mx, my };
        rucno = true;
        const z2 = Math.min(ZOOM_MAX, Math.max(zNajdalje(), pinch.z * (dist / pinch.dist)));
        const wx = pinch.mx / cam.z - cam.x;
        const wy = pinch.my / cam.z - cam.y;
        cam.z = z2;
        cam.x = mx / z2 - wx;
        cam.y = my / z2 - wy;
        pinch.mx = mx;
        pinch.my = my;
        clamp();
        samoTransform();
        pocniZum();
        return;
      }
      if (!pan) return;
      const p = lokal(e);
      const odStarta = Math.hypot(p.x - pan.x, p.y - pan.y);
      if (!pan.moved) {
        if (odStarta <= VUC_PX) {
          pan.lx = p.x;
          pan.ly = p.y;
          pan.t = performance.now();
          return;
        }
        pan.moved = true;
        rucno = true;
        vuce(true);
        if (!el.hasPointerCapture(e.pointerId)) {
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* stariji webview */
          }
        }
      }
      if (odStarta > 16 && holdRef.current) {
        window.clearTimeout(holdRef.current.timer);
        holdRef.current = null;
        setDrzimId(null);
      }
      const dx = p.x - pan.lx;
      const dy = p.y - pan.ly;
      const dt = Math.max(16, performance.now() - pan.t);
      cam.x += dx / cam.z;
      cam.y += dy / cam.z;
      cam.vx = (dx / cam.z / dt) * 16;
      cam.vy = (dy / cam.z / dt) * 16;
      pan.lx = p.x;
      pan.ly = p.y;
      pan.t = performance.now();
      clamp();
      zatrazi();
    };

    const odvezi = () => {
      if (!slusa) return;
      slusa = false;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };

    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) {
        pinch = null;
        if (karta()?.classList.contains("is-zum") && pts.size < 2) krajZuma();
      }
      if (pts.size === 1) {
        const p = [...pts.values()][0]!;
        pan = { x: p.x, y: p.y, lx: p.x, ly: p.y, t: performance.now(), moved: true };
        return;
      }
      if (pts.size > 0) return;
      const p = lokal(e);
      const moved = !!pan?.moved;
      pan = null;
      vuce(false);
      odvezi();
      if (!moved) {
        const sad = performance.now();
        if (
          zadnjiDodir &&
          sad - zadnjiDodir.t < DVO_MS &&
          Math.hypot(p.x - zadnjiDodir.x, p.y - zadnjiDodir.y) < DVO_PX
        ) {
          zadnjiDodir = null;
          if (tapRef.current) {
            window.clearTimeout(tapRef.current.timer);
            tapRef.current = null;
          }
          gutDo = sad + 450;
          gutRef.current = gutDo;
          window.dispatchEvent(new CustomEvent("blago-karta-reset"));
          stop();
          centriraj();
          return;
        }
        zadnjiDodir = { t: sad, x: p.x, y: p.y };
      } else {
        zadnjiDodir = null;
        gutDo = performance.now() + 480;
        gutRef.current = gutDo;
      }
      const brzina = Math.hypot(cam.vx, cam.vy);
      if (brzina > 26) {
        cam.vx *= 26 / brzina;
        cam.vy *= 26 / brzina;
      }
      if (!reduce && moved && brzina > 0.35) {
        raf = requestAnimationFrame(inercija);
      } else {
        cam.vx = 0;
        cam.vy = 0;
        apply(true);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (izbornikRef.current) return;
      e.preventDefault();
      rucno = true;
      stop();
      const r = el.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * dim.h : e.deltaY;
      zoomAt(e.clientX - r.left, e.clientY - r.top, cam.z * Math.exp(-dy * 0.0015));
      pocniZum();
      samoTransform();
      if (zumTajmer) window.clearTimeout(zumTajmer);
      zumTajmer = window.setTimeout(krajZuma, 140);
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.(".karta-izbornik, .karta-izbornik-sidro, .karta-izbornik-pozadina")) return;
      if (izbornikRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (performance.now() > gutDo) return;
      gutDo = 0;
      e.preventDefault();
      e.stopPropagation();
    };

    const onDbl = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (tapRef.current) {
        window.clearTimeout(tapRef.current.timer);
        tapRef.current = null;
      }
      zadnjiDodir = null;
      gutDo = performance.now() + 450;
      gutRef.current = gutDo;
      window.dispatchEvent(new CustomEvent("blago-karta-reset"));
      stop();
      centriraj();
    };

    const ro = new ResizeObserver(() => {
      if (!rucno) centriraj();
      else {
        clamp();
        apply();
      }
    });
    ro.observe(el);
    centriraj();

    el.addEventListener("pointerdown", onDown, { passive: false });
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("click", onClick, true);
    el.addEventListener("dblclick", onDbl);
    const naCentar = () => centriraj();
    const naSkok = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const p = PARCELE.find((z) => z.id === id);
      if (!p) return;
      rucno = true;
      const vw = dim.w;
      const vh = dim.h;
      const z = Math.min(ZOOM_MAX, Math.max(1.15, cam.z));
      cam.z = z;
      cam.x = vw / (2 * z) - p.x;
      cam.y = vh / (2 * z) - p.y;
      cam.vx = 0;
      cam.vy = 0;
      clamp();
      apply();
    };
    window.addEventListener("blago-centriraj", naCentar);
    window.addEventListener("blago-skoci-zgrada", naSkok);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (zakazano) cancelAnimationFrame(zakazano);
      if (zumTajmer) window.clearTimeout(zumTajmer);
      karta()?.classList.remove("is-zum");
      ro.disconnect();
      odvezi();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dblclick", onDbl);
      window.removeEventListener("blago-centriraj", naCentar);
      roDim.disconnect();
      window.removeEventListener("blago-skoci-zgrada", naSkok);
    };
  }, []);

  const aktivni = useMemo(() => {
    const ids: string[] = [];
    for (const z of PARCELE) {
      const id = z.id as keyof Gradevine;
      if ((gradevine[id] || 0) > 0 || gradnje.some((g) => g.zgrada === id)) ids.push(z.id);
    }
    return ids;
  }, [gradevine, gradnje]);
  // 0.9.176 (t443u): uz puteljke i uske pješačke staze unutar naselja (između izgrađenih zgrada)
  const staze = useMemo(() => [...putelji(aktivni), ...pjesine(aktivni)], [aktivni]);
  const rute = useMemo(() => stazeKretanja(aktivni), [aktivni]);
  // Svako grlo iz spremljenog broja (bez kapaciteta); stare ukrasne konje i goveda zamjenjuje.
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const stoka = useMemo(() => stokaNaKarti(gradevine, konjiBroj, govedaBroj).grla, [gradevine, konjiBroj, govedaBroj]);
  const mirno = smanjenPokret();
  const pauza = !ziva || skriven;


  const natpisY = useMemo(() => {
    const kutije: { l: number; t: number; r: number; b: number }[] = [];
    const yZa = new Map<string, number | null>();
    // 0.9.176 (t442u): ime zgrade samo nakon dodira; prvo se smješta dodirnuta zgrada.
    const redom = [...PARCELE].sort((a, b) => Number(b.id === natpisId) - Number(a.id === natpisId));
    for (const z of redom) {
      const id = z.id as keyof Gradevine;
      const posao = gradnje.some((g) => g.zgrada === id);
      const vazan = natpisId === z.id;
      const pokazi = posao || vazan || !!pogled;
      if (!pokazi) continue;
      const c = centarSpritea(z, "zgrada");
      const w = Math.min(150, 52 + z.naziv.length * 6);
      const gore = pogled ? 20 : 0;
      let y = c.y + 18;
      let stao = false;
      for (let k = 0; k < 7; k++) {
        const box = { l: c.x - w / 2, t: y - gore, r: c.x + w / 2, b: y + 18 };
        const sudar = kutije.some((q) => q.l < box.r && box.l < q.r && q.t < box.b && box.t < q.b);
        if (!sudar) {
          kutije.push(box);
          yZa.set(z.id, y);
          stao = true;
          break;
        }
        y += 16;
      }
      if (!stao) yZa.set(z.id, vazan ? y : null);
    }
    return yZa;
  }, [gradnje, natpisId, pogled]);
  natpisIzvorRef.current = natpisY;
  const radnje = useRef({ vodicDodir, setBirana, setNatpisId, setNatpisTik, setDrzimId, setIzbornik });
  radnje.current.vodicDodir = vodicDodir;
  radnje.current.setBirana = setBirana;
  radnje.current.setNatpisId = setNatpisId;
  radnje.current.setNatpisTik = setNatpisTik;
  radnje.current.setDrzimId = setDrzimId;
  radnje.current.setIzbornik = setIzbornik;
  const kucaDodir = useRef<KucaDodir | null>(null);
  if (!kucaDodir.current) {
    kucaDodir.current = {
      gut: gutRef,
      tap: tapRef,
      centriraj: centrirajRef,
      otvoreno: otvorenoU,
      hold: holdRef,
      izbornikU,
      vodic: (id) => radnje.current.vodicDodir(id),
      odaberi: (id, prekidac) => {
        radnje.current.setBirana(id);
        // drugi običan dodir iste zgrade dok se ime vidi: sakrij ime (odabir zgrade ostaje)
        if (prekidac && natpisRef.current === id) {
          radnje.current.setNatpisId(null);
          return;
        }
        radnje.current.setNatpisId(id);
        radnje.current.setNatpisTik((n) => n + 1);
      },
      drzi: (id) => radnje.current.setDrzimId(id),
      izbornik: (m) => radnje.current.setIzbornik(m),
    };
  }


  return (
    <div
      className={cn(
        "ziva-ulica ziva-izo",
        faza === "noc" && "is-noc",
        faza === "zora" && "is-zora",
        faza === "sumrak" && "is-sumrak",
        pauza && "is-pauza",
        !mirno && "is-agenti",
      )}
      data-sloj={pogled || undefined}
      data-testid="ziva-ulica"
      data-noc={faza === "noc" ? "1" : "0"}
      data-faza={faza}
      data-detalj={detalj}
      data-lock-pan
    >
      <div className="izo-okvir" ref={okvirRef} data-lock-pan>
        <div className="izo-svijet" ref={svijetRef} style={{ width: SVIJET.w, height: SVIJET.h }}>
          <div className="izo-tlo" aria-hidden />
          <Obzor />
          <KaubaTrgVoda />
          <KaubaCesta gradevine={gradevine} gradnje={gradnje} pogled={pogled} staze={staze} mirno={mirno} skok={skok} stoka={stoka} />
          {DEKOR.map((d, i) => (
            <span
              key={`d${i}`}
              className="izo-dekor"
              data-izo="dekor"
              data-tip={d.tip}
              style={{ left: d.x, top: d.y, zIndex: Math.round(d.y), ["--sc" as string]: d.sc, ["--okret" as string]: `${(i % 2 === 0 ? -3.5 : 2.5)}deg` } as CSSProperties}
              aria-hidden
            >
              {d.tip === "kaktus" ? (
                <img
                  src={artSrc(DEKOR_SRC.kaktus)}
                  alt=""
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  width={64}
                  height={64}
                  style={{ filter: `hue-rotate(${(i % 4) * 6 - 6}deg) saturate(${0.92 + (i % 3) * 0.06})` }}
                />
              ) : (
                <img src={artSrc(DEKOR_SRC[d.tip])} alt="" draggable={false} loading="eager" decoding="async" width={64} height={64} />
              )}
            </span>
          ))}
          {/* 0.9.177 (t453u): ograda samo uz izgrađenu zgradu */}
          {OGRADE.map((d, i) => (gradevine[d.zgrada as keyof Gradevine] || 0) > 0 ? (
            <span
              key={`og${i}`}
              data-zgrada={d.zgrada}
              className="izo-ograda-html"
              style={{ left: d.x, top: d.y, zIndex: Math.round(d.y), ["--okret" as string]: `${(i % 2 === 0 ? -4 : 3)}deg` }}
              aria-hidden
            />
          ) : null)}
          <KaubaKuce
            gradevine={gradevine}
            gradnje={gradnje}
            skok={skok}
            otkljuc={otkljuc}
            birana={birana}
            drzimId={drzimId}
            dodir={kucaDodir.current}
          />
          {PARCELE.map((z) => {
            const id = z.id as keyof Gradevine;
            const lv = gradevine[id] || 0;
            const posao = gradnje.find((g) => g.zgrada === id);
            const ima = lv > 0 && !posao;
            // 0.9.176 (t442u): ime (i razina) samo za dodirnutu zgradu; gradilište i dalje pokazuje rok,
            // sloj Pogled i dalje pokazuje broj sloja (bez imena).
            const dodirnuta = natpisId === z.id;
            const pokazi = !!posao || dodirnuta;
            if ((!pokazi && !pogled) || natpisY.get(z.id) === null) return null;
            const c = centarSpritea(z, posao ? "skela" : ima ? "zgrada" : "kolci");
            const y = natpisY.get(z.id) ?? c.y + 18;
            return (
              <span
                key={dodirnuta ? `n-${z.id}-${natpisTik}` : `n-${z.id}`}
                className={cn("izo-natpis", ima && "is-gore", !ima && !posao && "is-dodir", dodirnuta && "is-tap")}
                data-zgrada={z.id}
                data-natpis-tap={dodirnuta ? "1" : undefined}
                style={{ left: c.x, top: y, zIndex: 3000 + Math.round(c.y) }}
              >
                {pogled ? <span className="izo-broj">{brojSloja(pogled, z.id, lv, gradevine)}</span> : null}
                {dodirnuta ? (
                  <span className="izo-red">
                    {ima ? <span className="izo-lv">{lv}</span> : null}
                    <span className="izo-ime">{z.naziv}</span>
                  </span>
                ) : null}
                {ima || !pokazi ? null : (
                  <span className="izo-stanje">{posao ? <RokGradnje kraj={posao.kraj} /> : cetvrtNaziv(z.id)}</span>
                )}
              </span>
            );
          })}
          <KaubaHodaci
            rute={rute}
            aktivnih={aktivni.length}
            pauza={pauza}
            mirno={mirno}
            detalj={detalj}
            kadarRef={kadarRef}
            centrirajRef={centrirajRef}
            gutRef={gutRef}
            tapRef={tapRef}
            otvorenoU={otvorenoU}
          />
          {(gradevine.farma || 0) > 0 && OBZOR.zivFarma ? (
            <span
              className="izo-koko"
              style={{ transform: `translate3d(${OBZOR.zivFarma.x}px, ${OBZOR.zivFarma.y}px, 0)`, zIndex: Math.round(OBZOR.zivFarma.y) }}
              aria-hidden
            >
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <span className="izo-atmosfera" aria-hidden>
            <i className="izo-korov" />
            <i className="izo-prasak" />
            <i className="izo-ptica" />
          </span>
          {!mirno ? <span className="izo-tumble" aria-hidden /> : null}
          {NASELJA.map((n) => {
            const t = natpisNaselja(n.ids);
            if (!t) return null;
            return (
              <span key={n.id} className={cn("izo-naselje", `is-${n.id}`, `is-${n.vrsta}`)} style={{ left: t.x, top: t.y }}>
                <b>{n.ime}</b>
                <small>
                  <i className={cn("izo-prinos", `is-${n.id}`)} aria-hidden />
                  {n.vrsta === "grad" ? "prima sa naselja" : `${n.rec} → grad`}
                </small>
              </span>
            );
          })}
          <AiOznaka ziva={ziva} />
        </div>
        <div className="izo-zrno" aria-hidden />
      </div>
      {/* 0.9.173: Pogled · Tok kaube · kauboji/sreća u jednom retku */}
      {/* 0.9.178 (t459u): isti stil kao donji izbornik — lebdeće ikone (24 px, potez 2), bez pilula; sjena = tamna kopija ikone */}
      <div className="karta-kontrole" data-testid="karta-kontrole" data-stil="178">
        <div className="karta-pogled" data-testid="karta-pogled">
          {izbor ? (
            <div className="karta-pogled-izbor" role="menu" aria-label="Slojevi karte">
              {(
                [
                  ["voda", "Voda", Droplet],
                  ["sreca", "Sreća", Smile],
                  ["rad", "Rad", Hammer],
                ] as const
              ).map(([id, ime, Ik]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={pogled === id}
                  aria-label={ime}
                  className={cn(pogled === id && "is-on")}
                  onClick={() => {
                    setPogled((cur) => (cur === id ? null : id));
                    setIzbor(false);
                  }}
                >
                  <span className="kk-ik" aria-hidden>
                    <Ik className="kk-sjena" strokeWidth={3.6} />
                    <Ik className="kk-glif" strokeWidth={2} />
                  </span>
                  <span className="kk-rijec">{ime}</span>
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            aria-expanded={izbor}
            aria-label={pogled === "voda" ? "Pogled: Voda" : pogled === "sreca" ? "Pogled: Sreća" : pogled === "rad" ? "Pogled: Rad" : "Pogled"}
            className={cn("kk-tipka", pogled && "is-on")}
            onClick={() => setIzbor((v) => !v)}
          >
            <span className="kk-ik" aria-hidden>
              <Layers className="kk-sjena" strokeWidth={3.6} />
              <Layers className="kk-glif" strokeWidth={2} />
            </span>
          </button>
          <button
            type="button"
            className="mreza-ulaz kk-tipka"
            aria-pressed={tok}
            aria-label="Tok kaube"
            onClick={() => {
              playSfx("button");
              setIzbor(false);
              setTok(true);
            }}
          >
            <span className="kk-ik" aria-hidden>
              <Workflow className="kk-sjena" strokeWidth={3.6} />
              <Workflow className="kk-glif" strokeWidth={2} />
            </span>
          </button>
        </div>
        <KaubaBroj />
      </div>
      <span className="izo-oblak" aria-hidden />
      {pogled ? (
        <span className="karta-legenda" data-sloj={pogled}>
          <i />
          {pogled === "voda" ? "Voda" : pogled === "sreca" ? "Sreća" : "Rad"}
        </span>
      ) : null}
      <span className="ziva-ton" aria-hidden />
      <span className="ziva-lampe" aria-hidden />
      {izbornik ? (
        <>
          <button
            type="button"
            className="karta-izbornik-pozadina"
            aria-label="Zatvori izbornik"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (performance.now() - izbornikU.current < 400) return;
              setIzbornik(null);
            }}
          />
          <div className="karta-izbornik-sidro" ref={sidroRef}>
            <KartaIzbornik
              id={izbornik.id}
              onZatvori={() => setIzbornik(null)}
              onSve={(cilj) => otvoriCiljZgradu(cilj)}
            />
          </div>
        </>
      ) : null}
      {tok ? (
        <MrezaSela
          onZatvori={() => setTok(false)}
          onZgrada={(id) => {
            setTok(false);
            setBirana(id);
            setNatpisId(id);
            setNatpisTik((n) => n + 1);
            window.dispatchEvent(new CustomEvent("blago-skoci-zgrada", { detail: id }));
            document.getElementById(`zgrada-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      ) : null}
    </div>
  );
}
