import { useEffect, useState } from "react";
import { LikAvatar } from "./LikAvatar";
import { cn } from "@/lib/utils";
import type { Stanovnik } from "@/lib/game/ljudi";

const RECI_RADA = ["Drži dasku.", "Još jedan udar.", "Krov ide.", "Skoro gotovo."];

export function GradnjaScena({
  majstor,
  segrti = [],
  start,
  kraj,
  rec,
  kompaktna,
}: {
  majstor: Stanovnik | null;
  segrti?: Stanovnik[];
  start: number;
  kraj: number;
  rec: string;
  kompaktna?: boolean;
}) {
  const [sad, setSad] = useState(() => Date.now());
  useEffect(() => {
    setSad(Date.now());
    const t = window.setInterval(() => setSad(Date.now()), 160);
    return () => window.clearInterval(t);
  }, [start, kraj]);
  const traje = Math.max(1, kraj - start);
  const pct = Math.max(0, Math.min(100, Math.round(((sad - start) / traje) * 100)));
  const ostalo = Math.max(0, Math.ceil((kraj - sad) / 1000));
  const ucenik = segrti[0] ?? null;
  const drugi = segrti[1] ?? null;
  const recRada = RECI_RADA[Math.min(3, Math.floor(pct / 25))]!;
  const gotovo = pct >= 92;
  return (
    <div
      className={cn(
        "gradnja-scena",
        kompaktna && "gradnja-scena-kompakt",
        gotovo && "gradnja-scena-gotova",
      )}
      style={{ ["--pct" as string]: String(pct) }}
      aria-hidden
    >
      <span className="gradnja-tlo" />
      <span className="gradnja-temelj" />
      <span className="gradnja-zid" />
      {pct >= 52 && <span className="gradnja-krov" />}
      <svg viewBox="0 0 80 70" className="gradnja-skele" aria-hidden>
        <rect x="6" y="8" width="5" height="56" fill="#c4a06a" />
        <rect x="69" y="8" width="5" height="56" fill="#a07840" />
        <rect x="36" y="14" width="4" height="50" fill="#a07840" />
        <rect x="4" y="22" width="72" height="4" fill="#8a5a28" />
        <rect x="8" y="38" width="64" height="4" fill="#8a5a28" />
        <rect x="10" y="52" width="60" height="4" fill="#8a5a28" />
        <rect x="10" y="4" width="60" height="6" fill="#e8c878" />
        <path d="M11 10 L69 22" stroke="#5a3214" strokeWidth="1.4" />
        <path d="M69 10 L11 22" stroke="#5a3214" strokeWidth="1.4" />
        <rect x="58" y="26" width="8" height="10" rx="1" fill="#6a4218" className="gradnja-kanta" />
      </svg>
      <span className="gradnja-daska" />
      <span className="gradnja-daska gradnja-daska-2" />
      <span className="gradnja-iver" />
      <span className="gradnja-iver gradnja-iver-2" />
      <span className="gradnja-iver gradnja-iver-3" />
      <span className="gradnja-iver gradnja-iver-4" />
      <span className="gradnja-prasina" />
      <span className="gradnja-prasina gradnja-prasina-2" />
      <span className="gradnja-prasina gradnja-prasina-3" />
      <span className="gradnja-iskra" />
      <span className="gradnja-iskra gradnja-iskra-2" />
      <span className="gradnja-cava" />
      <span className="gradnja-udar-prsten" />
      <span className="gradnja-piljevina" />
      {majstor && (
        <span className="gradnja-majstor">
          <LikAvatar p={majstor} mood="dokolica" />
          <span className="gradnja-cekic" />
          <span className="gradnja-znoj" />
          <span className="gradnja-znoj gradnja-znoj-2" />
        </span>
      )}
      {ucenik && (
        <span className="gradnja-segrt">
          <LikAvatar p={ucenik} mood="dokolica" />
          <span className="gradnja-segrt-teret" />
        </span>
      )}
      {drugi && (
        <span className="gradnja-segrt gradnja-segrt-2">
          <LikAvatar p={drugi} mood="dokolica" />
        </span>
      )}
      {gotovo && (
        <>
          <span className="gradnja-konfeti" />
          <span className="gradnja-konfeti gradnja-konfeti-2" />
          <span className="gradnja-konfeti gradnja-konfeti-3" />
        </>
      )}
      <span className="gradnja-rec">
        {gotovo ? "Gotovo!" : rec} · {ostalo}s
      </span>
      {!kompaktna && majstor && !gotovo && (
        <span className="gradnja-balon">{recRada}</span>
      )}
      <span className="gradnja-traka">
        <span className="gradnja-traka-pun" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
