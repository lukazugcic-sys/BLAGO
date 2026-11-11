import type { CSSProperties } from "react";

/**
 * Stylised low-poly covered wagon with a horse, drawn in the map's vector style
 * (transparent background, no frame). Replaces the photographic kola.webp in the
 * caravan view; position/progress are still driven by the caller.
 * 0.9.174: zadano gleda ULIJEVO (konj lijevo od kola). Tko vozi udesno zrcali
 * cijelu sličicu (CSS data-smjer="d"), pa smjer uvijek prati kretanje.
 */
export function KaravanaKola({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 96 56"
      role="img"
      aria-label="Karavana"
      focusable="false"
      data-smjer-slike="l"
    >
      <g className="karavana-kola-lijevo" transform="translate(96 0) scale(-1 1)">
      <ellipse cx="50" cy="50" rx="40" ry="4.5" fill="#1a100c55" />
      {/* horse */}
      <g fill="#6a3d1e" stroke="#2b1814" strokeWidth="0.8" strokeLinejoin="round">
        <polygon points="70,30 86,30 88,36 72,37" />
        <polygon points="84,30 90,22 94,23 92,29 88,32" />
        <polygon points="73,36 74,47 76,47 76,37" />
        <polygon points="84,35 85,47 87,47 87,35" />
      </g>
      <polygon points="90,22 92,18 93,22" fill="#2b1814" />
      <line x1="62" y1="38" x2="73" y2="33" stroke="#3a2414" strokeWidth="1.4" />
      {/* wagon bed */}
      <polygon points="18,32 64,32 62,40 20,40" fill="#8a5a2e" stroke="#2b1814" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="20,40 62,40 61,42 21,42" fill="#5c3824" />
      {/* canvas bonnet */}
      <path d="M20 32 C20 14 30 9 41 9 C52 9 62 14 62 32 Z" fill="#f2e2bf" stroke="#2b1814" strokeWidth="1" strokeLinejoin="round" />
      <path d="M41 9 C52 9 62 14 62 32 L52 32 C52 18 48 11 41 9 Z" fill="#d9c49a" />
      <g stroke="#a88a5c" strokeWidth="1">
        <path d="M30 31 C30 18 33 12 36 10.5" fill="none" />
        <path d="M41 31 V9.5" />
        <path d="M52 31 C52 18 49 12 46 10.5" fill="none" />
      </g>
      {/* wheels */}
      {[
        [26, 44, 7.5],
        [56, 44, 7.5],
      ].map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2b1814" strokeWidth="2.2" />
          <circle cx={cx} cy={cy} r={r - 1.6} fill="none" stroke="#a06a3c" strokeWidth="1" />
          <path d={`M${cx - r + 1} ${cy}H${cx + r - 1}M${cx} ${cy - r + 1}V${cy + r - 1}`} stroke="#6a4328" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="1.6" fill="#2b1814" />
        </g>
      ))}
      </g>
    </svg>
  );
}
