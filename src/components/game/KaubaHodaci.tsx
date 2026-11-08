import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AGENT_CAP, AgentSim, spljostiRutu, type AgentUlaz } from "@/lib/game/agentiSim";
import {
  ciljIzGdje,
  fazaUlice,
  kljucCilja,
  naOs,
  planNaCilju,
  planUlice,
  preusmjeri,
  tockaCilja,
  type CiljHoda,
  type PlanHoda,
} from "@/lib/game/hodCilj";
import { playSfx } from "@/lib/game/audio";
import { brojAgenata, tockaNaPutu, type Detalj, type Staza } from "@/lib/game/kartaPogled";
import { kartaPetljaPokreni } from "@/lib/game/kartaPetlja";
import { danDoba, gdjeJe, poredajGlavne, type DanDoba, type Stanovnik } from "@/lib/game/ljudi";
import { PARCELE } from "@/lib/game/ulicaRaspored";
import { Termika } from "@/lib/game/termika";
import { TokPolje } from "@/lib/game/tokPolje";
import { useGameStore } from "@/lib/stores/gameStore";
import { LikAvatar } from "./LikAvatar";

const DVO_MS = 300;
const OTVORI_MS = 320;

type Kadro = { x0: number; y0: number; x1: number; y1: number; z: number };
type Tap = { id: string; t: number; timer: number };

