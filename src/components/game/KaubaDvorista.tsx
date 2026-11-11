/**
 * 0.9.176: dvorišta oko zgrada (23 + t436u), vrt travara (t439u) i mali trg (t437u).
 * Statični SVG sloj: svaki ukras je jedan <use> na <symbol> iz <defs> (malo DOM čvorova),
 * popis je stalan i memoiziran; prikazuju se samo dvorišta izgrađenih zgrada.
 */
import { memo, useMemo, type CSSProperties } from "react";
import { Raslina } from "@/components/game/KaubaObzor";
import { dvorista } from "@/lib/game/dvorista";
import { TRG, TRG_STVARI, TRG_FENJER_KUT, vrhFenjera, type TrgStvar } from "@/lib/game/trg";
import type { Gradevine } from "@/lib/game/types";

const SJENA = "#2b181455";

/** Simboli ukrasa (ishodište = dodir s tlom, gleda desno). */
export function DvSimboli() {
  return (
    <>
      <symbol id="dv-kamencici" overflow="visible">
        <ellipse cx={-2.6} cy={0.4} rx={2.2} ry={1.2} fill="#8d8478" />
        <ellipse cx={1.8} cy={1.2} rx={1.6} ry={0.9} fill="#a39a8c" />
        <ellipse cx={0.6} cy={-1.2} rx={1.2} ry={0.7} fill="#6f675c" />
        <ellipse cx={-2.9} cy={0} rx={0.8} ry={0.35} fill="#d7cdb8aa" />
      </symbol>
      <symbol id="dv-grm" overflow="visible">
        <ellipse cx={1} cy={1.2} rx={6.4} ry={1.8} fill={SJENA} />
        <circle cx={-2.6} cy={-2.4} r={3.2} fill="#3d642c" />
        <circle cx={2.4} cy={-2.2} r={3} fill="#2f5226" />
        <circle cx={0} cy={-4.6} r={3.2} fill="#4e7a38" />
        <circle cx={-0.8} cy={-5.6} r={1.2} fill="#7a9a50" />
      </symbol>
      <symbol id="dv-cvijece" overflow="visible">
        <ellipse cx={0} cy={0.8} rx={4.2} ry={1.3} fill={SJENA} />
        <path d="M-3 0 L-2.2 -4 M-0.6 0 L-0.2 -5.2 M1.6 0 L2.4 -4.2 M3 0 L3.8 -2.8" stroke="#4e7a38" strokeWidth={0.9} strokeLinecap="round" />
        <circle cx={-2.2} cy={-4.3} r={1.1} fill="#e86a7a" />
        <circle cx={-0.2} cy={-5.5} r={1.1} fill="#f4d04a" />
        <circle cx={2.4} cy={-4.5} r={1.1} fill="#f2f0e8" />
        <circle cx={3.8} cy={-3} r={0.9} fill="#c06ad8" />
      </symbol>
      <symbol id="dv-bilje" overflow="visible">
        <ellipse cx={0} cy={0.8} rx={4.4} ry={1.3} fill={SJENA} />
        <path d="M-3.4 0 Q-3.6 -3 -2.4 -5.4 M-1.2 0 Q-1.4 -4 -0.4 -6.6 M1 0 Q1.2 -3.4 2.4 -5.8 M3 0 Q3.4 -2.4 4 -3.8" stroke="#5c8a46" strokeWidth={1.1} fill="none" strokeLinecap="round" />
        <path d="M-2.6 -5 L-2.2 -6.6 M-0.4 -6.4 L-0.1 -8 M2.4 -5.6 L2.8 -7" stroke="#9a7ad0" strokeWidth={1.4} strokeLinecap="round" />
        <ellipse cx={-1.8} cy={-2.4} rx={1.2} ry={0.6} fill="#7aa45a" />
        <ellipse cx={1.8} cy={-2.8} rx={1.2} ry={0.6} fill="#6a9a4a" />
      </symbol>
      <symbol id="dv-lonac" overflow="visible">
        <ellipse cx={0.6} cy={0.8} rx={3.4} ry={1.1} fill={SJENA} />
        <path d="M-2.4 -3.6 L2.4 -3.6 L1.7 0.4 L-1.7 0.4 Z" fill="#b8643a" stroke="#6a3418" strokeWidth={0.5} />
        <circle cx={-1} cy={-5} r={1.6} fill="#3f6b34" />
        <circle cx={1.1} cy={-5.2} r={1.5} fill="#4e7a38" />
        <circle cx={-0.6} cy={-6.2} r={0.9} fill="#e86a7a" />
        <circle cx={1.3} cy={-6} r={0.8} fill="#f4d04a" />
      </symbol>
      <symbol id="dv-bacva" overflow="visible">
        <ellipse cx={1} cy={0.8} rx={4.6} ry={1.4} fill={SJENA} />
        <path d="M-3.4 -7 Q-4.2 -3.4 -3.4 0 L3.4 0 Q4.2 -3.4 3.4 -7 Z" fill="#7a4626" stroke="#3a2014" strokeWidth={0.6} />
        <ellipse cx={0} cy={-7} rx={3.4} ry={1.2} fill="#8f5a34" stroke="#3a2014" strokeWidth={0.5} />
        <path d="M-3.9 -5.2 L3.9 -5.2 M-3.9 -1.8 L3.9 -1.8" stroke="#2a1a10" strokeWidth={0.7} />
      </symbol>
      <symbol id="dv-sanduk" overflow="visible">
        <ellipse cx={1.2} cy={0.8} rx={5.6} ry={1.5} fill={SJENA} />
        <path d="M-4.6 -1 L0 1.2 L0 -4.4 L-4.6 -6.6 Z" fill="#9a6a3c" stroke="#4a2c16" strokeWidth={0.5} />
        <path d="M0 1.2 L4.6 -1 L4.6 -6.6 L0 -4.4 Z" fill="#7a4e2c" stroke="#4a2c16" strokeWidth={0.5} />
        <path d="M-4.6 -6.6 L0 -8.8 L4.6 -6.6 L0 -4.4 Z" fill="#b8844e" stroke="#4a2c16" strokeWidth={0.5} />
        <path d="M-4.2 -1.6 L-0.4 -5.6 M0.4 -0.8 L4.2 -5.8" stroke="#5a3a1e" strokeWidth={0.5} />
      </symbol>
      <symbol id="dv-privez" overflow="visible">
        <ellipse cx={0} cy={0.8} rx={8.4} ry={1.4} fill={SJENA} />
        <path d="M-6.4 0.4 L-6.4 -6.4 M6.4 0.4 L6.4 -6.4" stroke="#4a2c16" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M-7.4 -5.6 L7.4 -5.6" stroke="#7a4e2c" strokeWidth={1.3} strokeLinecap="round" />
        <path d="M-2 -5.4 Q-1.4 -3.6 -2.4 -2.4" stroke="#c9a56c" strokeWidth={0.6} fill="none" />
      </symbol>
      <symbol id="dv-sijeno" overflow="visible">
        <ellipse cx={1} cy={0.8} rx={6.8} ry={1.6} fill={SJENA} />
        <rect x={-6} y={-6.2} width={12} height={6.6} rx={2.2} fill="#e2c06a" stroke="#8a6230" strokeWidth={0.6} />
        <path d="M-2.4 -6.2 L-2.4 0.4 M2.4 -6.2 L2.4 0.4" stroke="#8a6230" strokeWidth={0.6} />
        <path d="M-5 -4.4 L5 -4.6" stroke="#f4dc94" strokeWidth={0.6} />
      </symbol>
      <symbol id="dv-nakovanj" overflow="visible">
        <ellipse cx={0.6} cy={0.8} rx={5} ry={1.4} fill={SJENA} />
        <path d="M-2.4 0.4 L-2 -3.4 L2 -3.4 L2.4 0.4 Z" fill="#6a4328" />
        <path d="M-4.8 -3.4 L3.4 -3.4 Q5.4 -4 5.6 -5.6 L-3.4 -5.6 Q-4.8 -5 -4.8 -3.4 Z" fill="#3a3a40" stroke="#16161a" strokeWidth={0.5} />
        <path d="M-3.4 -5.6 L5.4 -5.6" stroke="#8a8a96" strokeWidth={0.5} />
      </symbol>
      <symbol id="dv-ugljen" overflow="visible">
        <ellipse cx={0} cy={0.3} rx={5} ry={1.8} fill="#1e1a18" />
        <path d="M-4 0 Q-2 -3.6 0 -3.8 Q2.4 -3.4 4 0 Z" fill="#2a2624" />
        <circle cx={-1.4} cy={-1.6} r={0.6} fill="#5a524c" />
        <circle cx={1.2} cy={-2.4} r={0.5} fill="#6a625a" />
        <circle cx={2.2} cy={-0.8} r={0.4} fill="#ff8a3a88" />
      </symbol>
      <symbol id="dv-trupci" overflow="visible">
        <ellipse cx={1} cy={0.8} rx={8.6} ry={1.8} fill={SJENA} />
        <rect x={-7} y={-3.2} width={13} height={3.4} rx={1.6} fill="#8a5a32" stroke="#4a2c16" strokeWidth={0.5} />
        <rect x={-6} y={-6.2} width={12} height={3.2} rx={1.5} fill="#7a4e2c" stroke="#4a2c16" strokeWidth={0.5} />
        <circle cx={6} cy={-1.5} r={1.7} fill="#d8b07a" stroke="#6a4328" strokeWidth={0.5} />
        <circle cx={6} cy={-4.6} r={1.6} fill="#e2bc86" stroke="#6a4328" strokeWidth={0.5} />
        <circle cx={6} cy={-1.5} r={0.5} fill="#8a5a32" />
      </symbol>
      <symbol id="dv-drva" overflow="visible">
        <ellipse cx={0.6} cy={0.8} rx={6.8} ry={1.6} fill={SJENA} />
        {[-4.2, -1.4, 1.4, 4.2].map((x) => (
          <circle key={`a${x}`} cx={x} cy={-1.4} r={1.4} fill="#c9935a" stroke="#5a3a1e" strokeWidth={0.45} />
        ))}
        {[-2.8, 0, 2.8].map((x) => (
          <circle key={`b${x}`} cx={x} cy={-3.9} r={1.4} fill="#b8844e" stroke="#5a3a1e" strokeWidth={0.45} />
        ))}
        <circle cx={-1.4} cy={-6.3} r={1.4} fill="#d8a46a" stroke="#5a3a1e" strokeWidth={0.45} />
        <circle cx={1.4} cy={-6.3} r={1.4} fill="#c9935a" stroke="#5a3a1e" strokeWidth={0.45} />
      </symbol>
      <symbol id="dv-klupa" overflow="visible">
        <ellipse cx={0.6} cy={0.8} rx={7.2} ry={1.4} fill={SJENA} />
        <path d="M-5.4 0.4 L-5.4 -2.6 M5.4 0.4 L5.4 -2.6" stroke="#3a2414" strokeWidth={1.1} />
        <rect x={-6.6} y={-3.6} width={13.2} height={1.8} rx={0.5} fill="#9a6a3c" stroke="#4a2c16" strokeWidth={0.4} />
        <rect x={-6.6} y={-6.8} width={13.2} height={1.6} rx={0.5} fill="#8a5a32" stroke="#4a2c16" strokeWidth={0.4} />
        <path d="M-5.6 -5.2 L-5.6 -3.6 M5.6 -5.2 L5.6 -3.6" stroke="#3a2414" strokeWidth={0.9} />
      </symbol>
      <symbol id="dv-vreca" overflow="visible">
        <ellipse cx={0.6} cy={0.8} rx={4.2} ry={1.2} fill={SJENA} />
        <path d="M-3.2 0.4 Q-4 -3.6 -1.4 -5.4 L-1.8 -6.6 L1.8 -6.6 L1.4 -5.4 Q4 -3.6 3.2 0.4 Z" fill="#d8c49a" stroke="#7a6440" strokeWidth={0.5} />
        <path d="M-1.6 -5.6 L1.6 -5.6" stroke="#7a6440" strokeWidth={0.6} />
      </symbol>
      <symbol id="dv-kanta" overflow="visible">
        <ellipse cx={0.4} cy={0.6} rx={3} ry={1} fill={SJENA} />
        <path d="M-2.2 -4 L2.2 -4 L1.7 0.2 L-1.7 0.2 Z" fill="#8a8a8e" stroke="#3a3a40" strokeWidth={0.5} />
        <ellipse cx={0} cy={-4} rx={2.2} ry={0.7} fill="#4a6a7a" />
        <path d="M-2.2 -4 Q0 -7 2.2 -4" stroke="#3a3a40" strokeWidth={0.5} fill="none" />
      </symbol>
      <symbol id="dv-kolo" overflow="visible">
        <ellipse cx={1.4} cy={0.8} rx={4.6} ry={1.2} fill={SJENA} />
        <circle cx={0} cy={-4.4} r={4.2} fill="none" stroke="#5a3a1e" strokeWidth={1.1} />
        <path d="M0 -8.6 L0 -0.2 M-4.2 -4.4 L4.2 -4.4 M-3 -7.4 L3 -1.4 M3 -7.4 L-3 -1.4" stroke="#7a4e2c" strokeWidth={0.6} />
        <circle cx={0} cy={-4.4} r={0.9} fill="#3a2414" />
      </symbol>
      <symbol id="dv-gredica" overflow="visible">
        <path d="M-10 0 L0 -5 L10 0 L0 5 Z" fill="#5a3a24" stroke="#7a5a3a" strokeWidth={0.8} />
        {[-6, -2, 2, 6].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-x * 0.15 - 0.6} r={1.5} fill="#5c8a46" />
            <circle cx={x - 1} cy={-x * 0.15 + 1.4} r={1.1} fill="#4e7a38" />
          </g>
        ))}
        <circle cx={-2} cy={-1.8} r={0.7} fill="#9a7ad0" />
        <circle cx={4} cy={-1.6} r={0.7} fill="#f4d04a" />
      </symbol>
      {/* trg (0.9.177, t446u) */}
      <TrgSimboli />
    </>
  );
}

