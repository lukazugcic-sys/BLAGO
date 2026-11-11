import { memo } from "react";
import { Raslina, TRAGOVI } from "@/components/game/KaubaObzor";
import { bojaSloja, cetvrtZgrade, rombTocke, sirinaPuta, type Sloj } from "@/lib/game/kartaPogled";
import { ogradaTora, type Grlo } from "@/lib/game/stokaKarta";
import {
  CVAT,
  DETALJ,
  MOSTOVI,
  DRVECE,
  DRVORED,
  GAZ,
  GRANE,
  JOS,
  KAMENOLOM_KAMENJE,
  KRUG,
  KVART,
  LIVADA,
  LOKVA,
  NASELJA,
  OBALA,
  POTOK,
  PRAZNINE,
  PRSTEN,
  REKVIZITI,
  SIKARA,
  SIPAK,
  STAZA,
  TEREN,
  UZCESTU,
  UVALA,
  VODA,
  ZAKRPE,
  obrubNaselja,
} from "@/lib/game/teren";
import type { Gradevine, Gradnja } from "@/lib/game/types";
import { CESTA, PARCELE, SVIJET, putelji, sitniDekor, type SitniTip } from "@/lib/game/ulicaRaspored";
import { SIRINA_PJESINE, mostoviPjesina } from "@/lib/game/pjesine";
import { trakaPuta } from "@/lib/game/putTraka";
import { KaubaDvorista, KaubaGazeno, KaubaTrg, DvSimboli } from "@/components/game/KaubaDvorista";
import { cn } from "@/lib/utils";

const SITNI = sitniDekor();
/** 0.9.174: ograda obora oko tora (stalna geometrija, samo prikaz). */
const OBOR_OGRADA = ogradaTora();

/**
 * Konj s glavom (vrat, glava, uši, griva, rep), nacrtan da gleda DESNO;
 * smjer -1 zrcali cijelu sličicu. Ishodište = kopita na tlu.
 */
export function KonjZnak({ boja, griva }: { boja: string; griva: string }) {
  return (
    <>
      <ellipse cx={0} cy={0.6} rx={8.6} ry={1.7} className="izo-zivotinja-sjena" />
      {/* stražnje noge (dalje) */}
      <path d="M-4.6 -5 L-5.4 0.2 M4.2 -5 L4.8 0.2" stroke="#2e1a0c" strokeWidth={1.3} strokeLinecap="round" />
      {/* rep */}
      <path d="M-6.6 -8.4 Q-9.4 -7 -8.8 -2.2" stroke={griva} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      {/* tijelo */}
      <path
        d="M-6.8 -7.6 Q-6.6 -10.2 -3 -10.1 L3.6 -10.2 Q6.6 -10 6.6 -7.4 Q6.4 -4.6 3.4 -4.6 L-3.8 -4.6 Q-6.9 -4.8 -6.8 -7.6 Z"
        fill={boja}
        stroke="#24140a"
        strokeWidth={0.7}
      />
      {/* prednje noge (bliže) */}
      <path d="M-3.4 -5 L-3.2 0.4 M3.2 -5 L3.6 0.4" stroke="#24140a" strokeWidth={1.4} strokeLinecap="round" />
      {/* vrat */}
      <path d="M3.4 -9.6 L6.4 -14.6 L9 -13.2 L7.2 -7.4 Z" fill={boja} stroke="#24140a" strokeWidth={0.7} strokeLinejoin="round" />
      {/* glava: čelo -> njuška */}
      <path
        d="M6 -15.2 Q7.6 -16.4 9.2 -15.2 L12.2 -11.8 Q12.6 -10.6 11.4 -10.4 L9.6 -10.8 L7.4 -12.6 Z"
        fill={boja}
        stroke="#24140a"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <ellipse cx={11.3} cy={-11.2} rx={1.1} ry={0.8} fill="#2a1a10" />
      {/* uši */}
      <path d="M6.6 -15.4 L6.9 -17.6 L7.9 -15.6 Z" fill={griva} />
      <path d="M7.8 -15.6 L8.5 -17.4 L9 -15.2 Z" fill={griva} />
      {/* griva */}
      <path d="M6.2 -15 Q4.6 -12.4 3.4 -9.8" stroke={griva} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <circle cx={8.4} cy={-14.1} r={0.55} fill="#120a06" />
    </>
  );
}

