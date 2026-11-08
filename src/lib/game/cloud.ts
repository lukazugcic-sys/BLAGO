import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { generirajKlanZadatke } from "@/lib/game/constants";
import { dohvatiLokalneMete, izracunajPlijen, plijenUkupno } from "@/lib/game/raids";
import { alatLv } from "@/lib/game/tuning";
import type { DebriefStav, Dobitak, Gradnja, Karavana, Klan, KlanZadatak, KronikaZapis, Misija, RaidMeta, Resursi, SimbolId } from "@/lib/game/types";
import type { Stanovnik, Segrt, Zamjenik } from "@/lib/game/ljudi";
import type { KaubaDogadaj } from "@/lib/game/dogadaji";
import type { JutarnjiPosao } from "@/lib/game/jutro";

export type CloudPayload = {
  imeIgraca: string;
  igracRazina: number;
  prestigeRazina: number;
  krunjenja?: number;
  xp: number;
  energija: number;
  zlato: number;
  dijamanti: number;
  resursi: Resursi;
  stitovi: number;
  gradevine: Record<string, number>;
  ostecenja: Record<string, boolean>;
  razine: Record<string, number>;
  misije: Misija[];
  zadnjiNalozi?: string[];
  tecaj: Record<string, { kupi: number; prodaj: number }>;
  trend: Record<string, number>;
  luckySpinCounter: number;
  winStreak: number;
  winStreakDo?: number;
  aktivniSkin: string;
  skinovi?: string[];
  klan: Klan;
  ukupnoVrtnji: number;
  ukupnoZlata: number;
  dostignucaDone: Record<string, boolean>;
  kronika?: KronikaZapis[];
  stavSela?: DebriefStav | null;
  stanovnici?: number;
  ljudi?: Stanovnik[];
  segrti?: Segrt[];
  zamjenici?: Zamjenik[];
  dogadaj?: KaubaDogadaj | null;
  zadnjiDogadaj?: number;
  bankaZlato?: number;
  faroKrupije?: string | null;
  konjiBroj?: number;
  konjiDuznost?: Record<string, number>;
  sijenoDo?: number;
  potkove?: number;
  potkoveDo?: number;
  kisaDo?: number;
  travaDo?: number;
  govedaBroj?: number;
  govedaDuznost?: Record<string, number>;
  knjigaSkup?: number;
  besplatneVrtnje?: number;
  besplatneExpand?: string | null;
  besplatneUlog?: number;
  serifCin?: number;
  celijaBroj?: number;
  gradnje?: Gradnja[];
  gradnja?: Gradnja | null;
  karavana?: Karavana | null;
  potjernice?: Record<string, number>;
  potjerniceSetovi?: string[];
  tjedanKljuc?: string;
  tjedanCeker?: boolean;
  tjedanPohod?: boolean;
  jutroDan?: string;
  jutro?: JutarnjiPosao[];
  zadnjiResursTick?: number;
  zadnjaEnergijaTick?: number;
  zadnjiMetakTick?: number;
  savedAt?: number;
  dobitakNaCekanju?: Dobitak | null;
  gambleCount?: number;
  slotSimboli?: SimbolId[];
  _raidNotice?: Pending | null;
};

type Pending = { drvo: number; kamen: number; zeljezo: number };

function asNum(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nenegSave(v: unknown, fallback = 0) {
  const n = asNum(v, Number.NaN);
  if (!Number.isFinite(n) || n < 0) return Math.max(0, fallback);
  return n;
}

const SIMBOLI_OK = new Set<string>(["skull", "wood", "stone", "iron", "gold", "energy", "gem", "shield", "wild", "knjiga"]);

function simboliSave(raw: unknown): SimbolId[] | undefined {
  if (!Array.isArray(raw) || raw.length !== 15) return undefined;
  if (!raw.every((x) => typeof x === "string" && SIMBOLI_OK.has(x))) return undefined;
  return raw as SimbolId[];
}

function dobitakSave(raw: unknown): Dobitak | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    zlato: nenegSave(r.zlato),
    dijamanti: nenegSave(r.dijamanti),
    energija: nenegSave(r.energija),
    stitovi: nenegSave(r.stitovi),
    drvo: nenegSave(r.drvo),
    kamen: nenegSave(r.kamen),
    zeljezo: nenegSave(r.zeljezo),
    linije: nenegSave(r.linije),
  };
}