export function KaubaHodaci({
  rute,
  aktivnih,
  pauza,
  mirno,
  detalj,
  kadarRef,
  centrirajRef,
  gutRef,
  tapRef,
  otvorenoU,
}: {
  rute: Staza[];
  aktivnih: number;
  pauza: boolean;
  mirno: boolean;
  detalj: Detalj;
  kadarRef: RefObject<Kadro>;
  centrirajRef: RefObject<() => void>;
  gutRef: RefObject<number>;
  tapRef: RefObject<Tap | null>;
  otvorenoU: RefObject<number>;
}) {
  const ljudi = useGameStore((s) => s.ljudi);
  const segrti = useGameStore((s) => s.segrti);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const gradevine = useGameStore((s) => s.gradevine);
  const gradnje = useGameStore((s) => s.gradnje);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const karavana = useGameStore((s) => s.karavana);
  const [doba, setDoba] = useState<DanDoba>(() => danDoba());
  useEffect(() => {
    const id = window.setInterval(() => setDoba(danDoba()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const [balon, setBalon] = useState<string | null>(null);
  const balonTimer = useRef(0);
  const korijen = useRef<HTMLSpanElement>(null);
  // Cilj svakog hodača dolazi iz gdjeJe(): gradilište, posao, doba dana. Tko je na putu (pohod, karavana) nije na karti.
  const { hodaci, ciljevi } = useMemo(() => {
    const svi = ljudi.concat(segrti).concat(zamjenici);
    const c = new Map<string, CiljHoda>();
    for (const p of svi) c.set(p.id, ciljIzGdje(gdjeJe(p, gradevine, gradnje, ostecenja, doba, karavana, svi)));
    const tu = poredajGlavne(svi).filter((p) => c.get(p.id)?.tip !== "put");
    return { hodaci: tu.slice(0, brojAgenata(stanovnici, 0).hodaci), ciljevi: c };
  }, [ljudi, segrti, zamjenici, stanovnici, gradevine, gradnje, ostecenja, karavana, doba]);
  const ciljRef = useRef(ciljevi);
  ciljRef.current = ciljevi;
  /** Plan i prijeđeni put po osobi; preživljava zum i promjenu zgrada (nema skoka). Samo prikaz, ne sprema se. */
  const planovi = useRef(new Map<string, { plan: PlanHoda; d: number }>());
  const simRef = useRef<{ sim: AgentSim; ids: string[]; slot0: number; preusmjeri: () => void } | null>(null);

  const kolaN = brojAgenata(stanovnici, aktivnih).kola;

  useEffect(() => () => window.clearTimeout(balonTimer.current), []);

  useEffect(() => {
    if (pauza || mirno || rute.length === 0) return;
    const daleko = detalj === "daleko";
    const mapa = planovi.current;
    const root = korijen.current;
    const world = root?.closest<HTMLElement>(".izo-svijet");
    if (!root || !world) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-agent]");
    const flat = rute.map((r) => spljostiRutu(r.tocke));
    const tok = new TokPolje();
    let tokKljuc = "";
    for (let i = 0; i < rute.length; i++) {
      const r = rute[i]!;
      tokKljuc += r.id;
      tokKljuc += r.tocke.length;
      tokKljuc += "|";
    }
    tok.slozi(tokKljuc, flat);
    const ulaz: AgentUlaz[] = [];
    const els: HTMLElement[] = [];
    const ids: string[] = [];
    const slot0 = flat.length;
    const pocetni: { i: number; plan: PlanHoda; d: number }[] = [];
    nodes.forEach((n, i) => {
      if (ulaz.length >= AGENT_CAP) return;
      const tip = n.dataset.agent;
      if (tip === "hod" && n.dataset.id) {
        // Hodač: vlastita ruta do cilja iz gdjeJe(), nastavlja odakle je stao.
        const id = n.dataset.id;
        const cilj = ciljRef.current.get(id) ?? { tip: "ulica" as const };
        const st = mapa.get(id) ?? { plan: planNaCilju(cilj), d: 0 };
        pocetni.push({ i: ulaz.length, plan: st.plan, d: st.d });
        ulaz.push({ ruta: 0, brzina: 32, faza: 0, tip: 0 });
        els.push(n);
        ids.push(id);
        return;
      }
      // Kola i pas: kao prije (ulica); u pogledu izdaleka miruju i skriveni su.
      if (daleko) return;
      const ri = (tip === "kola" || tip === "pas" ? 0 : i) % rute.length;
      const ruta = rute[ri];
      if (!ruta || ruta.duzina < 1) return;
      ulaz.push({
        ruta: ri,
        brzina: tip === "kola" ? 22 : 32,
        faza: tip === "pas" ? -0.045 : i * 0.17,
        tip: tip === "kola" ? 1 : tip === "pas" ? 2 : 0,
      });
      els.push(n);
      ids.push("");
    });
    const sim = new AgentSim();
    sim.postavi(flat, ulaz);
    const postavi = (i: number, plan: PlanHoda, d: number) => {
      const r = spljostiRutu(plan.tocke);
      sim.zamijeniRutu(i, slot0 + i, r, r.ukupno > 0 ? d / r.ukupno : 0, plan.jednom);
      mapa.set(ids[i]!, { plan, d });
    };
    const uskladi = () => {
      for (let i = 0; i < sim.count; i++) {
        const id = ids[i];
        if (!id) continue;
        const st = mapa.get(id);
        if (!st) continue;
        const cilj = ciljRef.current.get(id) ?? { tip: "ulica" as const };
        const k = kljucCilja(cilj);
        const d = sim.napredak(i);
        if (st.plan.cilj !== k && !(k === "ulica" && !st.plan.jednom)) {
          postavi(i, preusmjeri(st.plan, d, cilj), 0);
        } else if (st.plan.cilj === "ulica" && st.plan.jednom && sim.stigao(i)) {
          // stigao na ulicu: šetnja tamo-natrag od te točke
          const zadnja = st.plan.tocke[st.plan.tocke.length - 1]!;
          const petlja = planUlice();
          postavi(i, petlja, fazaUlice(naOs(zadnja).s) * petlja.duzina);
        }
      }
    };
    for (const p of pocetni) postavi(p.i, p.plan, p.d);
    uskladi();
    simRef.current = { sim, ids, slot0, preusmjeri: uskladi };
    let provjera = 0;
    const kut0 = new Int16Array(AGENT_CAP);
    kut0.fill(-9999);
    const pred0 = new Int8Array(AGENT_CAP);
    const ulica = world.closest<HTMLElement>(".ziva-ulica");
    const termika = new Termika();
    let oznaka = 0;
    const stop = kartaPetljaPokreni(() => {
      sim.frame(performance.now());
      if (++provjera >= 30) {
        provjera = 0;
        uskladi();
      }
      const vruce = termika.frame(sim.teret);
      let t = sim.simT - 0.1 + sim.alpha * 0.1;
      if (t < 0) t = 0;
      if (sim.teret === 0 && vruce === 0) world.style.setProperty("--t", t.toFixed(3));
      if (ulica && oznaka !== vruce) {
        oznaka = vruce;
        if (vruce > 0) ulica.dataset.teret = "1";
        else delete ulica.dataset.teret;
      }
      const k = kadarRef.current;
      if (!k) return;
      const pad = 72;
      const teret = sim.teret === 1 || vruce > 0;
      for (let i = 0; i < sim.count; i++) {
        const n = els[i]!;
        const px = sim.ix[i]!;
        const py = sim.iy[i]!;
        const van = px < k.x0 - pad || px > k.x1 + pad || py < k.y0 - pad || py > k.y1 + pad;
        if (van) {
          if (sim.vidljiv[i]) {
            sim.vidljiv[i] = 0;
            n.style.visibility = "hidden";
          }
          continue;
        }
        if (!sim.vidljiv[i]) {
          sim.vidljiv[i] = 1;
          n.style.visibility = "";
        }
        n.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        const z = Math.round(py);
        if (sim.zadnjiZ[i] !== z) {
          sim.zadnjiZ[i] = z;
          n.style.setProperty("--z", String(z));
        }
        if (teret || sim.tip[i] !== 0) continue;
        const alat = n.dataset.alat;
        if (alat === "cekic" || alat === "sjekira") {
          const ciklus = (t * (alat === "cekic" ? 2.6 : 1.7)) % 1;
          const udar = ciklus < 0.16 ? ciklus / 0.16 : ciklus < 0.34 ? 1 - (ciklus - 0.16) / 0.18 : 0;
          const kut = alat === "cekic" ? -58 + udar * 74 : -24 + udar * 42;
          const kut10 = Math.round(kut * 10);
          if (kut0[i] !== kut10) {
            kut0[i] = kut10;
            n.style.setProperty("--udar", `${(kut10 / 10).toFixed(1)}deg`);
          }
        }
        let blizu = false;
        let ispred = false;
        for (let q = 0; q < PARCELE.length; q++) {
          const p = PARCELE[q]!;
          const dx = p.x - px;
          const dy = p.y - py;
          if (dx * dx + dy * dy < 48 * 48) {
            blizu = true;
            if (py >= p.y - 6) ispred = true;
          }
        }
        const bit = blizu ? 1 : 0;
        if (sim.unutar[i] !== bit) {
          sim.unutar[i] = bit;
          n.classList.toggle("is-unutar", blizu);
        }
        const pred = ispred ? 1 : 0;
        if (pred0[i] !== pred) {
          pred0[i] = pred;
          n.classList.toggle("is-ispred", ispred);
        }
      }
    });
    return () => {
      stop();
      for (let i = 0; i < sim.count; i++) {
        const id = ids[i];
        const st = id ? mapa.get(id) : undefined;
        if (id && st) mapa.set(id, { plan: st.plan, d: sim.napredak(i) });
      }
      if (simRef.current?.sim === sim) simRef.current = null;
      if (ulica) delete ulica.dataset.teret;
      for (let i = 0; i < els.length; i++) {
        els[i]!.style.visibility = "";
        els[i]!.classList.remove("is-ispred");
      }
    };
  }, [pauza, mirno, detalj, rute, hodaci, kolaN, kadarRef]);

  // Promjena zadatka: preusmjeri od trenutne točke, bez novog sima.
  useEffect(() => {
    simRef.current?.preusmjeri();
  }, [ciljevi]);

  const reci = (p: Stanovnik) => {
    playSfx("button");
    setBalon(p.id);
    window.clearTimeout(balonTimer.current);
    balonTimer.current = window.setTimeout(() => setBalon((id) => (id === p.id ? null : id)), 2200);
  };

  const dodir = (id: string, radnja: () => void) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const sad = performance.now();
    if (sad < gutRef.current) return;
    const pret = tapRef.current;
    if (pret && pret.id === id && sad - pret.t < DVO_MS) {
      window.clearTimeout(pret.timer);
      tapRef.current = null;
      gutRef.current = sad + 450;
      window.dispatchEvent(new CustomEvent("blago-karta-reset"));
      centrirajRef.current();
      return;
    }
    if (pret) window.clearTimeout(pret.timer);
    const timer = window.setTimeout(() => {
      tapRef.current = null;
      if (performance.now() < gutRef.current) return;
      otvorenoU.current = performance.now();
      radnja();
    }, OTVORI_MS);
    tapRef.current = { id, t: sad, timer };
  };

  return (
    <span ref={korijen} style={{ display: "contents" }}>
      {hodaci.map((p) => {
        const cilj = ciljevi.get(p.id) ?? { tip: "ulica" as const };
        const st = planovi.current.get(p.id);
        // Smanjen pokret: stoji na stvarnom cilju. Inače kreće odakle je stao.
        const start =
          mirno || !st
            ? tockaCilja(cilj)
            : tockaNaPutu(st.plan.tocke, st.plan.jednom ? Math.min(0.9999, st.d / (st.plan.duzina || 1)) : st.d / (st.plan.duzina || 1));
        return (
          <button
            key={p.id}
            type="button"
            className="izo-setac"
            data-izo="lik"
            data-agent="hod"
            data-id={p.id}
            data-cilj={kljucCilja(cilj)}
            data-alat={p.alat}
            style={{ transform: `translate3d(${start.x}px, ${start.y}px, 0)`, ["--z" as string]: Math.round(start.y) }}
            aria-label={`${p.ime}. ${p.rec}`}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (tapRef.current) {
                window.clearTimeout(tapRef.current.timer);
                tapRef.current = null;
              }
              gutRef.current = performance.now() + 450;
              centrirajRef.current();
            }}
            onClick={dodir(p.id, () => reci(p))}
          >
            <span className="izo-setac-hod">
              <span className="izo-setac-lik">
                <LikAvatar p={p} mood="dan" />
              </span>
              {balon === p.id ? (
                <span className="ziva-balon" role="status">
                  {p.rec || "Prašina."}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
      {Array.from({ length: kolaN }, (_, i) => {
        const ruta = rute[0];
        const start = ruta ? tockaNaPutu(ruta.tocke, 0.2 + i * 0.35) : { x: 0, y: 0 };
        return (
          <span
            key={`kola${i}`}
            className="izo-kola-agent"
            data-agent="kola"
            style={{ transform: `translate3d(${start.x}px, ${start.y}px, 0)` }}
            aria-hidden
          />
        );
      })}
      {hodaci.length > 0 && rute[0] ? (
        <span
          className="izo-pas"
          data-agent="pas"
          style={{ transform: `translate3d(${tockaNaPutu(rute[0].tocke, 0.955).x}px, ${tockaNaPutu(rute[0].tocke, 0.955).y}px, 0)` }}
          aria-hidden
        >
          <i />
        </span>
      ) : null}
    </span>
  );
}