/** Govedo (bijelo s crnim mrljama, rogovi), gleda DESNO. */
function GovedoZnak() {
  return (
    <>
      <ellipse cx={0} cy={0.6} rx={8.6} ry={1.7} className="izo-zivotinja-sjena" />
      <path d="M-4.8 -4.4 L-5 0.2 M4 -4.4 L4.2 0.2" stroke="#3a322c" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M-6.8 -7.6 Q-8.8 -6.6 -8.4 -3.6" stroke="#2a2420" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      <rect x={-7} y={-10} width={13.4} height={6.2} rx={2.6} fill="#ece4d4" stroke="#3a322c" strokeWidth={0.7} />
      <ellipse cx={-3} cy={-7.6} rx={2.3} ry={1.5} fill="#2a2420" />
      <ellipse cx={2} cy={-6.2} rx={1.6} ry={1.1} fill="#2a2420" />
      <path d="M-3.2 -4.4 L-3.1 0.4 M2.8 -4.4 L3 0.4" stroke="#2a2420" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M5.4 -10.2 L9.4 -10.6 Q10.8 -9.6 10.4 -7.6 L8.8 -6.6 L5.8 -7.4 Z" fill="#e2d8c4" stroke="#3a322c" strokeWidth={0.7} strokeLinejoin="round" />
      <ellipse cx={9.9} cy={-7.4} rx={1.2} ry={0.9} fill="#d9a89a" />
      <path d="M6.4 -10.4 L5.6 -12.4 M9 -10.6 L9.8 -12.6" stroke="#f4ecd8" strokeWidth={0.9} strokeLinecap="round" />
      <circle cx={8.2} cy={-9.2} r={0.5} fill="#120a06" />
    </>
  );
}

const KONJ_BOJE: { boja: string; griva: string }[] = [
  { boja: "#8a5228", griva: "#2a160a" },
  { boja: "#6b3b1c", griva: "#1e1008" },
  { boja: "#a8743e", griva: "#3a2210" },
  { boja: "#3e2a1e", griva: "#120a06" },
  { boja: "#c9a56c", griva: "#f0e2c0" },
];
export function bojaKonja(id: string) {
  const n = Number(id.slice(id.lastIndexOf("-") + 1)) || 0;
  return KONJ_BOJE[(n * 7 + 3) % KONJ_BOJE.length]!;
}


function SitniZnak({ tip }: { tip: SitniTip }) {
  if (tip === "ograda") {
    return (
      <g>
        <line x1={-9} y1={1} x2={9} y2={1} stroke="#6a4328" strokeWidth={1.5} />
        <line x1={-7} y1={-4} x2={-7} y2={5} stroke="#4a2c16" strokeWidth={1.3} />
        <line x1={0} y1={-4} x2={0} y2={5} stroke="#4a2c16" strokeWidth={1.3} />
        <line x1={7} y1={-4} x2={7} y2={5} stroke="#4a2c16" strokeWidth={1.3} />
      </g>
    );
  }
  if (tip === "bacva") return <ellipse cx={0} cy={0} rx={5} ry={3.2} fill="#6b3a22" stroke="#3a2014" strokeWidth={1} />;
  if (tip === "sijeno") return <ellipse cx={0} cy={1} rx={7} ry={3.4} fill="#e2c06a" stroke="#8a6230" strokeWidth={1} />;
  if (tip === "lampa") {
    return (
      <g>
        <line x1={0} y1={-8} x2={0} y2={6} stroke="#3a2414" strokeWidth={1.4} />
        <circle cx={0} cy={-8} r={2.4} fill="#ffd24a" />
      </g>
    );
  }
  if (tip === "kaktus") {
    return (
      <g>
        <ellipse cx={2} cy={6} rx={6} ry={2} fill="#2b181466" />
        <polygon points="-2.2,6 2.4,7 2,-8 -2.6,-7" fill="#4e7a40" />
        <polygon points="2.2,6.2 4.2,5.4 3.6,-6 2,-7" fill="#2f4e28" />
        <polygon points="-2.4,-1 -7,-2.2 -6.4,-7 -2.2,-4" fill="#3f6b34" />
        <polygon points="2,-2 6.2,-3.4 5.6,-8 2,-5" fill="#5c8a46" />
        <polygon points="-1.2,-8 1.2,-7.2 0.6,-12 -1.6,-11" fill="#6e9450" />
      </g>
    );
  }
  if (tip === "kamen") return <ellipse cx={0} cy={1} rx={4.5} ry={2.6} fill="#8d8478" />;
  if (tip === "korito") return <rect x={-7} y={-2} width={14} height={4} rx={2} fill="#5c4632" stroke="#2a1810" strokeWidth={0.8} />;
  return (
    <g>
      <rect x={-6} y={-3} width={12} height={5} rx={1} fill="#6a4328" />
      <circle cx={-3} cy={3} r={1.6} fill="#2a1810" />
      <circle cx={3} cy={3} r={1.6} fill="#2a1810" />
    </g>
  );
}