function capRazineSave(raw: unknown) {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    sreca: alatLv("sreca", nenegSave(r.sreca)),
    pojacalo: alatLv("pojacalo", nenegSave(r.pojacalo)),
    baterija: alatLv("baterija", nenegSave(r.baterija)),
    oklop: alatLv("oklop", nenegSave(r.oklop)),
    wildBoost: alatLv("wildBoost", nenegSave(r.wildBoost)),
  };
}

/** Ulaz mora biti objekt. Brojevi su konačni i ≥ 0, razine alata su pod kapom. */
export function provjeriCloudPayload(d: unknown): CloudPayload {
  if (!d || typeof d !== "object" || Array.isArray(d)) throw new Error("neispravan save");
  const raw = d as CloudPayload;
  const razine = capRazineSave(raw.razine);
  const resursi = raw.resursi && typeof raw.resursi === "object" ? raw.resursi : { drvo: 0, kamen: 0, zeljezo: 0 };
  const savedAt = asNum(raw.savedAt, Number.NaN);
  const simboli = simboliSave(raw.slotSimboli);
  return {
    ...raw,
    imeIgraca: String(raw.imeIgraca ?? "Kauboj").slice(0, 32),
    igracRazina: Math.max(1, Math.floor(nenegSave(raw.igracRazina, 1))),
    prestigeRazina: Math.floor(nenegSave(raw.prestigeRazina, 0)),
    xp: nenegSave(raw.xp),
    energija: nenegSave(raw.energija),
    zlato: nenegSave(raw.zlato),
    dijamanti: nenegSave(raw.dijamanti),
    stitovi: nenegSave(raw.stitovi),
    ukupnoVrtnji: nenegSave(raw.ukupnoVrtnji),
    ukupnoZlata: nenegSave(raw.ukupnoZlata),
    winStreak: Math.floor(nenegSave(raw.winStreak)),
    luckySpinCounter: Math.max(0, Math.floor(nenegSave(raw.luckySpinCounter, 0))),
    resursi: {
      drvo: nenegSave(resursi.drvo),
      kamen: nenegSave(resursi.kamen),
      zeljezo: nenegSave(resursi.zeljezo),
    },
    razine,
    savedAt: Number.isFinite(savedAt) && savedAt >= 0 ? savedAt : Date.now(),
    gambleCount: Math.max(0, Math.min(3, Math.floor(nenegSave(raw.gambleCount, 0)))),
    dobitakNaCekanju: raw.dobitakNaCekanju ? dobitakSave(raw.dobitakNaCekanju) : null,
    ...(simboli ? { slotSimboli: simboli } : { slotSimboli: undefined }),
  };
}

function parsePending(raw: unknown): Pending[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    drvo: asNum((p as Pending).drvo),
    kamen: asNum((p as Pending).kamen),
    zeljezo: asNum((p as Pending).zeljezo),
  }));
}

function sumPending(list: Pending[]): Pending {
  return list.reduce(
    (a, p) => ({
      drvo: a.drvo + p.drvo,
      kamen: a.kamen + p.kamen,
      zeljezo: a.zeljezo + p.zeljezo,
    }),
    { drvo: 0, kamen: 0, zeljezo: 0 },
  );
}