function useDvorista(gradevine: Gradevine) {
  const kljuc = Object.keys(gradevine)
    .filter((k) => (gradevine[k as keyof Gradevine] || 0) > 0)
    .sort()
    .join(",");
  return useMemo(() => {
    const ima = new Set(kljuc.split(","));
    const d = dvorista();
    return {
      ukrasi: d.ukrasi.filter((u) => ima.has(u.zgrada)).sort((a, b) => a.y - b.y || a.x - b.x),
      gazeno: d.gazeno.filter((_, i) => ima.has(d.gazenoZgrade[i]!)),
    };
  }, [kljuc]);
}

/** Utabano tlo pred vratima (ispod staza i ukrasa). */
export const KaubaGazeno = memo(function KaubaGazeno({ gradevine }: { gradevine: Gradevine }) {
  const { gazeno } = useDvorista(gradevine);
  return (
    <g className="izo-gazeno-sloj">
      {gazeno.map((g, i) => (
        <ellipse key={i} className="izo-gazeno" cx={g.x} cy={g.y} rx={g.rx} ry={g.ry} transform={`rotate(${g.kut * 0.35} ${g.x} ${g.y})`} />
      ))}
    </g>
  );
});

export const KaubaDvorista = memo(function KaubaDvorista({ gradevine }: { gradevine: Gradevine }) {
  const { ukrasi } = useDvorista(gradevine);
  return (
    <g className="izo-dvorista" data-ukrasa={ukrasi.length}>
      {ukrasi.map((u) => (
        <use
          key={u.id}
          href={`#dv-${u.tip}`}
          className="izo-dv"
          data-dv={u.tip}
          data-zgrada={u.zgrada}
          transform={`translate(${u.x} ${u.y}) scale(${u.zrcalo ? -u.sc : u.sc} ${u.sc})`}
        />
      ))}
    </g>
  );
});