type Staza = ReturnType<typeof putelji>[number];

/** Organic (non-elliptical) lake outline: smooth closed curve with fixed lobes. */
export function obalaLokve(cx: number, cy: number, rx: number, ry: number, faza: number) {
  const N = 10;
  const lob = [1, 0.92, 1.08, 0.95, 1.04, 0.9, 1.06, 0.97, 1.02, 0.93];
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const k = lob[(i + faza) % N]!;
    return { x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k };
  });
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const f = (n: number) => n.toFixed(1);
  const m0 = mid(pts[N - 1]!, pts[0]!);
  let d = `M${f(m0.x)} ${f(m0.y)}`;
  for (let i = 0; i < N; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % N]!);
    d += `Q${f(p.x)} ${f(p.y)} ${f(m.x)} ${f(m.y)}`;
  }
  return d + "Z";
}

export const KaubaCesta = memo(function KaubaCesta({
  gradevine,
  gradnje,
  pogled,
  staze,
  mirno,
  skok,
  stoka,
}: {
  gradevine: Gradevine;
  gradnje: Gradnja[];
  pogled: Sloj | null;
  staze: Staza[];
  mirno: boolean;
  skok: keyof Gradevine | null;
  /** Jedno grlo = jedna sličica (stokaNaKarti). */
  stoka: readonly Grlo[];
}) {
  const cestaTocke = CESTA.map((p) => `${p.x},${p.y}`).join(" ");
  return (
          <svg className="izo-cesta" viewBox={`0 0 ${SVIJET.w} ${SVIJET.h}`} aria-hidden>
            <defs>
              <pattern id="izo-pijesak" width="160" height="160" patternUnits="userSpaceOnUse">
                <image href="/art/tlo-put.webp" width="160" height="160" preserveAspectRatio="none" />
              </pattern>
              <pattern id="izo-njiva-tk" width="9" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(16)">
                <rect width="9" height="6" fill="#8aaa5544" />
                <line x1="0" y1="3" x2="9" y2="3" stroke="#4e622e66" strokeWidth="0.7" />
              </pattern>
              <pattern id="izo-kamen-tk" width="22" height="16" patternUnits="userSpaceOnUse">
                <rect width="22" height="16" fill="#6a5344" />
                <ellipse cx="5" cy="6" rx="3.2" ry="1.8" fill="#3a2414" />
                <ellipse cx="15" cy="11" rx="2.4" ry="1.4" fill="#4a3428" />
                <ellipse cx="16" cy="4" rx="1.6" ry="1" fill="#2b1814cc" />
                <ellipse cx="6" cy="5" rx="1.1" ry="0.5" fill="#e7c48aaa" />
                <ellipse cx="12" cy="8" rx="0.7" ry="0.4" fill="#d7c4a088" />
              </pattern>
              <pattern id="izo-voda-tk" width="64" height="36" patternUnits="userSpaceOnUse">
                <image href="/art/tlo-voda.webp" width="64" height="36" preserveAspectRatio="none" />
              </pattern>
              <pattern id="izo-trava-tk" width="22" height="16" patternUnits="userSpaceOnUse">
                <rect width="22" height="16" fill="#7a9a4433" />
                <line x1="3" y1="14" x2="5" y2="4" stroke="#4e6a2899" strokeWidth="1.1" />
                <line x1="8" y1="15" x2="7" y2="6" stroke="#6e8a3acc" strokeWidth="0.8" />
                <line x1="14" y1="13" x2="16" y2="3" stroke="#3f5a2288" strokeWidth="1" />
                <line x1="19" y1="14" x2="18" y2="7" stroke="#8aaa55aa" strokeWidth="0.7" />
              </pattern>
              <DvSimboli />
            </defs>
            {PARCELE.map((z) => (
              <polygon key={`cv-${z.id}`} className={`izo-cetvrt is-${cetvrtZgrade(z.id)}`} points={rombTocke(z)} />
            ))}
            {PARCELE.map((z) => {
              const id = z.id as keyof Gradevine;
              const lv = gradevine[id] || 0;
              const posao = gradnje.some((g) => g.zgrada === id);
              const tijelo = lv > 0 || posao;
              if (!tijelo) return null;
              return (
                <ellipse
                  key={`sj-${z.id}`}
                  className="izo-sjena-tlo"
                  cx={z.x + 12}
                  cy={z.y + 12}
                  rx={46}
                  ry={14}
                />
              );
            })}
            {PARCELE.map((z) => {
              const id = z.id as keyof Gradevine;
              const lv = gradevine[id] || 0;
              const posao = gradnje.some((g) => g.zgrada === id);
              if (lv > 0 || posao) return null;
              return <polygon key={`uz-${z.id}`} className="izo-uze" points={rombTocke(z)} />;
            })}
            {pogled
              ? PARCELE.map((z) => (
                  <polygon
                    key={`sl-${z.id}`}
                    className="izo-sloj"
                    points={rombTocke(z)}
                    fill={bojaSloja(pogled, z.id, gradevine, z)}
                  />
                ))
              : null}
            {/* 0.9.176 (19, t443u): puteljci kao vijugave trake promjenjive širine s mekanim rubom; pješačke staze uže i svjetlije */}
            {staze.map((s) => {
              const lv = s.veza
                ? Math.min(...s.id.split("-").map((id) => gradevine[id as keyof Gradevine] || 0))
                : gradevine[s.id as keyof Gradevine] || 0;
              const pjesina = !!s.pjesina;
              const sir = pjesina ? SIRINA_PJESINE : s.veza || KVART.has(s.id) ? 8 : Math.max(6, sirinaPuta(lv, false));
              const pts = s.tocke.map((p) => `${p.x},${p.y}`).join(" ");
              const traka = trakaPuta(s.tocke, sir, s.id + (pjesina ? ":pj" : ""), { vrata: !s.veza, spoj: !s.veza });
              return (
                <g key={pjesina ? `pj-${s.id}` : s.id} className={cn("izo-put-g", pjesina && "is-pjesina")} data-put={s.id}>
                  <polygon className={cn("izo-put-traka-rub", pjesina && "is-pjesina")} points={traka} />
                  <polygon className={cn("izo-put-traka", pjesina && "is-pjesina")} points={traka} />
                  {pjesina ? null : (
                    <polyline
                      className={cn("izo-put", s.veza && "is-veza", !mirno && skok && s.id.includes(String(skok)) && "is-novi")}
                      points={pts}
                      pathLength={1}
                      style={{ strokeWidth: Math.max(1.2, sir * 0.26) }}
                    />
                  )}
                </g>
              );
            })}
            <KaubaGazeno gradevine={gradevine} />
            {ZAKRPE.map((z, i) => (
              <ellipse
                key={`zk${i}`}
                className={cn("izo-zakrpa", `is-${z.tip}`)}
                cx={z.x}
                cy={z.y}
                rx={z.rx}
                ry={z.ry}
              />
            ))}
            {TEREN.njive.map((p, i) => (
              <polygon key={`nj${i}`} className="izo-njiva" points={p} />
            ))}
            {TEREN.brazde.map((p, i) => (
              <polyline key={`br${i}`} className="izo-brazda" points={p} />
            ))}
            {TEREN.kamenje.map((k, i) => (
              <g key={`km${i}`}>
                <polygon className="izo-kamen" points={k.pts} />
                <ellipse className="izo-kamen-ploha" cx={k.x - 2} cy={k.y - 2} rx={4.2} ry={1.8} />
                <polyline className="izo-kamen-puk" points={k.puk} />
              </g>
            ))}
            {KAMENOLOM_KAMENJE.map((k, i) => (
              <g key={`kk${i}`} className="izo-kamen-kamenolom">
                <ellipse className="izo-sjena-tlo" cx={k.x + k.r * 0.35} cy={k.y + k.r * 0.32} rx={k.r * 1.05} ry={k.r * 0.42} />
                <polygon className="izo-kamen" points={k.pts} />
                <ellipse className="izo-kamen-ploha" cx={k.x - k.r * 0.25} cy={k.y - k.r * 0.22} rx={k.r * 0.5} ry={k.r * 0.2} />
                {k.r > 5.5 ? <polyline className="izo-kamen-puk" points={k.puk} /> : null}
              </g>
            ))}
            {TEREN.mrlje.map((z, i) => (
              <ellipse
                key={`tr${i}`}
                className={cn("izo-zakrpa", "izo-teren", `is-${z.tip}`)}
                cx={z.x}
                cy={z.y}
                rx={z.rx}
                ry={z.ry}
              />
            ))}
            <polygon className="izo-ulica-tijelo" points={cestaTocke} />
            {NASELJA.map((n) => (
              <polygon key={`ob${n.id}`} className={cn("izo-obrub", `is-${n.id}`)} points={obrubNaselja(n.ids)} />
            ))}
            <polygon className="izo-staza-rub" points={STAZA.tijelo} />
            <polygon className="izo-staza" points={STAZA.tijelo} />
            {KRUG ? <ellipse className="izo-kruzni" cx={KRUG.x} cy={KRUG.y} rx={30} ry={15} /> : null}
            {KRUG ? <ellipse className="izo-kruzni-sred" cx={KRUG.x} cy={KRUG.y + 1} rx={8} ry={4} /> : null}
            <polyline className="izo-staza-trag is-siroko" points={STAZA.trag} />
            <polyline className="izo-staza-trag" points={STAZA.trag} />
            {GRANE.map((g, i) => (
              <polygon key={`grn${i}`} className="izo-grana" points={g} />
            ))}
            <polyline className="izo-potok is-obala" points={POTOK} />
            <polyline className="izo-potok is-rub" points={POTOK} />
            <polyline className="izo-potok" points={POTOK} stroke="url(#izo-voda-tk)" />
            <polyline className="izo-potok is-dno" points={POTOK} />
            {UVALA ? (
              <>
                <polyline className="izo-potok is-obala is-uvala" points={UVALA} />
                <polyline className="izo-potok is-rub is-uvala" points={UVALA} />
                <polyline className="izo-potok is-uvala" points={UVALA} stroke="url(#izo-voda-tk)" />
                <polyline className="izo-potok is-dno is-uvala" points={UVALA} />
              </>
            ) : null}
            {VODA.pjena.map((p, i) => (
              <ellipse key={`pj${i}`} className="izo-pjena" cx={p.x} cy={p.y} rx={p.rx} ry={p.rx * 0.45} />
            ))}
            {VODA.korito.map((k, i) => (
              <g key={`ko${i}`}>
                <ellipse className="izo-korito-kamen" cx={k.x} cy={k.y} rx={2.2} ry={1.1} />
                <ellipse className="izo-korito-vrh" cx={k.x - 0.5} cy={k.y - 0.3} rx={0.8} ry={0.35} />
              </g>
            ))}
            {VODA.kamen.map((k, i) => (
              <g key={`vk${i}`}>
                <ellipse className="izo-kamen" cx={k.x} cy={k.y} rx={3.6} ry={1.8} />
                <ellipse className="izo-kamen-ploha" cx={k.x - 0.8} cy={k.y - 0.5} rx={1.6} ry={0.7} />
              </g>
            ))}
            {VODA.trska.map((t, i) => (
              <g key={`vt${i}`}>
                <line className="izo-trska" x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
                <line className="izo-trska is-tamna" x1={t.x1 + 1.6} y1={t.y1} x2={t.x2 + 1.2} y2={t.y2 + 1} />
              </g>
            ))}
            {/* 0.9.175: mostić gdje puteljak/cesta prelazi potok */}
            {MOSTOVI.map((m, i) => (
              <g key={`most${i}`} className="izo-most" data-most={i} transform={`translate(${m.x} ${m.y}) rotate(${m.kut})`}>
                <ellipse cx={1} cy={4} rx={17} ry={4} fill="#2a1a0e" opacity={0.28} />
                <rect x={-15} y={-6} width={30} height={12} rx={1.5} fill="#8a5a32" stroke="#4a2e18" strokeWidth={0.9} />
                {[-10, -5, 0, 5, 10].map((x) => (
                  <line key={x} x1={x} y1={-6} x2={x} y2={6} stroke="#5a3a1e" strokeWidth={0.8} />
                ))}
                <line x1={-15} y1={-6.5} x2={15} y2={-6.5} stroke="#3e2614" strokeWidth={1.6} strokeLinecap="round" />
                <line x1={-15} y1={6.5} x2={15} y2={6.5} stroke="#3e2614" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            ))}
            {/* 0.9.176: mostić pješačke staze (t443u) */}
            {mostoviPjesina().map((m, i) => (
              <g key={`mostpj${i}`} className="izo-most" data-most={`pj${i}`} transform={`translate(${m.x} ${m.y}) rotate(${m.kut})`}>
                <ellipse cx={1} cy={4} rx={17} ry={4} fill="#2a1a0e" opacity={0.28} />
                <rect x={-15} y={-6} width={30} height={12} rx={1.5} fill="#8a5a32" stroke="#4a2e18" strokeWidth={0.9} />
                {[-10, -5, 0, 5, 10].map((x) => (
                  <line key={x} x1={x} y1={-6} x2={x} y2={6} stroke="#5a3a1e" strokeWidth={0.8} />
                ))}
                <line x1={-15} y1={-6.5} x2={15} y2={-6.5} stroke="#3e2614" strokeWidth={1.6} strokeLinecap="round" />
                <line x1={-15} y1={6.5} x2={15} y2={6.5} stroke="#3e2614" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            ))}
            {LOKVA ? (
              <g>
                <path className="izo-lokva-obala" d={obalaLokve(LOKVA.x, LOKVA.y + 1, 28, 12, 1)} />
                <path className="izo-lokva" d={obalaLokve(LOKVA.x, LOKVA.y, 22, 9, 0)} />
                <ellipse className="izo-lokva-dno" cx={LOKVA.x + 3} cy={LOKVA.y + 1.5} rx={11} ry={4.2} />
                <ellipse className="izo-lokva-val" cx={LOKVA.x - 4} cy={LOKVA.y - 1} rx={9} ry={2.4} />
                <ellipse className="izo-lokva-val is-van" cx={LOKVA.x + 5} cy={LOKVA.y + 1} rx={7} ry={1.8} />
                <ellipse className="izo-odbljesak" cx={LOKVA.x - 8} cy={LOKVA.y - 2} rx={5} ry={1.4} />
                <ellipse className="izo-pjena" cx={LOKVA.x - 2} cy={LOKVA.y + 2} rx={1.3} ry={0.55} />
                <ellipse className="izo-pjena" cx={LOKVA.x + 4} cy={LOKVA.y - 1} rx={0.9} ry={0.4} />
                <ellipse className="izo-korito-kamen" cx={LOKVA.x + 1} cy={LOKVA.y + 2} rx={2.4} ry={1.1} />
                <ellipse className="izo-korito-vrh" cx={LOKVA.x + 0.4} cy={LOKVA.y + 1.6} rx={0.8} ry={0.35} />
                <ellipse className="izo-lokva-list" cx={LOKVA.x + 8} cy={LOKVA.y + 2} rx={4.4} ry={1.7} />
                <ellipse className="izo-lokva-list is-mali" cx={LOKVA.x - 6} cy={LOKVA.y + 3} rx={2.6} ry={1.1} />
                <line className="izo-trska" x1={LOKVA.x - 16} y1={LOKVA.y + 4} x2={LOKVA.x - 18} y2={LOKVA.y - 8} />
                <line className="izo-trska is-tamna" x1={LOKVA.x - 14} y1={LOKVA.y + 4} x2={LOKVA.x - 15} y2={LOKVA.y - 6} />
                <line className="izo-trska" x1={LOKVA.x - 9} y1={LOKVA.y + 5} x2={LOKVA.x - 10} y2={LOKVA.y - 5} />
                <line className="izo-trska" x1={LOKVA.x + 14} y1={LOKVA.y + 4} x2={LOKVA.x + 17} y2={LOKVA.y - 7} />
                <line className="izo-trska is-tamna" x1={LOKVA.x + 12} y1={LOKVA.y + 4} x2={LOKVA.x + 13} y2={LOKVA.y - 4} />
              </g>
            ) : null}
            {LIVADA ? <polygon className="izo-livada" points={LIVADA} /> : null}
            <KaubaTrg />
            {PRAZNINE.livade.map((p, i) => (
              <polygon key={`pz${i}`} className="izo-praznina" points={p} />
            ))}
            {PRAZNINE.busen.map((p, i) => (
              <g key={`pb${i}`} transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {CVAT.map((p, i) => (
              <g key={`cv${i}`} transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {DETALJ.kamen.map((k, i) => (
              <ellipse key={`rk${i}`} className="izo-rub-kamen" cx={k.x} cy={k.y} rx={3.2} ry={1.6} />
            ))}
            {DETALJ.brv ? (
              <g className="izo-brv" transform={`translate(${DETALJ.brv.x} ${DETALJ.brv.y}) rotate(${DETALJ.brv.kut})`}>
                <rect x={-16} y={-5} width={32} height={10} rx={1.5} />
                <line x1={-16} y1={-5} x2={16} y2={-5} />
                <line x1={-8} y1={-5} x2={-8} y2={5} />
                <line x1={0} y1={-5} x2={0} y2={5} />
                <line x1={8} y1={-5} x2={8} y2={5} />
              </g>
            ) : null}
            {/* 0.9.174: kratki PLOT uz tor zamijenjen punom ogradom obora (OBOR_OGRADA niže). */}
            {PRSTEN.map((p, i) => (
              <ellipse key={`pr${i}`} className="izo-rub-kamen" cx={p.x} cy={p.y} rx={3.4} ry={1.7} />
            ))}
            {GAZ.map((g, i) => (
              <g key={`gz${i}`}>
                <ellipse className="izo-gaz" cx={g.x} cy={g.y} rx={g.r} ry={g.r * 0.45} />
                <ellipse className="izo-gaz-vrh" cx={g.x - 1} cy={g.y - 1} rx={g.r * 0.4} ry={g.r * 0.16} />
                <line className="izo-kamen-puk" x1={g.x - 2} y1={g.y} x2={g.x + 2.2} y2={g.y + 0.8} />
              </g>
            ))}
            {OBALA.map((p, i) => (
              <g key={`ob${i}`} transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {SIKARA.map((p, i) => (
              <g key={`sk${i}`} className="izo-drvo" transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {DRVORED.map((p, i) => (
              <g key={`dv${i}`} className="izo-drvo" transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {UZCESTU.map((p, i) => (
              <g key={`uc${i}`} className="izo-drvo" transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {SIPAK.map((p, i) => (
              <g key={`sp${i}`} transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {DRVECE.map((p, i) => (
              <g key={`drv${i}`} className="izo-drvo" transform={`translate(${p.x} ${p.y})`}>
                <Raslina tip={p.tip} sc={p.sc} />
              </g>
            ))}
            {TRAGOVI.map((pts, i) => (
              <polyline key={`trag${i}`} className="izo-kolo" points={pts} />
            ))}
            {SITNI.map((d, i) => (
              <g
                key={`sit${i}`}
                className={cn("izo-sitni", d.tip === "kola" && "is-kola")}
                transform={`translate(${d.x} ${d.y}) rotate(${d.okret})`}
                data-tip={d.tip}
              >
                <SitniZnak tip={d.tip} />
              </g>
            ))}
            {REKVIZITI.map((d, i) => (
              <g
                key={`rek${i}`}
                className="izo-sitni"
                transform={`translate(${d.x} ${d.y}) rotate(${d.okret})`}
                data-tip={d.tip}
              >
                <SitniZnak tip={d.tip} />
              </g>
            ))}
            {JOS.strasilo ? (
              <g className="izo-strasilo" transform={`translate(${JOS.strasilo.x} ${JOS.strasilo.y})`}>
                <ellipse className="izo-sitna-sjena" cx={2} cy={6} rx={8} ry={2.4} />
                <line x1={0} y1={-11} x2={0} y2={4} />
                <line x1={-6} y1={-5} x2={6} y2={-5} />
                <rect x={-3.2} y={-8} width={6.4} height={5} rx={0.6} />
                <circle cx={0} cy={-13} r={2.1} />
                <path d="M-3.2 -14.2 L0 -17.4 L3.2 -14.2 Z" />
              </g>
            ) : null}
            {JOS.vrt.map((v, i) => (
              <line key={`vrt${i}`} className="izo-vrt" x1={v.x - 4} y1={v.y} x2={v.x + 4} y2={v.y + 1} />
            ))}
            {JOS.vatra ? (
              <g className="izo-vatra" transform={`translate(${JOS.vatra.x} ${JOS.vatra.y})`}>
                <ellipse className="izo-sitna-sjena" cx={1} cy={4} rx={8} ry={2.2} />
                <ellipse cx={0} cy={2} rx={7} ry={3} />
                <circle className="is-zar" cx={0} cy={0} r={2.2} />
                <circle className="is-jezgra" cx={0.3} cy={-0.4} r={1} />
              </g>
            ) : null}
            {JOS.daske ? (
              <g className="izo-daske" transform={`translate(${JOS.daske.x} ${JOS.daske.y}) rotate(-8)`}>
                <ellipse className="izo-sitna-sjena" cx={2} cy={5} rx={8} ry={2} />
                <rect x={-7} y={-2} width={14} height={2.4} rx={0.4} />
                <rect x={-6} y={1.2} width={13} height={2.2} rx={0.4} />
              </g>
            ) : null}
            <KaubaDvorista gradevine={gradevine} />
            {/* 0.9.177 (t453u): ograda obora tek kad je tor izgrađen (razina ≥ 1, isto kao zgrade na karti) */}
            {(gradevine.tor || 0) > 0 && OBOR_OGRADA.letve.map(([a, b], i) => (
              <g key={`obl${i}`} className="izo-obor-letva">
                <line x1={a.x} y1={a.y - 7} x2={b.x} y2={b.y - 7} />
                <line x1={a.x} y1={a.y - 3.2} x2={b.x} y2={b.y - 3.2} />
              </g>
            ))}
            {(gradevine.tor || 0) > 0 && OBOR_OGRADA.stupovi.map((p, i) => (
              <rect key={`obs${i}`} className="izo-obor-stup" x={p.x - 1.5} y={p.y - 9.5} width={3} height={10.5} rx={0.6} />
            ))}
            {/* po dubini (y): bliže grlo crta se preko daljeg */}
            {[...stoka]
              .sort((a, b) => a.y - b.y || a.x - b.x)
              .map((d) => (
                <g
                  key={d.id}
                  className={d.vrsta === "konj" ? "izo-zivotinja is-konj" : "izo-zivotinja is-govedo"}
                  data-zivotinja={d.id}
                  data-smjer={d.smjer < 0 ? "l" : "d"}
                  transform={d.smjer < 0 ? `translate(${d.x} ${d.y}) scale(-1 1)` : `translate(${d.x} ${d.y})`}
                >
                  {d.vrsta === "konj" ? <KonjZnak {...bojaKonja(d.id)} /> : <GovedoZnak />}
                </g>
              ))}
          </svg>
  );
});
