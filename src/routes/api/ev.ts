import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { serverDanKey } from "@/lib/game/daily";

const IMENA = new Set([
  "session_start",
  "session_end",
  "tutorial_step",
  "tutorial_done",
  "tutorial_skip",
  "spin",
  "build",
  "upgrade",
  "quest_claim",
  "daily_claim",
  "tab_open",
  "purchase_burza",
  "raid",
  "error",
]);

const kutija = new Map<string, { n: number; doKad: number }>();

function smije(id: string, komada: number) {
  const sad = Date.now();
  const z = kutija.get(id);
  if (!z || z.doKad < sad) {
    kutija.set(id, { n: komada, doKad: sad + 60_000 });
    return komada <= 40;
  }
  z.n += komada;
  return z.n <= 80;
}

async function POST({ request }: { request: Request }) {
  let body: {
    id?: unknown;
    verzija?: unknown;
    platforma?: unknown;
    dogadaji?: unknown;
  } = {};
  try {
    const tekst = await request.text();
    if (tekst.length > 16_000) return Response.json({ ok: false }, { status: 413 });
    body = JSON.parse(tekst) as typeof body;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const id = typeof body.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(body.id) ? body.id : "";
  if (!id) return Response.json({ ok: false }, { status: 400 });
  const platforma = body.platforma === "apk" ? "apk" : "web";
  const verzija = typeof body.verzija === "string" ? body.verzija.slice(0, 32) : "";
  const lista = Array.isArray(body.dogadaji) ? body.dogadaji.slice(0, 40) : [];
  const dan = serverDanKey();
  const redovi: Array<{ ime: string; broj: number | null; ms: number | null; rec: string | null }> = [];
  for (const sirovo of lista) {
    if (!sirovo || typeof sirovo !== "object") continue;
    const o = sirovo as { ime?: unknown; broj?: unknown; ms?: unknown; rec?: unknown };
    if (typeof o.ime !== "string" || !IMENA.has(o.ime)) continue;
    const broj = Number.isFinite(Number(o.broj)) ? Math.max(0, Math.min(9999, Math.floor(Number(o.broj)))) : null;
    const ms = Number.isFinite(Number(o.ms)) ? Math.max(0, Math.min(86_400_000, Math.floor(Number(o.ms)))) : null;
    const rec = typeof o.rec === "string" ? o.rec.replace(/\s+/g, " ").trim().slice(0, 140) : "";
    redovi.push({ ime: o.ime, broj, ms, rec: rec || null });
  }
  if (!redovi.length) return Response.json({ ok: true, n: 0 });
  if (!smije(id, redovi.length)) return Response.json({ ok: false }, { status: 429 });
  try {
    const sql = await getSql();
    for (const r of redovi) {
      await sql`insert into blago_dogadaj (igrac, ime, verzija, platforma, dan, broj, ms, rec)
        values (${id}, ${r.ime}, ${verzija}, ${platforma}, ${dan}, ${r.broj}, ${r.ms}, ${r.rec})`;
    }
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true, n: redovi.length });
}

export const Route = createFileRoute("/api/ev")({
  server: { handlers: { POST } },
});