/** 0.9.177: izometrijska kutija (gornja ploha + lijeva svjetlija + desna tamnija strana). */
function IsoKutija({ w, h, y = 0, x = 0, gore, lijevo, desno, rub = "#3a2a1c" }: { w: number; h: number; y?: number; x?: number; gore: string; lijevo: string; desno: string; rub?: string }) {
  const d = w / 2;
  const t = y - h;
  return (
    <>
      <path d={`M${x - w} ${t} L${x} ${t + d} L${x} ${y + d} L${x - w} ${y} Z`} fill={lijevo} stroke={rub} strokeWidth={0.4} strokeLinejoin="round" />
      <path d={`M${x} ${t + d} L${x + w} ${t} L${x + w} ${y} L${x} ${y + d} Z`} fill={desno} stroke={rub} strokeWidth={0.4} strokeLinejoin="round" />
      <path d={`M${x - w} ${t} L${x} ${t - d} L${x + w} ${t} L${x} ${t + d} Z`} fill={gore} stroke={rub} strokeWidth={0.4} strokeLinejoin="round" />
    </>
  );
}

/** Zid okrugle posude (iso valjak): bok od y do y+h ispod gornjeg ruba. */
function Posuda({ rx, ry, y, h, bok, vrh, voda, rub = "#4a4238" }: { rx: number; ry: number; y: number; h: number; bok: string; vrh: string; voda?: string; rub?: string }) {
  return (
    <>
      <path d={`M${-rx} ${y} L${-rx} ${y + h} A${rx} ${ry} 0 0 0 ${rx} ${y + h} L${rx} ${y} Z`} fill={bok} stroke={rub} strokeWidth={0.45} />
      <ellipse cx={0} cy={y} rx={rx} ry={ry} fill={vrh} stroke={rub} strokeWidth={0.45} />
      {voda ? <ellipse cx={0} cy={y + 0.2} rx={rx * 0.82} ry={ry * 0.74} fill={voda} /> : null}
    </>
  );
}

const CVJETOVI = ["#a8645a", "#bc9c52", "#cdbf9e", "#866a7c", "#b47a50"];

