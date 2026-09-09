import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  dohvatiLokalneMete,
  hrpeIzResursa,
  izracunajPlijen,
  jeLegalniPotez,
  jeNpcUid,
  jeTerminal,
  jeUtvrdjeno,
  npcPotez,
  plijenUkupno,
  potezIzDelte,
  primijeniPotez,
  tkoIdePrvi,
  type Hrpe,
  type NimPotez,
  type Plijen,
} from "@/lib/game/raids";
import { attackPlayer, listRaidTargets } from "@/lib/game/cloud";
import { useGameStore } from "@/lib/stores/gameStore";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { DebriefStav, RaidMeta } from "@/lib/game/types";
import { gmUvod, recapOpsade, STAVOVI } from "@/lib/game/kronika";
import { playSfx } from "@/lib/game/audio";
import { delay, formatNum } from "@/lib/game/helpers";
import { ART, SYMBOL_ART } from "@/lib/game/art";
import { flash, hitstop, shake } from "@/lib/context/UIContext";
import { useLive } from "@/lib/multiplayer";
import { susjedPoUid, serifKaoLik } from "@/lib/game/susjedi";
import { LikAvatar } from "./LikAvatar";
import { KonjSilueta } from "./KonjSilueta";
import { cn } from "@/lib/utils";

type Faza = "lista" | "jahanje" | "ceka" | "opsada" | "pobjeda" | "poraz" | "blokirano" | "prazno" | "greska";

const HRPA_ART = [SYMBOL_ART.wood, SYMBOL_ART.stone, SYMBOL_ART.iron] as const;
const HRPA_IME = ["Drvo", "Kamen", "Željezo"] as const;

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

function npcDelayMs() {
  if (typeof window === "undefined") return 80;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 520;
}

