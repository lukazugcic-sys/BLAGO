import type { Stanovnik } from "@/lib/game/ljudi";
import { likTema } from "@/lib/game/ljudi";
import { cn } from "@/lib/utils";

function Alat({ alat, t }: { alat: Stanovnik["alat"]; t: ReturnType<typeof likTema> }) {
  if (alat === "prazno") return null;
  if (alat === "zvezda") {
    return <polygon points="64,52 66,57 72,57 67,61 69,67 64,63 59,67 61,61 56,57 62,57" fill={t.traka} stroke="#3a2808" strokeWidth="0.6" />;
  }
  if (alat === "cekic") {
    return (
      <g>
        <rect x="68" y="54" width="3.2" height="18" rx="1" fill="#5a3214" transform="rotate(18 70 63)" />
        <rect x="64" y="52" width="12" height="5" rx="1" fill="#7a7a80" transform="rotate(18 70 54)" />
      </g>
    );
  }
  if (alat === "sjekira") {
    return (
      <g>
        <rect x="69" y="50" width="3" height="22" rx="1" fill="#5a3214" transform="rotate(-16 70 61)" />
        <path d="M66 50 L78 47 L78 56 L66 58 Z" fill="#b0b4b8" transform="rotate(-16 70 53)" />
      </g>
    );
  }
  if (alat === "kanta") {
    return (
      <g>
        <rect x="66" y="62" width="12" height="10" rx="2" fill="#4a6a7a" stroke="#2a4048" strokeWidth="0.8" />
        <path d="M68 62 Q72 56 76 62" fill="none" stroke="#2a4048" strokeWidth="1.4" />
        <rect x="68" y="64" width="8" height="3" rx="1" fill="#7eb0c4" opacity="0.7" />
      </g>
    );
  }
  if (alat === "casa") {
    return (
      <g>
        <path d="M67 60 L69 72 L75 72 L77 60 Z" fill="#c4783a" stroke="#5a2810" strokeWidth="0.7" />
        <ellipse cx="72" cy="60" rx="5" ry="2" fill="#e8a05a" />
      </g>
    );
  }
  if (alat === "kosar") {
    return (
      <g>
        <ellipse cx="72" cy="68" rx="8" ry="5" fill="#8a5a28" stroke="#5a3214" strokeWidth="0.8" />
        <path d="M66 66 Q72 58 78 66" fill="none" stroke="#5a3214" strokeWidth="1.3" />
      </g>
    );
  }
  if (alat === "uzda") {
    return (
      <g>
        <path d="M64 58 Q74 48 84 54" fill="none" stroke="#5a3214" strokeWidth="1.7" strokeLinecap="round" />
        <rect x="80" y="52" width="7" height="4" rx="1" fill="#8a5a28" stroke="#3a2010" strokeWidth="0.6" />
      </g>
    );
  }
  if (alat === "torba") {
    return (
      <g>
        <rect x="66" y="62" width="12" height="10" rx="2" fill="#5a3214" stroke="#2a1810" strokeWidth="0.7" />
        <rect x="69" y="60" width="6" height="3" rx="1" fill="#8a5a28" />
      </g>
    );
  }
  return <ellipse cx="72" cy="66" rx="6" ry="3.5" fill="#d4a04a" stroke="#8a6a28" strokeWidth="0.7" />;
}

function Konj({ boja, griva }: { boja: string; griva: string }) {
  return (
    <g className="kauba-konj">
      <ellipse cx="40" cy="104" rx="26" ry="4" fill="#1a0c08" opacity="0.32" />
      <rect x="18" y="90" width="4.2" height="14" rx="1.2" fill="#2a1810" />
      <rect x="28" y="92" width="4" height="12" rx="1.2" fill="#1a1008" />
      <rect x="48" y="92" width="4" height="12" rx="1.2" fill="#1a1008" />
      <rect x="58" y="90" width="4.2" height="14" rx="1.2" fill="#2a1810" />
      <ellipse cx="42" cy="82" rx="26" ry="13" fill={boja} />
      <path d="M14 78 Q6 88 12 98" fill="none" stroke={griva} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M62 76 Q76 62 80 50" fill="none" stroke={boja} strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="82" cy="48" rx="8" ry="5.2" fill={boja} />
      <ellipse cx="90" cy="50" rx="5.5" ry="3.2" fill={boja} />
      <polygon points="76,44 78,34 84,46" fill={boja} />
      <path d="M74 46 Q68 38 62 52" fill="none" stroke={griva} strokeWidth="2.4" />
      <circle cx="86" cy="47" r="1.1" fill="#1a0c08" />
      <rect x="30" y="76" width="22" height="6" rx="2" fill="#5a3214" />
      <rect x="36" y="74" width="10" height="4" rx="1" fill="#8a5a28" />
    </g>
  );
}

function konjTema(ime: string) {
  let h = 0;
  for (let i = 0; i < ime.length; i++) h += ime.charCodeAt(i) * (i + 3);
  const boja = ["#5a3214", "#3a2418", "#8a5a28", "#2a1810", "#6a4428", "#4a3018"][h % 6]!;
  const griva = ["#1a0c08", "#3a1c10", "#c4b090", "#2a1810"][h % 4]!;
  return { boja, griva };
}