/** Simboli trga (ishodište = dodir s tlom). */
function TrgSimboli() {
  return (
    <>
      <pattern id="trg-kocke" patternUnits="userSpaceOnUse" width={6.4} height={3.8}>
        <rect width={6.4} height={3.8} fill="#8c7450" />
        <ellipse cx={1.6} cy={0.95} rx={1.42} ry={0.78} fill="#a08661" />
        <ellipse cx={4.8} cy={2.85} rx={1.42} ry={0.78} fill="#9a805a" />
        <ellipse cx={1.3} cy={0.75} rx={0.6} ry={0.28} fill="#a98e68" />
        <ellipse cx={4.5} cy={2.65} rx={0.6} ry={0.28} fill="#a68b64" />
        <ellipse cx={-1.6} cy={2.85} rx={1.42} ry={0.78} fill="#977d58" />
        <ellipse cx={8} cy={2.85} rx={1.42} ry={0.78} fill="#977d58" />
      </pattern>
      <radialGradient id="trg-sjaj-g">
        <stop offset="0" stopColor="#f0d79a" stopOpacity={0.5} />
        <stop offset="0.45" stopColor="#e6bf72" stopOpacity={0.2} />
        <stop offset="1" stopColor="#ffcf6a" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="trg-svjetlo-g" cx="0.42" cy="0.4">
        <stop offset="0" stopColor="#e8d8b8" stopOpacity={0.06} />
        <stop offset="1" stopColor="#fff4d8" stopOpacity={0} />
      </radialGradient>

      <symbol id="dv-trg-fontana" overflow="visible">
        <ellipse cx={2} cy={2.6} rx={19} ry={7.8} fill="#2b181430" />
        <Posuda rx={16.5} ry={7.2} y={-3.4} h={3.6} bok="#7f7462" vrh="#9e9178" voda="#4c6764" />
        <path d="M-16.5 -1.4 A16.5 7.2 0 0 0 16.5 -1.4" fill="none" stroke="#5e5646" strokeWidth={0.5} />
        {/* 0.9.178: istrošenost — mrlje od vode i mahovina na zidu bazena */}
        <path d="M-12.4 -1.2 L-12.2 2.2 M-7.6 -0.4 L-7.5 3.2 M-2.2 0 L-2.1 3.6 M5.4 -0.2 L5.3 3.4 M10.8 -0.8 L10.6 2.6" stroke="#4e4638" strokeWidth={1.1} opacity={0.32} strokeLinecap="round" />
        <path d="M-15.6 -2.6 Q-13.4 -1.4 -11 -1.6 Q-12.6 0.2 -15.2 -0.8 Z M-4.4 0.1 Q-1.6 0.9 1.4 0.4 Q-0.8 1.9 -3.8 1.4 Z M8.6 -0.9 Q11.4 -1.6 13.8 -2.8 Q12.8 -0.6 9.4 0.3 Z" fill="#5a6038" opacity={0.75} />
        <path d="M-9.6 -5.6 Q-6.4 -6.8 -3.2 -6.2 M4.2 -6.4 Q7.6 -6.6 10.4 -5.4" stroke="#5a6038" strokeWidth={0.6} fill="none" opacity={0.6} />
        <ellipse cx={0.6} cy={-2.6} rx={9.5} ry={3.7} fill="#435c58" />
        <ellipse cx={-6.5} cy={-4.6} rx={4.6} ry={1.2} fill="#8fa49a" opacity={0.28} />
        <ellipse cx={0} cy={-3.1} rx={6.4} ry={2.5} fill="none" stroke="#94a89e" strokeWidth={0.4} opacity={0.45} />
        <ellipse cx={0} cy={-3.1} rx={11} ry={4.4} fill="none" stroke="#94a89e" strokeWidth={0.3} opacity={0.25} />
        {/* stup i srednja zdjela */}
        <path d="M-2.3 -3.2 L-2 -13 L2 -13 L2.3 -3.2 Z" fill="#958a74" stroke="#5c5448" strokeWidth={0.45} />
        <path d="M0.4 -3.1 L0.4 -13 L2 -13 L2.3 -3.2 Z" fill="#6e6454" />
        <Posuda rx={7.6} ry={3} y={-14.6} h={1.8} bok="#7f7462" vrh="#9e9178" voda="#506c68" />
        <path d="M-1.3 -14.6 L-1.1 -21.4 L1.1 -21.4 L1.3 -14.6 Z" fill="#958a74" stroke="#5c5448" strokeWidth={0.4} />
        <Posuda rx={3.8} ry={1.5} y={-22.4} h={1.1} bok="#7f7462" vrh="#a69880" voda="#56726c" />
        <circle cx={0} cy={-24.4} r={1.25} fill="#a69880" stroke="#5c5448" strokeWidth={0.35} />
        <circle cx={-0.4} cy={-24.8} r={0.4} fill="#b6aa92" />
        {/* mlazovi */}
        <g fill="none" stroke="#a8b8ae" strokeLinecap="round" opacity={0.55}>
          <path d="M-3.6 -22 Q-5.6 -19.6 -6.2 -15.2" strokeWidth={0.7} />
          <path d="M3.6 -22 Q5.6 -19.6 6.2 -15.2" strokeWidth={0.7} />
          <path d="M-0.6 -21 Q-1.2 -18.4 -1.4 -15.6" strokeWidth={0.5} />
          <path d="M-7.4 -14 Q-10.4 -9.6 -11 -4.4" strokeWidth={0.75} />
          <path d="M7.4 -14 Q10.4 -9.6 11 -4.4" strokeWidth={0.75} />
          <path d="M-3.4 -12.6 Q-4.6 -8.4 -4.8 -3.8" strokeWidth={0.55} />
          <path d="M3.4 -12.6 Q4.6 -8.4 4.8 -3.8" strokeWidth={0.55} />
          <path d="M0 -25.4 Q-1.4 -28.6 -3 -26.2" strokeWidth={0.5} />
          <path d="M0 -25.4 Q1.4 -28.6 3 -26.2" strokeWidth={0.5} />
        </g>
        <g fill="#b4c2b8" opacity={0.45}>
          <circle cx={-11} cy={-3.6} r={0.45} />
          <circle cx={11.2} cy={-3.8} r={0.4} />
          <circle cx={-4.6} cy={-3.3} r={0.35} />
          <circle cx={6.2} cy={-14.4} r={0.35} />
        </g>
      </symbol>

      <symbol id="dv-trg-spomenik" overflow="visible">
        <ellipse cx={3} cy={2.4} rx={12} ry={4.4} fill="#2b181433" />
        <IsoKutija w={9} h={2} gore="#9e9178" lijevo="#8f846e" desno="#6e6454" rub="#4a4238" />
        <IsoKutija w={6.4} h={2.6} y={-2} gore="#a69880" lijevo="#958a74" desno="#73695a" rub="#4a4238" />
        <IsoKutija w={3.8} h={6.4} y={-4.6} gore="#ab9e85" lijevo="#9c907a" desno="#7a705e" rub="#4a4238" />
        <path d="M-3 -8.6 L-0.8 -7.5 L-0.8 -5.4 L-3 -6.5 Z" fill="#7e6438" stroke="#4a3416" strokeWidth={0.3} />
        <path d="M-2.6 -11.2 L0 -9.9 L0 -27.6 L-1.3 -28.2 Z" fill="#a99c84" stroke="#4a4238" strokeWidth={0.4} />
        <path d="M0 -9.9 L2.6 -11.2 L1.3 -28.2 L0 -27.6 Z" fill="#7c7262" stroke="#4a4238" strokeWidth={0.4} />
        <path d="M-1.3 -28.2 L0 -27.6 L1.3 -28.2 L0 -31.4 Z" fill="#b3a68c" stroke="#4a4238" strokeWidth={0.35} />
        <path d="M-1.9 -26 L-1.8 -19.4 M-1 -24.4 L-0.9 -14.6 M1.2 -25 L1.5 -17" stroke="#4e4638" strokeWidth={0.5} opacity={0.3} strokeLinecap="round" />
        <path d="M-9 -2 L-7.2 -1.1 L-7.6 0.2 L-9 -0.4 Z M6.6 -1.4 L8.4 -2.2 L8.6 -0.6 Z" fill="#5e5646" opacity={0.55} />
        <path d="M-7.4 0.6 Q-4.4 2.2 -1.2 3.6" stroke="#5a6038" strokeWidth={0.7} fill="none" opacity={0.55} />
        <path
          d="M0 -36.6 L0.75 -34.6 L2.85 -34.55 L1.2 -33.25 L1.8 -31.2 L0 -32.4 L-1.8 -31.2 L-1.2 -33.25 L-2.85 -34.55 L-0.75 -34.6 Z"
          fill="#9a8048"
          stroke="#5a4420"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
        <circle cx={-0.5} cy={-34.6} r={0.45} fill="#b49a5e" opacity={0.7} />
      </symbol>

      <symbol id="dv-trg-fenjer" overflow="visible">
        <ellipse cx={1.2} cy={0.7} rx={3} ry={1} fill="#2b181444" />
        <path d="M-1.4 0.4 L1.4 0.4 L1 -1.6 L-1 -1.6 Z" fill="#2a1a10" />
        <path d="M0 -1.4 L0 -16.4" stroke="#2a1a10" strokeWidth={1.1} />
        <path d="M0 -13.6 L4.6 -13.6 M0 -12.2 Q2 -12.6 3.2 -13.6" stroke="#2a1a10" strokeWidth={0.6} fill="none" />
        <path d="M4.2 -13.6 L4.2 -11.6" stroke="#5a3a1e" strokeWidth={0.35} />
        {/* viseća košarica cvijeća */}
        <path d="M1.8 -11.6 L6.6 -11.6 Q6.4 -8.6 4.2 -8.2 Q2 -8.6 1.8 -11.6 Z" fill="#765a3c" stroke="#45301c" strokeWidth={0.35} />
        <circle cx={2.6} cy={-12} r={0.9} fill="#5a6a3c" />
        <circle cx={4.2} cy={-12.4} r={1} fill="#4a5832" />
        <circle cx={5.8} cy={-12} r={0.9} fill="#5a6a3c" />
        <circle cx={2.9} cy={-12.5} r={0.55} fill="#a8645a" />
        <circle cx={4.6} cy={-13} r={0.55} fill="#bc9c52" />
        <circle cx={5.7} cy={-12.4} r={0.5} fill="#cdbf9e" />
        <path d="M2.2 -9.8 Q1.6 -8 2 -6.8 M6.2 -9.8 Q6.8 -8.2 6.4 -7" stroke="#5a6a3c" strokeWidth={0.45} fill="none" />
        {/* svjetiljka */}
        <path d="M-1.9 -16.4 L1.9 -16.4 L1.5 -20.6 L-1.5 -20.6 Z" className="izo-trg-staklo" stroke="#2a1a10" strokeWidth={0.55} />
        <path d="M0 -16.4 L0 -20.6" stroke="#2a1a1088" strokeWidth={0.35} />
        <path d="M-2.4 -20.6 L0 -22.6 L2.4 -20.6 Z" fill="#2a1a10" />
        <circle cx={0} cy={-23} r={0.55} fill="#2a1a10" />
      </symbol>

      <symbol id="dv-trg-stand" overflow="visible">
        <ellipse cx={1.5} cy={2} rx={15} ry={5} fill="#2b181433" />
        {/* stražnji stupovi */}
        <path d="M-6 -4.6 L-6 -20.4 M12 -3.4 L12 -18.6" stroke="#4a2c16" strokeWidth={1.1} />
        {/* pult */}
        <IsoKutija w={11} h={6.2} gore="#957552" lijevo="#7e6040" desno="#634a32" rub="#4a2c16" />
        <path d="M-10 -1.6 L-1 2.9 M-10 -4 L-1 0.5" stroke="#6a4024" strokeWidth={0.4} />
        {/* roba na pultu */}
        <IsoKutija w={3.2} h={2} x={-4.6} y={-6.6} gore="#9c7c56" lijevo="#7e6040" desno="#634a32" rub="#4a2c16" />
        {[[-6, -9.2, "#a85a3e"], [-4.4, -9.6, "#b0643e"], [-3.2, -9, "#9a5238"], [-5, -8.4, "#b4704a"]].map(([cx, cy, f]) => (
          <circle key={`j${cx}${cy}`} cx={cx as number} cy={cy as number} r={0.95} fill={f as string} />
        ))}
        <IsoKutija w={3} h={2} x={1.6} y={-6.2} gore="#9c7c56" lijevo="#7e6040" desno="#634a32" rub="#4a2c16" />
        <circle cx={0.8} cy={-8.9} r={1.1} fill="#b88c4a" />
        <circle cx={2.6} cy={-8.8} r={1.05} fill="#a07c48" />
        <circle cx={1.6} cy={-9.6} r={0.9} fill="#76844e" />
        <path d="M6.6 -6 Q5.6 -9.4 7.6 -10.6 L7.4 -11.4 L9.4 -11.4 L9.2 -10.6 Q11.2 -9.4 10.2 -6 Z" fill="#bba984" stroke="#6a5838" strokeWidth={0.35} transform="translate(-1.2 1.4)" />
        {/* prednji stupovi */}
        <path d="M-11 -0.4 L-11 -19 M0 5 L0 -13.6" stroke="#5a3a1e" strokeWidth={1.2} />
        {/* tenda na pruge */}
        <path d="M-12.6 -19.6 L-6 -22.8 L13.4 -19.6 L1 -13.4 Z" fill="#cbbb98" stroke="#5a3424" strokeWidth={0.45} strokeLinejoin="round" />
        <path d="M-10.4 -18.5 L-3.8 -21.7 L-1.4 -21.3 L-8 -17.4 Z M-5.6 -16.1 L1 -19.3 L3.6 -18.9 L-3 -15 Z M-0.8 -13.7 L5.8 -16.9 L8.4 -16.5 L1.6 -12.6 Z M6.4 -15.5 L11 -18.3 L13 -18.6 L8.6 -14.8 Z" fill="#8e4c3a" />
        <path d="M-12.6 -19.6 Q-11.4 -17.6 -10.2 -18.4 Q-9 -16.4 -7.8 -17.2 Q-6.6 -15.2 -5.4 -16 Q-4.2 -14 -3 -14.8 Q-1.8 -12.8 -0.6 -13.6 L1 -13.4 Z" fill="#8e4c3a" stroke="#5a3424" strokeWidth={0.35} />
        <path d="M1 -13.4 Q2.4 -12.6 3.4 -14 Q4.8 -13.4 5.8 -14.8 Q7.2 -14.2 8.2 -15.6 Q9.6 -15 10.6 -16.4 Q12 -16 13.4 -19.6 Z" fill="#cbbb98" stroke="#5a3424" strokeWidth={0.35} />
      </symbol>

      <symbol id="dv-trg-cvijece" overflow="visible">
        <ellipse cx={1} cy={1.6} rx={8.4} ry={2.6} fill="#2b181433" />
        <IsoKutija w={7} h={3} gore="#4a3420" lijevo="#7e6040" desno="#634a32" rub="#4a2c16" />
        <path d="M-6.4 -1.6 L-0.4 1.4 M0.4 1.4 L6.4 -1.6" stroke="#6a4024" strokeWidth={0.35} />
        {[-4.6, -2.2, 0.2, 2.6, 4.8].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={-4.4 - (i % 2) * 0.8 + Math.abs(x) * 0.12} r={1.55} fill={i % 2 ? "#4a5832" : "#5a6a3c"} />
            <circle cx={x + 0.3} cy={-5.4 - (i % 2) * 0.8 + Math.abs(x) * 0.12} r={0.72} fill={CVJETOVI[i]!} />
            <circle cx={x - 0.8} cy={-4.2 - (i % 2) * 0.6 + Math.abs(x) * 0.12} r={0.55} fill={CVJETOVI[(i + 2) % 5]!} />
          </g>
        ))}
        <path d="M-6.6 -3.2 Q-7.6 -1.6 -7 0 M6.8 -3.4 Q7.8 -1.8 7.2 -0.2" stroke="#5a6a3c" strokeWidth={0.5} fill="none" />
      </symbol>

      <symbol id="dv-trg-ploca" overflow="visible">
        <ellipse cx={1.2} cy={1} rx={8.6} ry={1.8} fill="#2b181433" />
        <path d="M-6 0.6 L-6 -15.4 M6 0.6 L6 -15.4" stroke="#4a2c16" strokeWidth={1.3} strokeLinecap="round" />
        <rect x={-7.4} y={-14.6} width={14.8} height={9.6} rx={0.5} fill="#765a3c" stroke="#45301c" strokeWidth={0.5} />
        <path d="M-7.4 -11.4 L7.4 -11.4 M-7.4 -8.2 L7.4 -8.2" stroke="#6a4024" strokeWidth={0.35} />
        <path d="M-8.6 -15.2 L8.6 -15.2 L7.6 -16.8 L-7.6 -16.8 Z" fill="#5a3a1e" stroke="#2a180c" strokeWidth={0.35} />
        <rect x={-6} y={-13.6} width={4.4} height={5.6} fill="#c4b494" stroke="#9a8460" strokeWidth={0.25} transform="rotate(-4 -3.8 -10.8)" />
        <circle cx={-3.8} cy={-11.6} r={1.1} fill="#5a4630" />
        <path d="M-5.4 -9.4 L-2.2 -9.4 M-5.4 -8.6 L-2.6 -8.6" stroke="#5a4630" strokeWidth={0.3} />
        <path d="M-5.4 -13.2 L-2.2 -13.2" stroke="#7a4434" strokeWidth={0.5} />
        <rect x={-0.6} y={-12.8} width={3.4} height={4.4} fill="#cbbc9c" stroke="#9a8460" strokeWidth={0.25} transform="rotate(5 1.1 -10.6)" />
        <path d="M0 -11.6 L2.2 -11.6 M0 -10.8 L2 -10.8 M0 -10 L1.6 -10" stroke="#6a5a40" strokeWidth={0.25} />
        <rect x={3.4} y={-13.8} width={2.8} height={3.2} fill="#bba780" stroke="#9a8460" strokeWidth={0.25} transform="rotate(-6 4.8 -12.2)" />
        <circle cx={-3.8} cy={-13.4} r={0.35} fill="#8e4c3a" />
        <circle cx={1.1} cy={-12.6} r={0.35} fill="#5a6a74" />
      </symbol>

      <symbol id="dv-trg-privez" overflow="visible">
        <ellipse cx={2.4} cy={1.2} rx={13} ry={2.4} fill="#2b181433" />
        <path d="M-9 0.4 L-9 -7.4 M0 0.4 L0 -7.4" stroke="#4a2c16" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M-10.2 -6.6 L1.2 -6.6" stroke="#6a5038" strokeWidth={1.3} strokeLinecap="round" />
        <path d="M-5.6 -6.4 Q-5 -4.4 -6 -3" stroke="#a48a62" strokeWidth={0.55} fill="none" />
        <IsoKutija w={5.6} h={3.2} x={7} y={1} gore="#5a3a24" lijevo="#7a5c3e" desno="#6a4024" rub="#3a2414" />
        <path d="M2.4 -2.2 L7 -4.4 L11.6 -2.2 L7 0 Z" fill="#4c6764" />
        <path d="M4.2 -2.4 L6.6 -3.4" stroke="#8fa49a" strokeWidth={0.4} />
      </symbol>

      <symbol id="dv-trg-golub" overflow="visible">
        <ellipse cx={0.2} cy={0.4} rx={2.2} ry={0.6} fill="#2b181433" />
        <path d="M-2.6 -1.4 L-1.2 -1.6 L-1.4 -0.8 Z" fill="#5a5a66" />
        <ellipse cx={-0.2} cy={-1.4} rx={1.9} ry={1.15} fill="#8e8e9c" />
        <ellipse cx={-0.6} cy={-1.7} rx={1} ry={0.55} fill="#a8a8b6" />
        <circle cx={1.5} cy={-2.6} r={0.8} fill="#6a6a7a" />
        <path d="M2.2 -2.6 L3 -2.4 L2.2 -2.2 Z" fill="#c8a060" />
        <path d="M0.9 -1.9 Q1.3 -1.5 1.4 -1.1" stroke="#7aa48a" strokeWidth={0.4} fill="none" />
        <path d="M-0.4 -0.3 L-0.4 0.4 M0.4 -0.3 L0.4 0.4" stroke="#c86a5a" strokeWidth={0.3} />
      </symbol>

      <symbol id="dv-trg-macka" overflow="visible">
        <ellipse cx={0.6} cy={0.5} rx={3} ry={0.9} fill="#2b181444" />
        <path d="M1.6 -0.2 Q4.4 -0.4 4.2 -2.6 Q4 -3.6 3.2 -3.4" stroke="#9a6440" strokeWidth={0.75} fill="none" strokeLinecap="round" />
        <ellipse cx={0} cy={-2.2} rx={2} ry={2.5} fill="#a87048" />
        <path d="M-1.4 -1.4 Q0 -0.4 1.4 -1.4 M-1.6 -2.6 Q0 -1.8 1.6 -2.6" stroke="#8a5c3a" strokeWidth={0.35} fill="none" />
        <circle cx={0.2} cy={-5.2} r={1.55} fill="#ae774c" />
        <path d="M-1.2 -6 L-1 -7.6 L0 -6.4 Z M0.6 -6.4 L1.6 -7.6 L1.6 -5.8 Z" fill="#a87048" />
        <circle cx={-0.3} cy={-5.3} r={0.22} fill="#2a2010" />
        <circle cx={0.8} cy={-5.3} r={0.22} fill="#2a2010" />
        <ellipse cx={0.3} cy={-4.6} rx={0.6} ry={0.35} fill="#d0c0a6" />
      </symbol>

      <symbol id="dv-trg-klupa-iza" overflow="visible">
        <path d="M-9 -2.2 A9 4.4 0 0 1 9 -2.2" fill="none" stroke="#6a4024" strokeWidth={2.8} />
        <path d="M-9 -3 A9 4.4 0 0 1 9 -3" fill="none" stroke="#8a6a48" strokeWidth={2} />
        <path d="M-9.4 -5.6 A9.4 4.6 0 0 1 9.4 -5.6" fill="none" stroke="#7a5c3e" strokeWidth={1} />
        <path d="M-6.4 -5.4 L-6.4 -3.6 M0 -8.2 L0 -6 M6.4 -5.4 L6.4 -3.6" stroke="#4a2c16" strokeWidth={0.7} />
      </symbol>
      <symbol id="dv-trg-klupa-krug" overflow="visible">
        <ellipse cx={1} cy={0.6} rx={11.6} ry={4.6} fill="#2b181433" />
        <path d="M-9 -2.2 A9 4.4 0 0 0 9 -2.2" fill="none" stroke="#5a3820" strokeWidth={3.2} />
        <path d="M-9 -3 A9 4.4 0 0 0 9 -3" fill="none" stroke="#937352" strokeWidth={2.1} />
        <path d="M-6.2 0.4 L-6.2 1.6 M0 2.2 L0 3.4 M6.2 0.4 L6.2 1.6" stroke="#3a2414" strokeWidth={0.9} />
      </symbol>
    </>
  );
}