async function sql() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export const loadCloudSave = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await sql();
    const rows = await db<{
      ime_igraca: string;
      igrac_razina: number;
      prestige_razina: number;
      ukupno_zlata: number;
      ukupno_vrtnji: number;
      zlato: number;
      dijamanti: number;
      stitovi: number;
      drvo: number;
      kamen: number;
      zeljezo: number;
      clan_id: number | null;
      save: CloudPayload | string;
      raid_pending: unknown;
    }>`select * from player_saves where user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) return null;

    const pending = parsePending(row.raid_pending);
    const stolen = sumPending(pending);
    await db`update player_saves set raid_pending = '[]'::jsonb where user_id = ${context.userId}`;

    const blob = typeof row.save === "string" ? (JSON.parse(row.save) as CloudPayload) : row.save;
    const klan = await loadClanForPlayer(db, row.clan_id, blob.klan);

    return {
      ...blob,
      imeIgraca: row.ime_igraca,
      igracRazina: asNum(row.igrac_razina, blob.igracRazina),
      prestigeRazina: asNum(row.prestige_razina, blob.prestigeRazina),
      ukupnoZlata: asNum(row.ukupno_zlata, blob.ukupnoZlata),
      ukupnoVrtnji: asNum(row.ukupno_vrtnji, blob.ukupnoVrtnji),
      zlato: asNum(row.zlato, blob.zlato),
      dijamanti: asNum(row.dijamanti, blob.dijamanti),
      stitovi: asNum(row.stitovi, blob.stitovi),
      resursi: {
        drvo: asNum(row.drvo, blob.resursi?.drvo),
        kamen: asNum(row.kamen, blob.resursi?.kamen),
        zeljezo: asNum(row.zeljezo, blob.resursi?.zeljezo),
      },
      klan,
      _raidNotice: stolen.drvo + stolen.kamen + stolen.zeljezo > 0 ? stolen : null,
    } satisfies CloudPayload & { _raidNotice: Pending | null };
  });

export const pushCloudSave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => provjeriCloudPayload(d))
  .handler(async ({ context, data }) => {
    const db = await sql();
    const pendingRows = await db<{ raid_pending: unknown }>`
      select raid_pending from player_saves where user_id = ${context.userId}
    `;
    const stolen = sumPending(parsePending(pendingRows[0]?.raid_pending));
    const drvo = Math.max(0, Math.floor(data.resursi.drvo) - stolen.drvo);
    const kamen = Math.max(0, Math.floor(data.resursi.kamen) - stolen.kamen);
    const zeljezo = Math.max(0, Math.floor(data.resursi.zeljezo) - stolen.zeljezo);
    const blob = JSON.stringify({
      ...data,
      resursi: { drvo, kamen, zeljezo },
    });
    const clanId = await clanIdByName(db, data.klan?.naziv);

    await db`
      insert into player_saves (
        user_id, ime_igraca, igrac_razina, prestige_razina, ukupno_zlata, ukupno_vrtnji,
        zlato, dijamanti, stitovi, drvo, kamen, zeljezo, clan_id, save, raid_pending, updated_at
      ) values (
        ${context.userId}, ${data.imeIgraca.slice(0, 32)}, ${data.igracRazina}, ${data.prestigeRazina},
        ${data.ukupnoZlata}, ${data.ukupnoVrtnji}, ${Math.floor(data.zlato)}, ${Math.floor(data.dijamanti)},
        ${data.stitovi}, ${drvo}, ${kamen}, ${zeljezo}, ${clanId}, ${blob}::jsonb, '[]'::jsonb, now()
      )
      on conflict (user_id) do update set
        ime_igraca = excluded.ime_igraca,
        igrac_razina = excluded.igrac_razina,
        prestige_razina = excluded.prestige_razina,
        ukupno_zlata = excluded.ukupno_zlata,
        ukupno_vrtnji = excluded.ukupno_vrtnji,
        zlato = excluded.zlato,
        dijamanti = excluded.dijamanti,
        stitovi = excluded.stitovi,
        drvo = excluded.drvo,
        kamen = excluded.kamen,
        zeljezo = excluded.zeljezo,
        clan_id = excluded.clan_id,
        save = excluded.save,
        raid_pending = '[]'::jsonb,
        updated_at = now()
    `;
    return { ok: true as const, stolen };
  });

/** Briše samo red ove prijave. Novi početak ne smije ostaviti tuđi ni stari save. */
export const deleteCloudSave = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await sql();
    await db`delete from player_saves where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const listLeaderboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = await sql();
    const rows = await db<{
      user_id: string;
      ime_igraca: string;
      igrac_razina: number;
      prestige_razina: number;
      ukupno_zlata: number;
      ukupno_vrtnji: number;
      clan_id: number | null;
      naziv: string | null;
    }>`
      select p.user_id, p.ime_igraca, p.igrac_razina, p.prestige_razina,
             p.ukupno_zlata, p.ukupno_vrtnji, p.clan_id, c.naziv
      from player_saves p
      left join clans c on c.id = p.clan_id
      order by p.prestige_razina desc, p.ukupno_zlata desc
      limit 40
    `;
    return rows.map((r) => ({
      uid: r.user_id,
      imeIgraca: r.ime_igraca,
      igracRazina: asNum(r.igrac_razina),
      prestigeRazina: asNum(r.prestige_razina),
      ukupnoZlata: asNum(r.ukupno_zlata),
      ukupnoVrtnji: asNum(r.ukupno_vrtnji),
      klanNaziv: r.naziv,
    }));
  });