export function LikAvatar({
  p,
  mood,
  veliki,
  jaše,
}: {
  p: Stanovnik;
  mood: string;
  veliki?: boolean;
  jaše?: boolean;
}) {
  const t = likTema(p);
  const zena = p.spol === "z";
  const kauboj = p.hub === "konji" || p.posao === "Kauboj" || p.posao === "Kaubojka" || p.posao === "Jahač" || p.posao === "Konjušar" || p.posao === "Konjušarica";
  const sesir = !zena || p.hub === "jelo" || p.hub === "konji" || p.posao === "Šerif" || p.posao === "Zamjenik" || kauboj;
  const usta =
    mood === "glad" ? "M36 41 Q40 44 44 41" :
    mood === "zurka" ? "M36 40 Q40 45 44 40" :
    mood === "nered" ? "M36 42 L44 42" :
    mood === "susa" || mood === "pjeske" ? "M38 41 Q40 43 42 41" :
    "M37 41 Q40 43 43 41";
  const obrve = mood === "nered" || mood === "glad" || mood === "pjeske";
  const k = jaše ? konjTema(p.ime) : null;

  return (
    <svg
      viewBox={jaše ? "8 0 92 112" : "0 0 80 108"}
      className={cn("kauba-avatar", veliki && "kauba-avatar-veliki", jaše && "kauba-avatar-jase")}
      aria-hidden
    >
      {jaše && k ? <Konj boja={k.boja} griva={k.griva} /> : <ellipse cx="40" cy="102" rx="16" ry="4" fill="#1a0c08" opacity="0.35" />}
      <g transform={jaše ? "translate(0 -22)" : undefined}>
        {!jaše && (
          <>
            <rect x="30" y="82" width="7" height="16" rx="2" fill={t.hlace} />
            <rect x="43" y="82" width="7" height="16" rx="2" fill={t.hlace} />
            <rect x="28" y="94" width="10" height="6" rx="2" fill={t.cizma} />
            <rect x="42" y="94" width="10" height="6" rx="2" fill={t.cizma} />
          </>
        )}
        {zena ? (
          <path d="M24 62 Q40 58 56 62 L54 86 Q40 92 26 86 Z" fill={t.prsluk} />
        ) : (
          <rect x="26" y="58" width="28" height="28" rx="6" fill={t.kosulja} />
        )}
        {!zena && <rect x="28" y="60" width="24" height="20" rx="4" fill={t.prsluk} />}
        <rect x="22" y="58" width="8" height="22" rx="4" fill={t.kosulja} />
        <rect x="50" y="58" width="8" height="22" rx="4" fill={t.kosulja} />
        <path d="M28 56 Q40 64 52 56 L50 62 Q40 68 30 62 Z" fill={t.traka} />
        <Alat alat={p.alat} t={t} />
        {zena && (
          <>
            <ellipse cx="26" cy="38" rx="6" ry="10" fill={t.kosa} />
            <ellipse cx="54" cy="38" rx="6" ry="10" fill={t.kosa} />
          </>
        )}
        <circle cx="40" cy="34" r="14" fill={t.koza} />
        <ellipse cx="40" cy="38" rx="14" ry="8" fill={t.kosa} opacity={zena ? 0.15 : 0} />
        {obrve && (
          <>
            <path d="M31 29 L37 31" stroke="#1a0c08" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M49 29 L43 31" stroke="#1a0c08" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
        {mood === "zurka" ? (
          <>
            <path d="M32 33 Q35 31 38 33" fill="none" stroke="#1a0c08" strokeWidth="1.5" />
            <path d="M42 33 Q45 31 48 33" fill="none" stroke="#1a0c08" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <circle cx="35" cy="33" r="1.6" fill="#1a0c08" />
            <circle cx="45" cy="33" r="1.6" fill="#1a0c08" />
            <circle cx="34.6" cy="32.6" r="0.5" fill="#fff8e8" />
            <circle cx="44.6" cy="32.6" r="0.5" fill="#fff8e8" />
          </>
        )}
        {!zena && <path d="M34 38 Q40 41 46 38" fill="none" stroke={t.kosa} strokeWidth="2.2" strokeLinecap="round" />}
        <path d={usta} fill="none" stroke="#8a4a38" strokeWidth="1.4" strokeLinecap="round" />
        {mood === "susa" && <ellipse cx="52" cy="40" rx="1.6" ry="2.4" fill="#7eb8d4" />}
        {zena && !sesir && (
          <path d="M26 28 Q40 16 54 28 Q40 24 26 28" fill={t.kosa} />
        )}
        {sesir && (
          <g>
            <ellipse cx="40" cy="24" rx="22" ry="4.5" fill={t.sesir} />
            <rect x="28" y="10" width="24" height="14" rx="6" fill={t.sesir} />
            <rect x="28" y="20" width="24" height="3" fill={t.traka} />
          </g>
        )}
        {(p.posao === "Šerif" || p.posao === "Zamjenik") && (
          <polygon points="40,64 42,69 47,69 43,72 45,77 40,74 35,77 37,72 33,69 38,69" fill={t.traka} stroke="#3a2808" strokeWidth="0.5" />
        )}
      </g>
    </svg>
  );
}