const TIP_SIMBOLA: Record<string, string> = {
  fontana: "dv-trg-fontana",
  spomenik: "dv-trg-spomenik",
  fenjer: "dv-trg-fenjer",
  stand: "dv-trg-stand",
  cvijece: "dv-trg-cvijece",
  ploca: "dv-trg-ploca",
  privez: "dv-trg-privez",
  golub: "dv-trg-golub",
  macka: "dv-trg-macka",
  "klupa-krug": "dv-trg-klupa-krug",
  klupa: "dv-klupa",
  lonac: "dv-lonac",
};

/** Luk (lančanica) između dvije točke s progibom `p`. */
function luk(a: { x: number; y: number }, b: { x: number; y: number }, p: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + p * 2;
  return { d: `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`, na: (t: number) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * b.y }) };
}

const ZASTAVICE = ["#8e5442", "#c2b394", "#5a6a72", "#a08450"];

/** Lampice (stražnji luk) i zastavice (bočni lukovi) — sve kao nekoliko staza. */
function trgUkrasi() {
  const v = [0, 1, 2, 3].map(vrhFenjera);
  const lampice = luk(v[0]!, v[1]!, 4.2);
  const zarulje = Array.from({ length: 11 }, (_, i) => lampice.na((i + 1) / 12));
  const strane = [luk(v[0]!, v[3]!, 3.2), luk(v[1]!, v[2]!, 3.2)];
  const boje = ZASTAVICE.map(() => [] as string[]);
  let k = 0;
  for (const s of strane)
    for (let i = 1; i < 8; i++) {
      const m = s.na(i / 8);
      // trokut visi okomito prema dolje, licem prema gledatelju (gornji rub vodoravan)
      const a = { x: m.x - 1.5, y: m.y };
      const b = { x: m.x + 1.5, y: m.y };
      const vrh = { x: m.x, y: m.y + 3.4 };
      boje[k++ % 4]!.push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} L${vrh.x.toFixed(1)} ${vrh.y.toFixed(1)} Z`);
    }
  return { lampice: lampice.d, zarulje, uzice: strane.map((s) => s.d), zastavice: boje.map((b) => b.join(" ")) };
}

/** Kocke trga: 8 zraka od fontane do ruba (jedna svijetla i jedna tamna staza). */
function zrake(x: number, y: number, rx: number, ry: number) {
  let svj = "";
  let tam = "";
  for (let i = 0; i < 8; i++) {
    const k = ((i + 0.5) / 8) * Math.PI * 2;
    const c = Math.cos(k);
    const s = Math.sin(k);
    const a = { x: x + c * 23, y: y + s * 10.6 };
    const b = { x: x + c * (rx - 2.6), y: y + s * (ry - 1.6) };
    svj += `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} `;
    tam += `M${a.x.toFixed(1)} ${(a.y + 0.75).toFixed(1)} L${b.x.toFixed(1)} ${(b.y + 0.75).toFixed(1)} `;
  }
  return { svj: svj.trim(), tam: tam.trim() };
}

/**
 * 0.9.178 (t459u): trošenje trga — falile kocke, pukotine, pijesak nanesen preko ruba.
 * Sve su to po tri staze (deterministično), da broj čvorova karte ostane malen.
 */
function trosenje(x: number, y: number, rx: number, ry: number) {
  const elipsa = (cx: number, cy: number, a: number, b: number) =>
    `M${(cx - a).toFixed(1)} ${cy.toFixed(1)} A${a.toFixed(1)} ${b.toFixed(1)} 0 1 0 ${(cx + a).toFixed(1)} ${cy.toFixed(1)} A${a.toFixed(1)} ${b.toFixed(1)} 0 1 0 ${(cx - a).toFixed(1)} ${cy.toFixed(1)} Z `;
  // falile kocke (rupe s tamnijim tlom), raspoređene po prstenu između sredine i ruba
  const RUPE: Array<[number, number, number]> = [
    [0.35, 0.62, 1.6], [0.9, 0.8, 1.2], [1.55, 0.7, 1.4], [2.2, 0.86, 1.1], [2.75, 0.58, 1.5],
    [3.4, 0.78, 1.3], [3.95, 0.66, 1.2], [4.6, 0.84, 1.6], [5.3, 0.6, 1.2], [5.85, 0.75, 1.4],
  ];
  let rupe = "";
  for (const [k, r, v] of RUPE) rupe += elipsa(x + Math.cos(k) * rx * r, y + Math.sin(k) * ry * r, v * 1.5, v * 0.75);
  // pukotine
  let pukotine = "";
  for (const [k, r] of [[0.6, 0.5], [2.5, 0.62], [4.1, 0.48], [5.6, 0.55]] as const) {
    const a = { x: x + Math.cos(k) * rx * r, y: y + Math.sin(k) * ry * r };
    pukotine += `M${a.x.toFixed(1)} ${a.y.toFixed(1)} l${(Math.cos(k) * 4).toFixed(1)} ${(Math.sin(k) * 1.6 + 0.8).toFixed(1)} l${(Math.cos(k + 0.9) * 3).toFixed(1)} ${(Math.sin(k + 0.9) * 1.2).toFixed(1)} `;
  }
  // nanosi pijeska preko ruba (boja tla karte), deblji na vjetrovitoj (lijevoj i donjoj) strani
  const NANOSI: Array<[number, number, number]> = [
    [2.6, 11, 3.6], [3.1, 8, 2.6], [1.75, 9, 2.8], [1.2, 7, 2.2], [3.75, 6.5, 2.1], [0.4, 6, 1.9], [4.9, 5.5, 1.8], [5.7, 7.5, 2.2],
  ];
  let pijesak = "";
  for (const [k, a, b] of NANOSI) pijesak += elipsa(x + Math.cos(k) * (rx + 0.5), y + Math.sin(k) * (ry + 0.6), a, b);
  return { rupe: rupe.trim(), pukotine: pukotine.trim(), pijesak: pijesak.trim() };
}

/**
 * Trg (0.9.177, t446u): popločan (uzorak kocki), rub od kamenih blokova, zrake, fontana na tri kata,
 * spomenik, hlad s kružnom klupom, štand, korita, fenjeri s košaricama, lampice, zastavice, privez,
 * oglasna ploča, golubovi i mačka. Statično: memo, bez stanja; noću svijetle fenjeri i lampice (CSS).
 * Kapljice fontane su zaseban mali HTML sloj (KaubaTrgVoda), da animacija ne prebojava SVG karte.
 */
export const KaubaTrg = memo(function KaubaTrg() {
  if (!TRG) return null;
  const { x, y, rx, ry } = TRG;
  const z = zrake(x, y, rx, ry);
  const u = trgUkrasi();
  const w = trosenje(x, y, rx, ry);
  const fenjeri = TRG_FENJER_KUT.map((_, i) => vrhFenjera(i));
  const stvari = [...TRG_STVARI].sort((a, b) => (a.z ?? a.y) - (b.z ?? b.y) || a.x - b.x);
  const crtaj = (s: TrgStvar, i: number) => {
    if (s.tip === "drvo")
      return (
        <g key={i} className="izo-drvo" data-trg-stvar="drvo" transform={`translate(${s.cx ?? s.x} ${s.cy ?? s.y})`}>
          <Raslina tip={0} sc={s.sc} />
        </g>
      );
    const sc = s.tip === "klupa" || s.tip === "lonac" ? 1.15 * s.sc : s.sc;
    return (
      <use
        key={i}
        href={`#${TIP_SIMBOLA[s.tip] ?? `dv-${s.tip}`}`}
        className="izo-dv"
        data-trg-stvar={s.tip}
        transform={`translate(${s.x} ${s.y})${s.okret ? ` rotate(${s.okret * 0.25})` : ""} scale(${s.zrcalo ? -sc : sc} ${sc})`}
      />
    );
  };
  // stražnja polovica kružne klupe ide ispod debla (z malo manji od drveta)
  const krug = TRG_STVARI.find((s) => s.tip === "klupa-krug");
  return (
    <g className="izo-trg" data-trg="1">
      <ellipse cx={x + 3} cy={y + 4} rx={rx + 7} ry={ry + 4} fill="#2b181424" />
      <ellipse className="izo-trg-bok" cx={x} cy={y + 1.4} rx={rx + 3} ry={ry + 1.8} />
      <ellipse className="izo-trg-rub" cx={x} cy={y} rx={rx + 3} ry={ry + 1.8} />
      <ellipse className="izo-trg-blokovi" cx={x} cy={y} rx={rx + 1.4} ry={ry + 1} />
      <ellipse className="izo-trg-plocnik" cx={x} cy={y} rx={rx - 0.6} ry={ry - 0.4} fill="url(#trg-kocke)" />
      <path className="izo-trg-zraka is-tamna" d={z.tam} />
      <path className="izo-trg-zraka" d={z.svj} />
      <ellipse className="izo-trg-sredina" cx={x} cy={y + 0.6} rx={23} ry={10.6} />
      <ellipse className="izo-trg-sredina-rub" cx={x} cy={y + 0.6} rx={23} ry={10.6} />
      <path className="izo-trg-rupe" d={w.rupe} />
      <path className="izo-trg-pukotine" d={w.pukotine} />
      <path className="izo-trg-pijesak" d={w.pijesak} />
      {/* noćni sjaj na tlu ispod fenjera (vidljiv samo noću i u sumrak) */}
      {fenjeri.map((f, i) => (
        <ellipse key={`sj${i}`} className="izo-trg-sjaj" cx={f.x} cy={f.y + 19} rx={16} ry={7.4} fill="url(#trg-sjaj-g)" />
      ))}
      {krug ? <use href="#dv-trg-klupa-iza" className="izo-dv" data-trg-stvar="klupa-krug-iza" transform={`translate(${krug.x} ${krug.y}) scale(${krug.sc})`} /> : null}
      {stvari.map(crtaj)}
      {/* lampice i zastavice nad trgom */}
      <path className="izo-trg-uzica" d={u.lampice} />
      {u.uzice.map((d, i) => (
        <path key={`uz${i}`} className="izo-trg-uzica" d={d} />
      ))}
      {u.zastavice.map((d, i) => (
        <path key={`zs${i}`} className="izo-trg-zastavica" d={d} fill={ZASTAVICE[i]} />
      ))}
      <g className="izo-trg-zarulje">
        {u.zarulje.map((p, i) => (
          <circle key={`zr${i}`} cx={p.x.toFixed(1)} cy={(p.y + 0.9).toFixed(1)} r={0.85} />
        ))}
      </g>
      <g className="izo-trg-sjaj is-glava">
        {fenjeri.map((f, i) => (
          <circle key={`sg${i}`} cx={f.x} cy={f.y + 0.6} r={6} fill="url(#trg-sjaj-g)" />
        ))}
        {u.zarulje.map((p, i) => (
          <circle key={`zg${i}`} cx={p.x.toFixed(1)} cy={(p.y + 0.9).toFixed(1)} r={2.6} fill="url(#trg-sjaj-g)" />
        ))}
      </g>
    </g>
  );
});

/** Kapljice fontane: mali HTML sloj nad trgom (kompozitirane animacije, bez prebojavanja karte). */
export const KaubaTrgVoda = memo(function KaubaTrgVoda() {
  if (!TRG) return null;
  return (
    <span className="izo-trg-voda" aria-hidden style={{ left: TRG.x, top: TRG.y - 26, zIndex: Math.round(TRG.y) }}>
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} style={{ ["--i" as string]: i } as CSSProperties} />
      ))}
    </span>
  );
});
