import { memo } from "react";
import { izvanObora, NASELJE, OBZOR, RASUTE, TRAGOVI } from "@/lib/game/obzorTocke";
import { SVIJET, okvirNaselja } from "@/lib/game/ulicaRaspored";

type Tocka2 = { x: number; y: number };

export { NASELJE, OBZOR, TRAGOVI };

const RUB = 1500;

function Okolica() {
  const o = okvirNaselja();
  const x0 = -RUB;
  const y0 = -RUB;
  const sir = SVIJET.w + RUB * 2;
  const vis = SVIJET.h + RUB * 2;
  return (
    <g className="izo-okolica">
      <rect x={x0} y={y0} width={sir} height={vis} fill="url(#izo-tlo-okolica)" />
      <g className="izo-krdo" transform={`translate(${o.minX - 40} ${o.maxY + 380}) scale(2.6)`}>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx={(i % 4) * 22} cy={Math.floor(i / 4) * 16} rx={9} ry={4} />
        ))}
      </g>
      <g className="izo-ranc-dalji" transform={`translate(${o.cx + 180} ${o.maxY + 380})`}>
        <g className="izo-kucica-izo" transform="translate(0 8)">
          <ellipse className="izo-sjena-meka" cx="8" cy="28" rx="36" ry="10" />
          <polygon className="izo-kucica-tlo" points="0,18 28,30 0,42 -28,30" />
          <polygon className="izo-kucica-zid" points="-28,30 0,18 0,-2 -28,10" />
          <polygon className="izo-kucica-zid is-svijet" points="0,18 28,30 28,10 0,-2" />
          <polygon className="izo-krov-crven" points="-32,8 0,-14 32,8 0,22" />
          <polygon className="izo-krov-tamni" points="-32,8 0,-14 0,-4 -32,14" />
        </g>
        <g className="izo-vjetrenjaca" transform="translate(78 -6)">
          <ellipse className="izo-sjena-meka" cx="0" cy="36" rx="16" ry="5" />
          <polygon className="izo-mlin-tijelo" points="-7,30 8,34 6,-18 -9,-14" />
          <polygon className="izo-mlin-kapa" points="-10,-16 0,-28 12,-14 0,-8" />
          <g className="izo-krila">
            <rect x="-2" y="-34" width="4" height="22" />
            <rect x="-16" y="-20" width="32" height="4" />
          </g>
        </g>
      </g>
      <g className="izo-ptica-dalj" transform={`translate(${o.cx - 300} ${o.minY - 200})`}>
        <path d="M0 4 Q14 -14 28 4 Q14 0 0 4" />
      </g>
      <g className="izo-ptica-dalj is-2" transform={`translate(${o.cx + 80} ${o.minY - 340})`}>
        <path d="M0 4 Q12 -12 24 4 Q12 0 0 4" />
      </g>
      <g className="izo-ptica-dalj is-3" transform={`translate(${o.cx + 340} ${o.minY - 160})`}>
        <path d="M0 4 Q14 -14 28 4 Q14 0 0 4" />
      </g>
    </g>
  );
}