export function RaidModal({
  vidljiv,
  onZatvori,
}: {
  vidljiv: boolean;
  onZatvori: () => void;
}) {
  const [mete, setMete] = useState<RaidMeta[]>([]);
  const [ucitava, setUcitava] = useState(false);
  const [faza, setFaza] = useState<Faza>("lista");
  const [meta, setMeta] = useState<RaidMeta | null>(null);
  const [hrpe, setHrpe] = useState<Hrpe>([0, 0, 0]);
  const [naPotezu, setNaPotezu] = useState<"igrac" | "npc">("igrac");
  const [npcHint, setNpcHint] = useState<NimPotez | null>(null);
  const [plijen, setPlijen] = useState<Plijen | null>(null);
  const [poruka, setPoruka] = useState("");
  const [utvrdjenoStart, setUtvrdjenoStart] = useState(false);
  const [liveDvoboj, setLiveDvoboj] = useState(false);
  const [leaving, setLeaving] = useState<NimPotez | null>(null);
  const primiResurse = useGameStore((s) => s.primiResurse);
  const zapisiDebrief = useGameStore((s) => s.zapisiDebrief);
  const igracRazina = useGameStore((s) => s.igracRazina);
  const user = useCurrentUser();
  const userId = user?.id ?? null;
  const live = useLive();
  const jahanje = useGameStore((s) => s.konjiDuznost.jahanje);
  const radKonja = useGameStore((s) => s.konjiDuznost.rad);
  const cowboyKey = live.cowboys.filter((c) => c.connected).map((c) => c.id).join("|");
  const lock = useRef(false);
  const dead = useRef(false);
  const turnLock = useRef(false);
  const hrpeRef = useRef<Hrpe>([0, 0, 0]);
  hrpeRef.current = hrpe;
  const krajRef = useRef<string | null>(null);

  useEffect(() => {
    if (!vidljiv) {
      lock.current = false;
      turnLock.current = false;
      dead.current = true;
      return;
    }
    dead.current = false;
    lock.current = false;
    turnLock.current = false;
    krajRef.current = null;
    setFaza("lista");
    setMeta(null);
    setPlijen(null);
    setPoruka("");
    setNpcHint(null);
    setNaPotezu("igrac");
    setLiveDvoboj(false);
    setLeaving(null);
    setUcitava(true);
    let cancelled = false;
    (async () => {
      if (userId) {
        try {
          const cloudMete = await withTimeout(listRaidTargets(), 2500);
          if (!cancelled && cloudMete.length) {
            setMete(cloudMete);
            setUcitava(false);
            return;
          }
        } catch {
          /* NPC fallback */
        }
      }
      if (!cancelled) {
        const uzivo: RaidMeta[] = live.cowboys
          .filter((c) => c.connected)
          .slice(0, 4)
          .map((c) => ({
            uid: c.id,
            imeIgraca: c.ime,
            igracRazina: c.razina,
            resursi: { drvo: c.drvo, kamen: c.kamen, zeljezo: c.zeljezo },
            uzivo: true,
          }));
        const npc = dohvatiLokalneMete(Math.max(1, 5 - uzivo.length), igracRazina);
        setMete([...uzivo, ...npc]);
        setUcitava(false);
      }
    })();
    return () => {
      cancelled = true;
      dead.current = true;
    };
  }, [vidljiv, userId, igracRazina]);

  useEffect(() => {
    if (!vidljiv || faza !== "lista") return;
    const uzivo: RaidMeta[] = live.cowboys
      .filter((c) => c.connected)
      .slice(0, 4)
      .map((c) => ({
        uid: c.id,
        imeIgraca: c.ime,
        igracRazina: c.razina,
        resursi: { drvo: c.drvo, kamen: c.kamen, zeljezo: c.zeljezo },
        uzivo: true,
      }));
    if (uzivo.length === 0) return;
    setMete((prev) => {
      const npc = prev.filter((m) => !m.uzivo);
      const ids = uzivo.map((u) => u.uid).join("|");
      const old = prev
        .filter((m) => m.uzivo)
        .map((m) => m.uid)
        .join("|");
      if (ids === old) return prev;
      return [...uzivo, ...npc].slice(0, 6);
    });
  }, [vidljiv, faza, cowboyKey, live.cowboys]);

  useEffect(() => {
    if (!vidljiv) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") e.preventDefault();
      if (e.key !== "Escape") return;
      if (naPotezu === "npc" && faza === "opsada" && !liveDvoboj) return;
      if (faza === "ceka") live.odbijPohod();
      else if (liveDvoboj && (faza === "opsada" || faza === "jahanje")) live.bjeziPohod();
      onZatvori();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [vidljiv, onZatvori, naPotezu, faza, liveDvoboj, live]);

  useEffect(() => {
    const p = live.pohod;
    if (!p || !vidljiv) return;

    const metaOd = (): RaidMeta => ({
      uid: p.peerId,
      imeIgraca: p.ime,
      igracRazina: 1,
      resursi: p.ostava ?? { drvo: p.hrpe[0] * 48, kamen: p.hrpe[1] * 48, zeljezo: p.hrpe[2] * 48 },
      uzivo: true,
    });

    if (p.faza === "ceka" && p.uloga === "napadac") {
      setLiveDvoboj(true);
      setHrpe(p.hrpe);
      setMeta(metaOd());
      setFaza((f) => (f === "jahanje" ? f : "ceka"));
      return;
    }

    if (p.faza === "serif") {
      setLiveDvoboj(false);
      setHrpe(p.hrpe);
      setMeta((m) => m ?? metaOd());
      setNaPotezu("igrac");
      turnLock.current = false;
      setFaza("opsada");
      return;
    }

    if (p.faza === "igra") {
      setLiveDvoboj(true);
      setMeta((m) => m ?? metaOd());
      const delta = potezIzDelte(hrpeRef.current, p.hrpe);
      const sync = () => {
        setHrpe(p.hrpe);
        setNaPotezu(p.naPotezu ? "igrac" : "npc");
        if (p.naPotezu) turnLock.current = false;
        setFaza("opsada");
        setLeaving(null);
      };
      if (delta && p.naPotezu) {
        setLeaving(delta);
        setNaPotezu("npc");
        const t = window.setTimeout(() => {
          if (dead.current) return;
          playSfx("attack");
          hitstop(40);
          shake("soft");
          sync();
        }, npcDelayMs() > 100 ? 280 : 80);
        return () => window.clearTimeout(t);
      }
      sync();
      return;
    }

    if (p.faza === "kraj") {
      setHrpe(p.hrpe);
      setLiveDvoboj(true);
      if (krajRef.current === p.id) return;
      krajRef.current = p.id;
      if (p.pobjeda) {
        if (p.uloga === "napadac") {
          setPlijen((prev) => prev ?? izracunajPlijen(p.ostava, 1, radKonja));
        }
        playSfx("collect");
        flash("rgba(198, 224, 90, 0.4)");
        setFaza("pobjeda");
      } else {
        playSfx("skull");
        flash("rgba(232, 93, 93, 0.45)");
        shake("hard");
        setFaza("poraz");
      }
    }
  }, [live.pohod, vidljiv, radKonja]);

  const zatvori = () => {
    if (naPotezu === "npc" && faza === "opsada" && !liveDvoboj) return;
    if (faza === "ceka") live.odbijPohod();
    else if (liveDvoboj && (faza === "opsada" || faza === "jahanje")) live.bjeziPohod();
    onZatvori();
  };

  const kreniOpsadu = (m: RaidMeta) => {
    if (lock.current || (faza !== "lista" && faza !== "jahanje")) return;
    const h = hrpeIzResursa(m.resursi);
    if (jeTerminal(h)) {
      playSfx("attack");
      setMeta(m);
      setFaza("prazno");
      return;
    }
    playSfx("attack");
    shake("soft");
    setMeta(m);
    setHrpe(h);
    setNpcHint(null);
    setUtvrdjenoStart(jeUtvrdjeno(h));
    turnLock.current = false;
    setLiveDvoboj(false);

    if (m.uzivo && live.joined) {
      live.pozoviPohod(m.uid, m.imeIgraca, h);
      setLiveDvoboj(true);
      if (jahanje > 0) {
        setFaza("jahanje");
        window.setTimeout(() => {
          if (dead.current) return;
          setFaza((f) => (f === "jahanje" ? "ceka" : f));
        }, 1800);
        return;
      }
      setFaza("ceka");
      return;
    }

    const ophodnja = m.uzivo ? (live.cowboys.find((c) => c.id === m.uid)?.ophodnja ?? 0) : jeUtvrdjeno(h) ? 1 : 0;
    const prvi = tkoIdePrvi(jahanje, ophodnja);
    const kreni = () => {
      if (prvi === "npc") {
        setNaPotezu("npc");
        const odgovor = npcPotez(h);
        if (odgovor) {
          setNpcHint(odgovor);
          window.setTimeout(() => {
            if (dead.current) return;
            playSfx("button");
            const nakon = primijeniPotez(h, odgovor);
            setHrpe(nakon);
            setNpcHint(null);
            setNaPotezu("igrac");
          }, npcDelayMs());
        } else {
          setNaPotezu("igrac");
        }
      } else {
        setNaPotezu("igrac");
      }
      setFaza("opsada");
    };

    if (jahanje > 0) {
      setFaza("jahanje");
      window.setTimeout(() => {
        if (dead.current) return;
        kreni();
      }, 1800);
      return;
    }
    kreni();
  };

  const zavrsiPobjedu = async (m: RaidMeta) => {
    if (lock.current) return;
    lock.current = true;
    try {
      if (m.uzivo) {
        const loot = izracunajPlijen(m.resursi, m.igracRazina, radKonja);
        if (plijenUkupno(loot) > 0) primiResurse(loot);
        playSfx("collect");
        flash("rgba(198, 224, 90, 0.4)");
        setPlijen(loot);
        setFaza("pobjeda");
        lock.current = false;
        return;
      }
      if (userId && !jeNpcUid(m.uid)) {
        const res = await withTimeout(attackPlayer({ data: m.uid }), 4000);
        if (!res.ok) {
          playSfx("attack");
          setPoruka(
            res.reason === "missing"
              ? "Meta je nestala iz dosega."
              : "Pohod nije uspio. Pokušaj susjedni tabor.",
          );
          setFaza("greska");
          lock.current = false;
          return;
        }
        if (res.blocked) {
          playSfx("attack");
          setFaza("blokirano");
          lock.current = false;
          return;
        }
        const stolen = res.stolen ?? { drvo: 0, kamen: 0, zeljezo: 0 };
        const loot: Plijen = {
          drvo: stolen.drvo,
          kamen: stolen.kamen,
          zeljezo: stolen.zeljezo,
          zlato: izracunajPlijen(stolen, m.igracRazina).zlato,
        };
        if (plijenUkupno(loot) <= 0) {
          playSfx("attack");
          setFaza("prazno");
          lock.current = false;
          return;
        }
        primiResurse(loot);
        playSfx("collect");
        flash("rgba(198, 224, 90, 0.4)");
        setPlijen(loot);
        setFaza("pobjeda");
        return;
      }

      const loot = izracunajPlijen(m.resursi, m.igracRazina, radKonja);
      if (plijenUkupno(loot) <= 0) {
        playSfx("attack");
        setFaza("prazno");
        lock.current = false;
        return;
      }
      primiResurse(loot);
      playSfx("collect");
      flash("rgba(198, 224, 90, 0.4)");
      setPlijen(loot);
      setFaza("pobjeda");
    } catch {
      playSfx("attack");
      setPoruka("Veza je pala. Pohodi susjedni tabor.");
      setFaza("greska");
      lock.current = false;
    }
  };

  const odigraj = async (potez: NimPotez) => {
    if (faza !== "opsada" || naPotezu !== "igrac" || !meta) return;
    if (turnLock.current || !jeLegalniPotez(hrpe, potez)) return;
    turnLock.current = true;
    playSfx("attack");
    hitstop(50);
    shake("soft");
    setLeaving(potez);
    await delay(npcDelayMs() > 100 ? 280 : 80);
    if (dead.current) return;
    setLeaving(null);

    if (liveDvoboj) {
      const nakon = primijeniPotez(hrpe, potez);
      setHrpe(nakon);
      live.igrajPotez(potez);
      if (jeTerminal(nakon)) {
        hitstop(90);
        return;
      }
      setNaPotezu("npc");
      return;
    }

    const nakonIgraca = primijeniPotez(hrpe, potez);
    setHrpe(nakonIgraca);
    if (jeTerminal(nakonIgraca)) {
      hitstop(90);
      shake("hard");
      await zavrsiPobjedu(meta);
      return;
    }
    setNaPotezu("npc");
    const odgovor = npcPotez(nakonIgraca);
    if (!odgovor) {
      await zavrsiPobjedu(meta);
      return;
    }
    setNpcHint(odgovor);
    await delay(npcDelayMs());
    if (dead.current) return;
    playSfx("button");
    setLeaving(odgovor);
    await delay(npcDelayMs() > 100 ? 240 : 60);
    if (dead.current) return;
    const nakonNpc = primijeniPotez(nakonIgraca, odgovor);
    setHrpe(nakonNpc);
    setNpcHint(null);
    setLeaving(null);
    if (jeTerminal(nakonNpc)) {
      playSfx("skull");
      flash("rgba(232, 93, 93, 0.45)");
      shake("hard");
      setFaza("poraz");
      return;
    }
    setNaPotezu("igrac");
    turnLock.current = false;
  };

  const zavrsiScenu = (stav: DebriefStav) => {
    if (!meta) return;
    const pobjeda = faza === "pobjeda";
    zapisiDebrief({
      metaIme: meta.imeIgraca,
      pobjeda,
      stav,
      recap: recapOpsade(meta.imeIgraca, pobjeda, utvrdjenoStart),
    });
    playSfx(pobjeda ? "collect" : "button");
    onZatvori();
  };

  if (!vidljiv || typeof document === "undefined") return null;

  const naslov =
    faza === "pobjeda" || faza === "poraz"
      ? "Kako to čitaš"
      : faza === "opsada"
        ? "Dvoboj"
        : faza === "jahanje"
          ? "Jašeš"
          : faza === "ceka"
            ? "Čekam"
            : "Odaberi tabor";

  return createPortal(
    <div
      className="modal-pozadina fixed inset-0 z-[90] flex items-center justify-center bg-void/85 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raid-title"
    >
      <div className="modal-ulaz flex max-h-[min(40rem,90dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ruby/50 bg-panel shadow-[0_18px_50px_rgb(0_0_0_/_0.55)]">
        <div
          className="relative h-16 shrink-0 overflow-hidden sm:h-20"
          style={{
            backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--color-void) 15%, transparent), color-mix(in oklab, var(--color-void) 92%, #0e2a28)), url(${ART.raid})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <div className="flex items-center gap-2.5 px-4 pt-3">
          <img src={SYMBOL_ART.skull} alt="" className="village-pixel size-7" draggable={false} />
          <h2 id="raid-title" className="flex-1 text-base font-bold tracking-widest text-ruby uppercase">
            {naslov}
          </h2>
          <button
            type="button"
            onClick={zatvori}
            disabled={naPotezu === "npc" && faza === "opsada" && !liveDvoboj}
            className="flex size-11 items-center justify-center rounded-lg text-lg text-dim disabled:opacity-40"
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>

        {faza === "pobjeda" && (
          <DebriefIzlaz
            ime={meta?.imeIgraca ?? ""}
            rec={meta ? susjedPoUid(meta.uid)?.recPobjeda : undefined}
            pobjeda
            utvrdjeno={utvrdjenoStart}
            plijen={plijen}
            onIzbor={zavrsiScenu}
          />
        )}

        {faza === "poraz" && (
          <DebriefIzlaz
            ime={meta?.imeIgraca ?? ""}
            rec={meta ? susjedPoUid(meta.uid)?.recPoraz : undefined}
            pobjeda={false}
            utvrdjeno={utvrdjenoStart}
            plijen={null}
            onIzbor={zavrsiScenu}
          />
        )}

        {(faza === "blokirano" || faza === "prazno" || faza === "greska") && (
          <div className="px-5 pb-5 pt-2">
            <div
              className={cn(
                "mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold",
                faza === "blokirano" && "border-ice/50 bg-ice/10 text-ice",
                (faza === "prazno" || faza === "greska") && "border-line bg-panel-2 text-dim",
              )}
            >
              {faza === "blokirano" && (
                <>
                  <img
                    src={SYMBOL_ART.shield}
                    alt=""
                    className="village-pixel size-4 shrink-0"
                    draggable={false}
                  />
                  {meta?.imeIgraca} je pod štitom. Napad odbijen.
                </>
              )}
              {faza === "prazno" && <span>{meta?.imeIgraca}: ostava je prazna.</span>}
              {faza === "greska" && <span>{poruka}</span>}
            </div>
            <button
              type="button"
              onClick={() => {
                lock.current = false;
                turnLock.current = false;
                setFaza("lista");
                setMeta(null);
              }}
              className="min-h-12 w-full rounded-xl bg-ruby py-3 text-sm font-bold tracking-widest text-ink"
            >
              DRUGA META
            </button>
          </div>
        )}

        {faza === "jahanje" && meta && (
          <div className="pohod-jahanje px-0 pb-6 pt-0">
            <div className="pohod-jahanje-platno">
              <img src={ART.pohodJahanje} alt="" className="pohod-jahanje-art" draggable={false} />
              <span className="pohod-jahanje-veil" aria-hidden />
              <span className="pohod-mjesec" aria-hidden />
              <span className="pohod-tabor-svjetlo" aria-hidden />
              <div className="pohod-konji-trka" aria-hidden>
                <span className="pohod-konj pohod-konj-a">
                  <KonjSilueta boja="#1a100c" />
                </span>
                <span className="pohod-konj pohod-konj-b">
                  <KonjSilueta boja="#c4783a" />
                </span>
              </div>
              <div className="pohod-prasina" aria-hidden />
              <div className="pohod-kopita" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <p className="mt-3 text-center text-sm font-bold text-ink">Jašeš na {meta.kauba ?? meta.imeIgraca}.</p>
            <p className="mt-1 text-center text-xs font-bold text-dim">Prašina. Sedlo. Ostava čeka.</p>
          </div>
        )}

        {faza === "ceka" && meta && (
          <div className="px-5 pb-6 pt-2">
            <p className="text-center text-sm font-bold text-ink">{meta.imeIgraca} čuje kopita.</p>
            <p className="mt-1 text-center text-xs font-bold text-dim">Stane na ulicu ili pušta šerifa.</p>
            <div className="pohod-ceka-tacke mt-4 flex justify-center gap-1.5" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <button
              type="button"
              onClick={zatvori}
              className="mt-4 min-h-11 w-full rounded-xl border border-line bg-panel-2 text-xs font-bold tracking-widest text-dim uppercase"
            >
              Bježi
            </button>
          </div>
        )}

        {faza === "opsada" && meta && (
          <OpsadaPloca
            ime={meta.imeIgraca}
            rec={susjedPoUid(meta.uid)?.recPohod}
            hrpe={hrpe}
            naPotezu={naPotezu}
            npcHint={npcHint}
            leaving={leaving}
            utvrdjenoNaStartu={utvrdjenoStart}
            uzivo={!!meta.uzivo || liveDvoboj}
            onPotez={(p) => void odigraj(p)}
            onBjezi={liveDvoboj ? zatvori : undefined}
          />
        )}

        {faza === "lista" && (
          <>
            <p className="px-4 pb-3 text-xs leading-relaxed text-dim">
              Noć. Tri hrpe. Tko uzme zadnji žeton, nosi blago. Jahanje ide prvo. Ophodnja čeka na ulici.
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {ucitava && (
                <p className="py-8 text-center text-xs font-bold tracking-widest text-dim uppercase">
                  Tražim protivnike…
                </p>
              )}
              {!ucitava && mete.length === 0 && (
                <p className="py-8 text-center text-xs font-bold tracking-widest text-dim uppercase">
                  Nema kauboja u sobi
                </p>
              )}
              <div className="flex flex-col gap-2">
                {mete.map((item) => {
                  const h = hrpeIzResursa(item.resursi);
                  const loot = izracunajPlijen(item.resursi, item.igracRazina, radKonja);
                  const utvrda = jeUtvrdjeno(h);
                  const susjed = susjedPoUid(item.uid);
                  const lik = susjed ? serifKaoLik(susjed) : null;
                  const peer = item.uzivo ? live.cowboys.find((c) => c.id === item.uid) : null;
                  const ophodnja = item.uzivo ? (peer?.ophodnja ?? 0) : utvrda ? 1 : 0;
                  const prvi = tkoIdePrvi(jahanje, ophodnja);
                  return (
                    <div
                      key={item.uid}
                      className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-3.5 py-3"
                    >
                      {lik && (
                        <span className="kauba-chip-avatar shrink-0">
                          <LikAvatar p={lik} mood={utvrda ? "nered" : "mir"} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {item.kauba ?? item.imeIgraca}
                          {item.uzivo ? (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-volt/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-volt uppercase">
                              uživo
                            </span>
                          ) : (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold uppercase">
                              susjed
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-dim">
                          {item.serif ? `Šerif ${item.serif}` : `Lv ${item.igracRazina}`}
                        </p>
                        <HrpeMini hrpe={h} />
                        <span
                          className={cn(
                            "mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold tracking-wide uppercase",
                            utvrda ? "bg-ice/15 text-ice" : "bg-ruby/15 text-ruby",
                          )}
                        >
                          <img
                            src={utvrda ? SYMBOL_ART.shield : SYMBOL_ART.skull}
                            alt=""
                            className="village-pixel size-3.5"
                            draggable={false}
                          />
                          {utvrda ? "Utvrđeno" : "Ranjivo"}
                        </span>
                        {prvi === "igrac" && jahanje > 0 && (
                          <span className="ml-1 inline-flex rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gold uppercase">
                            Jašeš prvi
                          </span>
                        )}
                        {prvi === "npc" && (
                          <span className="ml-1 inline-flex rounded-md bg-ice/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ice uppercase">
                            Ophodnja
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-xs font-semibold text-stone">
                          Plijen ~{plijenUkupno(loot)}
                        </span>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            kreniOpsadu(item);
                          }}
                          className="inline-flex min-h-11 min-w-[6.2rem] items-center justify-center gap-1 rounded-lg bg-ruby px-3 text-xs font-bold tracking-wide text-ink"
                        >
                          <img
                            src={SYMBOL_ART.skull}
                            alt=""
                            className="village-pixel size-4"
                            draggable={false}
                          />
                          POHOD
                        </button>
                        {!item.uzivo && live.cowboys.some((c) => c.connected) && (
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const partner = live.cowboys.find((c) => c.connected);
                              if (!partner) return;
                              playSfx("attack");
                              live.pozoviTrojac(
                                partner.id,
                                partner.ime,
                                {
                                  uid: item.uid,
                                  ime: item.kauba ?? item.imeIgraca,
                                  serif: item.serif ?? "Šerif",
                                  rec: item.rec ?? "",
                                },
                                item.resursi,
                              );
                              onZatvori();
                            }}
                            className="inline-flex min-h-9 min-w-[6.2rem] items-center justify-center rounded-lg border border-gold/50 bg-gold/15 px-3 text-[10px] font-bold tracking-wide text-gold uppercase"
                          >
                            Jato
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function DebriefIzlaz({
  ime,
  rec,
  pobjeda,
  utvrdjeno,
  plijen,
  onIzbor,
}: {
  ime: string;
  rec?: string;
  pobjeda: boolean;
  utvrdjeno: boolean;
  plijen: Plijen | null;
  onIzbor: (stav: DebriefStav) => void;
}) {
  const recap = rec ?? recapOpsade(ime, pobjeda, utvrdjeno);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-2">
      <p className="mb-3 text-sm leading-relaxed text-ink">{recap}</p>
      {pobjeda && plijen && (
        <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
          {(
            [
              ["zlato", SYMBOL_ART.gold],
              ["drvo", SYMBOL_ART.wood],
              ["kamen", SYMBOL_ART.stone],
              ["zeljezo", SYMBOL_ART.iron],
            ] as const
          )
            .filter(([k]) => (plijen[k] ?? 0) > 0)
            .map(([k, src]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-ink"
              >
                <img src={src} alt="" className="village-pixel size-8" draggable={false} />
                {formatNum(plijen[k] ?? 0)}
              </span>
            ))}
        </div>
      )}
      {pobjeda && !plijen && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3">
          <img src={SYMBOL_ART.gold} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
          <p className="text-xs leading-relaxed text-gold">Ostava stoji. Nisi uzeo ni vreću — ali si ostao na nogama.</p>
        </div>
      )}
      {!pobjeda && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-ice/40 bg-ice/10 p-3">
          <img src={SYMBOL_ART.shield} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
          <p className="text-xs leading-relaxed text-ice">Plijen ostaje u njihovoj ostavi.</p>
        </div>
      )}
      <p className="mb-2 text-xs font-bold tracking-widest text-dim uppercase">Kako to čitaš?</p>
      <div className="flex flex-col gap-2">
        {STAVOVI.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onIzbor(s.id)}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left",
              pobjeda ? "border-gold/40 bg-panel-2" : "border-line bg-panel-2",
            )}
          >
            <img src={SYMBOL_ART[s.art]} alt="" className="village-pixel size-8 shrink-0" draggable={false} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">{s.naziv}</span>
              <span className="block text-xs text-dim">{s.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HrpeMini({ hrpe }: { hrpe: Hrpe }) {
  return (
    <span className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs font-bold text-ink">
      {HRPA_ART.map((src, i) => (
        <span key={src} className="inline-flex items-center gap-0.5">
          <img src={src} alt="" className="village-pixel size-3.5" draggable={false} />
          {hrpe[i]}
        </span>
      ))}
    </span>
  );
}

function OpsadaPloca({
  ime,
  rec,
  hrpe,
  naPotezu,
  npcHint,
  leaving,
  utvrdjenoNaStartu,
  uzivo,
  onPotez,
  onBjezi,
}: {
  ime: string;
  rec?: string;
  hrpe: Hrpe;
  naPotezu: "igrac" | "npc";
  npcHint: NimPotez | null;
  leaving: NimPotez | null;
  utvrdjenoNaStartu: boolean;
  uzivo?: boolean;
  onPotez: (p: NimPotez) => void;
  onBjezi?: () => void;
}) {
  const [hover, setHover] = useState<{ hrpa: number; skini: number } | null>(null);
  const igrac = naPotezu === "igrac";
  const zbroj = hrpe[0] + hrpe[1] + hrpe[2];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-1">
      <div className="pohod-duel mb-2 flex items-center justify-between gap-2 rounded-xl border border-line bg-void/50 px-2.5 py-1.5">
        <p className="text-[11px] font-bold tracking-wide text-gold uppercase">Ti</p>
        <p className={cn("text-[11px] font-bold tracking-widest uppercase", igrac ? "text-gold pohod-potez-ti" : "text-ice")}>
          {igrac ? "Ti biraš hrpu" : uzivo ? `${ime} bira` : `${ime} se brani`}
        </p>
        <p className="text-[11px] font-bold tracking-wide text-ruby uppercase">{ime}</p>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-dim" aria-live="polite">
        {rec ?? gmUvod(ime, utvrdjenoNaStartu)}{" "}
        {igrac ? "Dodirni žeton — uzimaš njega i sve iznad." : "Čekaj. Prašina se slegne."}
      </p>
      <div className="relative overflow-hidden rounded-xl">
        <img src={ART.pohodOpsada} alt="" className="pohod-opsada-tlo" draggable={false} />
        <span className="pohod-prasina-ploca" aria-hidden />
        <div className="relative z-[1] grid grid-cols-3 gap-2 p-1">
        {HRPA_IME.map((label, hi) => {
          const n = hrpe[hi] ?? 0;
          return (
            <div key={label} className="flex flex-col rounded-xl border border-line bg-panel-2 p-2">
              <div className="mb-1 flex items-center justify-center gap-1">
                <img
                  src={HRPA_ART[hi]}
                  alt=""
                  className="village-pixel size-5"
                  draggable={false}
                />
                <span className="text-xs font-bold tracking-wide text-ink uppercase">{label}</span>
              </div>
              <div
                className="flex min-h-44 flex-col items-center justify-end gap-0.5"
                onPointerLeave={() => setHover(null)}
              >
                {n <= 0 && <span className="text-xs font-bold text-dim">prazno</span>}
                {Array.from({ length: n }, (_, fromTop) => {
                  const skini = fromTop + 1;
                  const uzimam =
                    (igrac && hover?.hrpa === hi && skini <= hover.skini) ||
                    (npcHint?.hrpa === hi && skini <= npcHint.skini);
                  const leti = leaving?.hrpa === hi && skini <= leaving.skini;
                  return (
                    <button
                      key={`${hi}-${fromTop}-${n}`}
                      type="button"
                      disabled={!igrac}
                      aria-label={`Uzmi ${skini} s hrpe ${label}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerEnter={() => {
                        if (igrac) setHover({ hrpa: hi, skini });
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!igrac) return;
                        onPotez({ hrpa: hi as 0 | 1 | 2, skini });
                        setHover(null);
                      }}
                      className={cn(
                        "nim-token flex size-11 items-center justify-center rounded-full",
                        uzimam && "nim-token-take",
                        npcHint?.hrpa === hi && skini <= (npcHint?.skini ?? 0) && "nim-token-npc",
                        leti && "nim-token-leti",
                        zbroj === 1 && n === 1 && "nim-token-zadnji",
                      )}
                    >
                      <img
                        src={HRPA_ART[hi]}
                        alt=""
                        className="village-pixel size-8"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-center text-xs font-bold tabular-nums text-dim">{n}</p>
            </div>
          );
        })}
        </div>
      </div>
      {onBjezi && (
        <button
          type="button"
          onClick={onBjezi}
          className="mt-3 min-h-11 w-full rounded-xl border border-line bg-panel-2 text-xs font-bold tracking-widest text-dim uppercase"
        >
          Bježi
        </button>
      )}
    </div>
  );
}