export const listRaidTargets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await sql();
    const rows = await db<{
      user_id: string;
      ime_igraca: string;
      igrac_razina: number;
      drvo: number;
      kamen: number;
      zeljezo: number;
    }>`
      select user_id, ime_igraca, igrac_razina, drvo, kamen, zeljezo
      from player_saves
      where user_id <> ${context.userId}
        and coalesce(stitovi, 0) = 0
        and (coalesce(drvo, 0) + coalesce(kamen, 0) + coalesce(zeljezo, 0)) > 10
      order by random()
      limit 5
    `;
    const real: RaidMeta[] = rows.map((r) => ({
      uid: r.user_id,
      imeIgraca: r.ime_igraca,
      igracRazina: asNum(r.igrac_razina),
      resursi: {
        drvo: asNum(r.drvo),
        kamen: asNum(r.kamen),
        zeljezo: asNum(r.zeljezo),
      },
    }));
    if (real.length >= 5) return real;
    const pad = dohvatiLokalneMete(5 - real.length);
    return [...real, ...pad];
  });

export const attackPlayer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((targetId: string) => targetId)
  .handler(async ({ context, data: targetId }) => {
    if (!targetId || targetId === context.userId || targetId.startsWith("npc-")) {
      return { ok: false as const, reason: "invalid" as const };
    }
    const db = await sql();
    const targets = await db<{
      stitovi: number;
      drvo: number;
      kamen: number;
      zeljezo: number;
    }>`select stitovi, drvo, kamen, zeljezo from player_saves where user_id = ${targetId}`;
    const t = targets[0];
    if (!t) return { ok: false as const, reason: "missing" as const };

    if (asNum(t.stitovi) > 0) {
      await db`update player_saves set stitovi = stitovi - 1, updated_at = now() where user_id = ${targetId} and stitovi > 0`;
      return { ok: true as const, blocked: true as const };
    }

    const stolen = izracunajPlijen({
      drvo: asNum(t.drvo),
      kamen: asNum(t.kamen),
      zeljezo: asNum(t.zeljezo),
    });
    if (plijenUkupno(stolen) <= 0) {
      return { ok: true as const, blocked: false as const, stolen };
    }
    const pending = JSON.stringify(stolen);
    await db`
      update player_saves set
        drvo = greatest(0, drvo - ${stolen.drvo}),
        kamen = greatest(0, kamen - ${stolen.kamen}),
        zeljezo = greatest(0, zeljezo - ${stolen.zeljezo}),
        raid_pending = raid_pending || jsonb_build_array(${pending}::jsonb),
        updated_at = now()
      where user_id = ${targetId}
    `;
    await db`
      update player_saves set
        drvo = drvo + ${stolen.drvo},
        kamen = kamen + ${stolen.kamen},
        zeljezo = zeljezo + ${stolen.zeljezo},
        updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const, blocked: false as const, stolen };
  });

export const createClan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((naziv: string) => naziv.trim())
  .handler(async ({ context, data: naziv }) => {
    if (naziv.length < 2) throw new Error("Ime klana je prekratko");
    const db = await sql();
    const zadaci = JSON.stringify(generirajKlanZadatke());
    let inserted: { id: number }[] = [];
    try {
      inserted = await db<{ id: number }>`
        insert into clans (naziv, owner_id, razina, xp, zadaci, zadnji_refresh)
        values (${naziv.slice(0, 24)}, ${context.userId}, 1, 0, ${zadaci}::jsonb, now())
        returning id
      `;
    } catch {
      throw new Error("Klan već postoji");
    }
    const id = inserted[0]?.id;
    if (!id) throw new Error("Klan nije stvoren");
    await db`
      insert into player_saves (user_id, clan_id, ime_igraca)
      values (${context.userId}, ${id}, 'Igrač')
      on conflict (user_id) do update set clan_id = excluded.clan_id
    `;
    return {
      naziv,
      razina: 1,
      xp: 0,
      zadaci: generirajKlanZadatke(),
      zadnjiRefresh: new Date().toISOString(),
    } satisfies Klan;
  });

export const joinClan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((naziv: string) => naziv.trim())
  .handler(async ({ context, data: naziv }) => {
    const db = await sql();
    const rows = await db<{
      id: number;
      naziv: string;
      razina: number;
      xp: number;
      zadaci: KlanZadatak[] | string;
      zadnji_refresh: string | null;
    }>`select id, naziv, razina, xp, zadaci, zadnji_refresh from clans where lower(naziv) = lower(${naziv})`;
    const c = rows[0];
    if (!c) throw new Error("Klan nije pronađen");
    await db`
      insert into player_saves (user_id, clan_id, ime_igraca)
      values (${context.userId}, ${c.id}, 'Igrač')
      on conflict (user_id) do update set clan_id = excluded.clan_id
    `;
    const zadaci = typeof c.zadaci === "string" ? JSON.parse(c.zadaci) : c.zadaci;
    return {
      naziv: c.naziv,
      razina: asNum(c.razina, 1),
      xp: asNum(c.xp),
      zadaci,
      zadnjiRefresh: c.zadnji_refresh,
    } satisfies Klan;
  });

export const donateClan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((iznos: number) => Math.floor(iznos))
  .handler(async ({ context, data: iznos }) => {
    if (iznos < 1) throw new Error("Iznos");
    const db = await sql();
    const me = await db<{ clan_id: number | null; zlato: number }>`
      select clan_id, zlato from player_saves where user_id = ${context.userId}
    `;
    const row = me[0];
    if (!row?.clan_id) throw new Error("Nemaš klan");
    if (asNum(row.zlato) < iznos) throw new Error("Nedovoljno zlata");
    const xpGain = Math.floor(iznos / 10);
    await db`update player_saves set zlato = zlato - ${iznos} where user_id = ${context.userId}`;
    const clans = await db<{ razina: number; xp: number; zadaci: KlanZadatak[] | string; naziv: string }>`
      select naziv, razina, xp, zadaci from clans where id = ${row.clan_id}
    `;
    const c = clans[0]!;
    let zadaci: KlanZadatak[] =
      typeof c.zadaci === "string" ? JSON.parse(c.zadaci) : c.zadaci;
    zadaci = zadaci
      .map((z) =>
        z.tip === "donacija" && !z.zavrseno
          ? { ...z, trenutno: Math.min(z.cilj, z.trenutno + iznos) }
          : z,
      )
      .map((z) => (!z.zavrseno && z.trenutno >= z.cilj ? { ...z, zavrseno: true } : z));
    const noviXp = asNum(c.xp) + xpGain;
    const xpZa = asNum(c.razina, 1) * 1000;
    const novaRazina = noviXp >= xpZa ? asNum(c.razina) + 1 : asNum(c.razina);
    const xpLeft = noviXp >= xpZa ? 0 : noviXp;
    await db`
      update clans set xp = ${xpLeft}, razina = ${novaRazina}, zadaci = ${JSON.stringify(zadaci)}::jsonb
      where id = ${row.clan_id}
    `;
    return {
      naziv: c.naziv,
      razina: novaRazina,
      xp: xpLeft,
      zadaci,
      zadnjiRefresh: null,
      zlato: asNum(row.zlato) - iznos,
    };
  });

async function clanIdByName(db: Awaited<ReturnType<typeof sql>>, naziv: string | null) {
  if (!naziv) return null;
  const rows = await db<{ id: number }>`select id from clans where naziv = ${naziv} limit 1`;
  return rows[0]?.id ?? null;
}

async function loadClanForPlayer(
  db: Awaited<ReturnType<typeof sql>>,
  clanId: number | null,
  fallback: Klan | undefined,
): Promise<Klan> {
  if (!clanId) {
    return fallback ?? { naziv: null, razina: 0, xp: 0, zadaci: [], zadnjiRefresh: null };
  }
  const rows = await db<{
    naziv: string;
    razina: number;
    xp: number;
    zadaci: KlanZadatak[] | string;
    zadnji_refresh: string | null;
  }>`select naziv, razina, xp, zadaci, zadnji_refresh from clans where id = ${clanId}`;
  const c = rows[0];
  if (!c) return fallback ?? { naziv: null, razina: 0, xp: 0, zadaci: [], zadnjiRefresh: null };
  return {
    naziv: c.naziv,
    razina: asNum(c.razina, 1),
    xp: asNum(c.xp),
    zadaci: typeof c.zadaci === "string" ? JSON.parse(c.zadaci) : c.zadaci,
    zadnjiRefresh: c.zadnji_refresh,
  };
}