export function Raslina({ tip, sc = 1 }: { tip: number; sc?: number }) {
  const v = ((tip % 5) + 5) % 5;
  if (v === 0) {
    return (
      <g className="izo-raslina" transform={`scale(${sc})`}>
        <ellipse cx="4" cy="20" rx="22" ry="6" fill="#2b181466" />
        <polygon points="-5,16 6,19 5,-2 -6,-4" fill="#6b4428" />
        <polygon points="5,17 10,15 8,0 5,-2" fill="#3a2414" />
        <polygon points="-16,6 -2,10 2,-2 -18,-4" fill="#243e1e" />
        <polygon points="-2,8 16,4 14,-8 -2,-4" fill="#3d642c" />
        <polygon points="-10,2 8,4 4,-14 -12,-10" fill="#4e7a38" />
        <polygon points="-6,-2 6,0 2,-16 -8,-12" fill="#6a8c48" />
        <polygon points="-12,-2 -4,-4 -6,-10 -14,-6" fill="#d7c4a455" />
        <polygon points="-9,2 -3,0 -1,-8 -8,-5" fill="#1e3a18" />
        <polygon points="1,-1 7,1 5,-9 0,-7" fill="#9aba62" />
        <polygon points="-1,12 3,14 2,6 0,7" fill="#8a6844" />
      </g>
    );
  }
  if (v === 1) {
    return (
      <g className="izo-raslina" transform={`scale(${sc})`}>
        <ellipse cx="2" cy="22" rx="12" ry="3.6" fill="#2b181455" />
        <polygon points="-3,20 4,22 3,-8 -4,-10" fill="#5c4030" />
        <polygon points="3,20 7,18 5,-6 3,-8" fill="#3a2414" />
        <polygon points="-8,-2 2,2 4,-22 -10,-18" fill="#2a4a22" />
        <polygon points="0,-4 9,-2 6,-24 -2,-20" fill="#3f6b34" />
        <polygon points="-4,-12 4,-10 2,-26 -6,-22" fill="#7a9450" />
        <polygon points="-6,-16 -1,-15 -2,-22 -8,-20" fill="#e2d0a866" />
        <polygon points="-2,-6 3,-4 2,-16 -1,-14" fill="#234018" />
        <polygon points="1,-10 5,-8 4,-18 1,-16" fill="#a4c46a" />
      </g>
    );
  }
  if (v === 2) {
    return (
      <g className="izo-raslina" transform={`scale(${sc})`}>
        <ellipse cx="2" cy="10" rx="14" ry="3.8" fill="#2b181455" />
        <polygon points="-12,6 -2,8 0,-2 -14,-2" fill="#2f4a24" />
        <polygon points="-2,7 12,5 10,-4 -1,-2" fill="#4a7034" />
        <polygon points="-6,3 7,4 4,-8 -8,-6" fill="#6a8844" />
        <polygon points="-8,1 -2,0 -4,-5 -10,-3" fill="#e2d0a855" />
        <polygon points="-4,2 2,3 1,-4 -3,-2" fill="#2a4a22" />
        <polygon points="3,1 8,2 6,-3 2,-2" fill="#8aaa55" />
      </g>
    );
  }
  if (v === 3) {
    return (
      <g className="izo-raslina" transform={`scale(${sc})`}>
        <ellipse cx="1" cy="9" rx="11" ry="2.6" fill="#2b181444" />
        <path d="M-8 7 C-7 1 -6 7 -5 7 M-4 8 C-3 -2 -1 8 0 8 M2 7 C3 -1 5 7 6 7 M7 8 C8 2 10 8 11 8" fill="none" stroke="#6a5030" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M-5 7 C-4 2 -3 7 -2 7 M1 7 C2 1 4 7 5 7" fill="none" stroke="#c4a574" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g className="izo-raslina" transform={`scale(${sc})`}>
      <ellipse cx="3" cy="16" rx="14" ry="4" fill="#2b181455" />
      <polygon points="-5,14 6,16 5,-16 -6,-14" fill="#3f6b34" />
      <polygon points="5,15 10,13 8,-12 5,-14" fill="#243e1c" />
      <polygon points="-5,-1 -16,-3 -14,-14 -5,-8" fill="#4e7a40" />
      <polygon points="5,-3 16,-5 14,-16 5,-10" fill="#5c8a46" />
      <polygon points="-3,-14 4,-12 3,-24 -4,-22" fill="#6e9452" />
      <polygon points="-7,-16 -2,-15 -3,-21 -8,-19" fill="#d7c4a455" />
      <polygon points="-2,-4 3,-2 2,-12 -1,-10" fill="#1c3816" />
      <polygon points="4,-6 9,-8 7,-16 3,-12" fill="#8eb85a" />
      <polygon points="-1,10 2,12 1,4 0,5" fill="#7a5840" />
    </g>
  );
}

export const Obzor = memo(function Obzor() {
  const { kapija: k, cvijet, cvijet2 } = OBZOR;
  const duzina = Math.hypot(k.x1 - k.x, k.y1 - k.y) || 1;
  const ox = ((k.x1 - k.x) / duzina) * 10;
  const oy = ((k.y1 - k.y) / duzina) * 10;
  const l1 = { x: k.x1 + ox, y: k.y1 + oy };
  const l2 = { x: k.x2 - ox, y: k.y2 - oy };
  const cvat = (p: Tocka2, key: string) => (
    <g key={key} className="izo-cvijet" transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx={1} cy={4} rx={7} ry={2.2} fill="#2b181444" />
      <circle className="izo-cvat" cx={-4} cy={-1} r={2.2} />
      <circle className="izo-cvat is-zuto" cx={3} cy={-2} r={2} />
      <circle className="izo-cvat" cx={1} cy={1.2} r={1.5} />
    </g>
  );
  return (
    <svg
      className="izo-obzor"
      viewBox={`${-RUB} ${-RUB} ${SVIJET.w + RUB * 2} ${SVIJET.h + RUB * 2}`}
      style={{ left: -RUB, top: -RUB, width: SVIJET.w + RUB * 2, height: SVIJET.h + RUB * 2 }}
      aria-hidden
    >
      <defs>
        <pattern id="izo-tlo-okolica" width="420" height="420" patternUnits="userSpaceOnUse">
          <image href="/art/tlo-zemlja.webp" width="420" height="420" preserveAspectRatio="none" />
        </pattern>
      </defs>
      <Okolica />
      {OBZOR.kaktusi.map((p, i) => {
        if (!izvanObora(p)) return null;
        const sc = 0.72 + (i % 4) * 0.16;
        return (
          <g key={`kak${i}`} transform={`translate(${p.x} ${p.y})`}>
            {i % 3 === 2 ? (
              <Raslina tip={4} sc={sc} />
            ) : (
              <image
                href="/art/zgrade/izo/kaktus.webp"
                x={-26 * sc}
                y={-58 * sc}
                width={52 * sc}
                height={62 * sc}
                style={{ filter: `hue-rotate(${(i % 5) * 7 - 10}deg) saturate(${0.9 + (i % 3) * 0.08})` }}
              />
            )}
          </g>
        );
      })}
      {OBZOR.grmlje.map((p, i) => !izvanObora(p) ? null : (
        <g key={`gr${i}`} transform={`translate(${p.x} ${p.y})`}>
          <Raslina tip={2 + (i % 2)} sc={0.8 + (i % 4) * 0.12} />
        </g>
      ))}
      {cvijet ? cvat(cvijet, "cv1") : null}
      {cvijet2 ? cvat(cvijet2, "cv2") : null}
      {OBZOR.stabla.map((p, i) => !izvanObora(p) ? null : (
        <g key={`dr${i}`} className="izo-drvo" transform={`translate(${p.x} ${p.y})`}>
          <Raslina tip={i % 2} sc={0.9 + (i % 5) * 0.12} />
        </g>
      ))}
      {RASUTE.map((p, i) => (
        <g key={`rs${i}`} transform={`translate(${p.x} ${p.y})`}>
          <Raslina tip={p.tip} sc={p.sc} />
        </g>
      ))}
      {/* 0.9.173: ograda oko kaube (letve i stupovi po rubu naselja) uklonjena; ostaje samo ulaz s lampama. */}
      <line className="izo-kapija-greda" x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} />
      <rect className="izo-stup" x={k.x1 - 2} y={k.y1 - 18} width={4} height={22} rx={0.8} />
      <rect className="izo-stup" x={k.x2 - 2} y={k.y2 - 18} width={4} height={22} rx={0.8} />
      <g className="izo-lampa-ulaz">
        <line x1={l1.x} y1={l1.y} x2={l1.x} y2={l1.y - 28} />
        <circle cx={l1.x} cy={l1.y - 30} r={3.5} />
        <ellipse className="izo-lampa-sjaj" cx={l1.x} cy={l1.y - 30} rx={6} ry={3.4} />
        <line x1={l2.x} y1={l2.y} x2={l2.x} y2={l2.y - 28} />
        <circle cx={l2.x} cy={l2.y - 30} r={3.5} />
        <ellipse className="izo-lampa-sjaj" cx={l2.x} cy={l2.y - 30} rx={6} ry={3.4} />
      </g>
    </svg>
  );
});
