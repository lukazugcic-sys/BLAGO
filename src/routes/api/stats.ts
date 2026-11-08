import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { serverDanKey } from "@/lib/game/daily";
import { statsKljucOdgovara } from "@/lib/game/statsKljuc";

function danPomak(key: string, delta: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

async function GET({ request }: { request: Request }) {
  if (!statsKljucOdgovara(request.headers.get("x-blago-kljuc") || "")) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const danas = serverDanKey();
  const jucer = danPomak(danas, -1);
  const prije7 = danPomak(danas, -7);
  try {
    const sql = await getSql();
    const dau = await sql<{ n: number }>`
      select count(distinct igrac)::int as n from blago_dogadaj
      where dan = ${danas} and ime = 'session_start'`;
    const novi = await sql<{ n: number }>`
      select count(*)::int as n from (
        select igrac, min(dan) as prvi from blago_dogadaj
        where ime = 'session_start' group by igrac
      ) s where prvi = ${danas}`;
    const d1baza = await sql<{ n: number }>`
      select count(*)::int as n from (
        select igrac, min(dan) as prvi from blago_dogadaj
        where ime = 'session_start' group by igrac
      ) s where prvi = ${jucer}`;
    const d1ostalo = await sql<{ n: number }>`
      select count(*)::int as n from (
        select igrac, min(dan) as prvi from blago_dogadaj
        where ime = 'session_start' group by igrac
      ) s
      where prvi = ${jucer}
        and exists (
          select 1 from blago_dogadaj d
          where d.igrac = s.igrac and d.dan = ${danas} and d.ime = 'session_start'
        )`;
    const d7baza = await sql<{ n: number }>`
      select count(*)::int as n from (
        select igrac, min(dan) as prvi from blago_dogadaj
        where ime = 'session_start' group by igrac
      ) s where prvi = ${prije7}`;
    const d7ostalo = await sql<{ n: number }>`
      select count(*)::int as n from (
        select igrac, min(dan) as prvi from blago_dogadaj
        where ime = 'session_start' group by igrac
      ) s
      where prvi = ${prije7}
        and exists (
          select 1 from blago_dogadaj d
          where d.igrac = s.igrac and d.dan = ${danas} and d.ime = 'session_start'
        )`;
    const pocetak = await sql<{ n: number }>`
      select count(distinct igrac)::int as n from blago_dogadaj
      where ime = 'tutorial_step' and broj = 0`;
    const funnel = await sql<{ broj: number; n: number }>`
      select broj::int as broj, count(distinct igrac)::int as n
      from blago_dogadaj
      where ime = 'tutorial_step' and broj is not null
      group by broj order by broj`;
    const sesija = await sql<{ n: number; c: number }>`
      select coalesce(avg(ms), 0)::int as n, count(*)::int as c
      from blago_dogadaj
      where ime = 'session_end' and ms is not null and t > now() - interval '7 days'`;
    const greske = await sql<{ rec: string; n: number }>`
      select coalesce(rec, '') as rec, count(*)::int as n
      from blago_dogadaj
      where ime = 'error' and t > now() - interval '7 days'
      group by rec order by n desc limit 8`;
    const baza = Math.max(1, pocetak[0]?.n ?? 0);
    return Response.json({
      ok: true,
      dan: danas,
      dau: dau[0]?.n ?? 0,
      novi: novi[0]?.n ?? 0,
      d1: { ostalo: d1ostalo[0]?.n ?? 0, baza: d1baza[0]?.n ?? 0 },
      d7: { ostalo: d7ostalo[0]?.n ?? 0, baza: d7baza[0]?.n ?? 0 },
      sesija: { prosjekMs: sesija[0]?.n ?? 0, n: sesija[0]?.c ?? 0 },
      funnel: funnel.map((r) => ({ broj: r.broj, n: r.n, pct: Math.round((r.n / baza) * 100) })),
      greske: greske.map((g) => ({ rec: g.rec || "(prazno)", n: g.n })),
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/stats")({
  server: { handlers: { GET } },
});
