import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/stats")({
  ssr: false,
  component: Stats,
});

const KORACI = [
  "Priča",
  "Prva vrtnja",
  "Druga vrtnja",
  "Kuća",
  "Drvo",
  "Nalog",
  "Kauboj",
  "Burza",
  "Bunar",
  "Rođenje",
];

type Odgovor = {
  ok: boolean;
  dan?: string;
  dau?: number;
  novi?: number;
  d1?: { ostalo: number; baza: number };
  d7?: { ostalo: number; baza: number };
  sesija?: { prosjekMs: number; n: number };
  funnel?: Array<{ broj: number; n: number; pct: number }>;
  greske?: Array<{ rec: string; n: number }>;
};

function pct(ostalo: number, baza: number) {
  if (!baza) return "—";
  return `${Math.round((ostalo / baza) * 100)}%`;
}

function minuta(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m} min ${s % 60} s`;
}

function Stats() {
  const [kljuc, setKljuc] = useState("");
  const [podaci, setPodaci] = useState<Odgovor | null>(null);
  const [greska, setGreska] = useState("");

  const ucitaj = async () => {
    setGreska("");
    setPodaci(null);
    const r = await fetch("/api/stats", { headers: { "x-blago-kljuc": kljuc } });
    if (r.status === 404) {
      setGreska("Ključ nije postavljen na poslužitelju.");
      return;
    }
    if (r.status === 401) {
      setGreska("Krivi ključ.");
      return;
    }
    if (!r.ok) {
      setGreska("Statistika se nije učitala.");
      return;
    }
    setPodaci((await r.json()) as Odgovor);
  };

  return (
    <main className="min-h-dvh bg-void px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">BLAGO</p>
        <h1 className="mt-1 font-display text-3xl text-gold">Statistika</h1>
        <p className="mt-2 text-sm font-bold text-dim">
          Ključ se postavlja u okolini poslužitelja, varijabla BLAGO_STATS_KEY. Ne ide u igru.
        </p>
        <label className="mt-4 block text-[11px] font-bold tracking-widest text-dim uppercase" htmlFor="stats-kljuc">
          Ključ
        </label>
        <input
          id="stats-kljuc"
          type="password"
          autoComplete="off"
          value={kljuc}
          onChange={(e) => setKljuc(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-3 text-base font-bold text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => void ucitaj()}
          className="mt-3 min-h-11 rounded-full bg-gold px-5 text-sm font-bold tracking-widest text-void uppercase"
        >
          Otvori
        </button>
        {greska && <p className="mt-3 text-sm font-bold text-ruby">{greska}</p>}
        {podaci?.ok && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-[11px] font-bold text-dim">Dan {podaci.dan}</p>
            <table className="w-full text-left text-sm">
              <tbody>
                <Tr naziv="DAU" vrijednost={String(podaci.dau ?? 0)} />
                <Tr naziv="Novi igrači" vrijednost={String(podaci.novi ?? 0)} />
                <Tr naziv="D1 retencija" vrijednost={`${pct(podaci.d1?.ostalo ?? 0, podaci.d1?.baza ?? 0)} (${podaci.d1?.ostalo ?? 0}/${podaci.d1?.baza ?? 0})`} />
                <Tr naziv="D7 retencija" vrijednost={`${pct(podaci.d7?.ostalo ?? 0, podaci.d7?.baza ?? 0)} (${podaci.d7?.ostalo ?? 0}/${podaci.d7?.baza ?? 0})`} />
                <Tr naziv="Sesija, prosjek 7 d" vrijednost={`${minuta(podaci.sesija?.prosjekMs ?? 0)} · ${podaci.sesija?.n ?? 0}`} />
              </tbody>
            </table>
            <h2 className="text-xs font-bold tracking-widest text-gold uppercase">Vodič</h2>
            <ul className="flex flex-col gap-1.5">
              {(podaci.funnel ?? []).map((f) => (
                <li key={f.broj} className="flex items-center gap-2 text-[12px] font-bold">
                  <span className="w-28 shrink-0 text-dim">{KORACI[f.broj] ?? f.broj}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-panel">
                    <span className="block h-full bg-gold" style={{ width: `${Math.min(100, f.pct)}%` }} />
                  </span>
                  <span className="w-16 text-right tabular-nums">{f.pct}% · {f.n}</span>
                </li>
              ))}
              {(podaci.funnel ?? []).length === 0 && <li className="text-sm font-bold text-dim">Još nema koraka.</li>}
            </ul>
            <h2 className="text-xs font-bold tracking-widest text-gold uppercase">Greške, 7 dana</h2>
            <ul className="flex flex-col gap-1">
              {(podaci.greske ?? []).map((g) => (
                <li key={g.rec} className="text-[12px] font-bold text-ink/80">
                  {g.n}× {g.rec}
                </li>
              ))}
              {(podaci.greske ?? []).length === 0 && <li className="text-sm font-bold text-dim">Nema grešaka.</li>}
            </ul>
          </div>
        )}
        <Link to="/" className="mt-8 inline-block text-xs font-bold tracking-widest text-dim uppercase">
          Natrag u igru
        </Link>
      </div>
    </main>
  );
}

function Tr({ naziv, vrijednost }: { naziv: string; vrijednost: string }) {
  return (
    <tr className="border-b border-line/60">
      <th className="py-2 pr-3 font-bold text-dim">{naziv}</th>
      <td className="py-2 text-right font-bold tabular-nums">{vrijednost}</td>
    </tr>
  );
}
