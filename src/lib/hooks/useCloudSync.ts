import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadCloudSave, pushCloudSave, deleteCloudSave, type CloudPayload } from "@/lib/game/cloud";
import { loadJSON, SAVE_KEYS } from "@/lib/game/persist";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { lokalniNoviJeAktivan, uredjajJeSvjez } from "@/lib/game/noviPocetak";
import { imeJePrazno } from "@/lib/game/ime";

function lokalniSavedAt() {
  const d = loadJSON<{ savedAt?: number }>(SAVE_KEYS.game);
  return typeof d?.savedAt === "number" && Number.isFinite(d.savedAt) ? d.savedAt : 0;
}

function snapshot(): CloudPayload {
  const s = useGameStore.getState();
  const slot = useSlotStore.getState();
  return {
    imeIgraca: s.imeIgraca,
    igracRazina: s.igracRazina,
    prestigeRazina: s.prestigeRazina,
    krunjenja: s.krunjenja,
    xp: s.xp,
    energija: s.energija,
    zlato: s.zlato,
    dijamanti: s.dijamanti,
    resursi: s.resursi,
    stitovi: s.stitovi,
    gradevine: s.gradevine,
    ostecenja: s.ostecenja,
    razine: s.razine,
    misije: s.misije,
    zadnjiNalozi: s.zadnjiNalozi,
    tecaj: s.tecaj,
    trend: s.trend,
    luckySpinCounter: s.luckySpinCounter,
    winStreak: s.winStreak,
    winStreakDo: s.winStreakDo,
    aktivniSkin: s.aktivniSkin,
    skinovi: s.skinovi,
    klan: s.klan,
    ukupnoVrtnji: s.ukupnoVrtnji,
    ukupnoZlata: s.ukupnoZlata,
    dostignucaDone: s.dostignucaDone,
    kronika: s.kronika,
    stavSela: s.stavSela,
    stanovnici: s.stanovnici,
    ljudi: s.ljudi,
    segrti: s.segrti,
    zamjenici: s.zamjenici,
    dogadaj: s.dogadaj,
    zadnjiDogadaj: s.zadnjiDogadaj,
    bankaZlato: s.bankaZlato,
    faroKrupije: s.faroKrupije,
    konjiBroj: s.konjiBroj,
    konjiDuznost: s.konjiDuznost,
    sijenoDo: s.sijenoDo,
    potkove: s.potkove,
    potkoveDo: s.potkoveDo,
    kisaDo: s.kisaDo,
    travaDo: s.travaDo,
    govedaBroj: s.govedaBroj,
    govedaDuznost: s.govedaDuznost,
    knjigaSkup: s.knjigaSkup,
    besplatneVrtnje: s.besplatneVrtnje,
    besplatneExpand: s.besplatneExpand,
    besplatneUlog: s.besplatneUlog,
    serifCin: s.serifCin,
    celijaBroj: s.celijaBroj,
    gradnje: s.gradnje,
    karavana: s.karavana,
    potjernice: s.potjernice,
    potjerniceSetovi: s.potjerniceSetovi,
    tjedanKljuc: s.tjedanKljuc,
    tjedanCeker: s.tjedanCeker,
    tjedanPohod: s.tjedanPohod,
    jutroDan: s.jutroDan,
    jutro: s.jutro,
    zadnjiResursTick: s.zadnjiResursTick,
    zadnjaEnergijaTick: s.zadnjaEnergijaTick,
    zadnjiMetakTick: s.zadnjiMetakTick,
    savedAt: Date.now(),
    dobitakNaCekanju: slot.dobitakNaCekanju,
    gambleCount: slot.gambleCount,
    slotSimboli: slot.simboli,
  };
}

type Ukradeno = { drvo: number; kamen: number; zeljezo: number };

function oduzmiUkradeno(stolen: Ukradeno | null | undefined) {
  if (!stolen) return;
  const drvo = Math.max(0, Math.floor(Number(stolen.drvo) || 0));
  const kamen = Math.max(0, Math.floor(Number(stolen.kamen) || 0));
  const zeljezo = Math.max(0, Math.floor(Number(stolen.zeljezo) || 0));
  if (drvo + kamen + zeljezo <= 0) return;
  useGameStore.setState((s) => ({
    resursi: {
      drvo: Math.max(0, s.resursi.drvo - drvo),
      kamen: Math.max(0, s.resursi.kamen - kamen),
      zeljezo: Math.max(0, s.resursi.zeljezo - zeljezo),
    },
  }));
  useGameStore.getState().setPoruka(`NAPAD NA BAZU: −${drvo} drvo · −${kamen} kamen · −${zeljezo} željezo`);
}

export function useCloudSync() {
  const { user, isPending } = useCurrentUserState();
  const ucitavam = useGameStore((s) => s.ucitavam);
  const ready = !isPending && !ucitavam && !!user;
  const synced = useRef(false);
  const leti = useRef(false);
  const zadnjiKljuc = useRef("");
  const userId = user?.id ?? null;

  useEffect(() => {
    synced.current = false;
  }, [userId]);

  useEffect(() => {
    if (!ready || !user || synced.current) return;
    if (lokalniNoviJeAktivan()) {
      void deleteCloudSave().catch(() => {});
      return;
    }
    if (uredjajJeSvjez()) return;
    const krenuoBezSavea = lokalniSavedAt() <= 0;
    let cancelled = false;
    const primijeni = (stolen: Ukradeno | null | undefined) => {
      if (!stolen) return;
      const kljuc = `${stolen.drvo}|${stolen.kamen}|${stolen.zeljezo}`;
      if (kljuc === "0|0|0" || kljuc === zadnjiKljuc.current) return;
      zadnjiKljuc.current = kljuc;
      window.setTimeout(() => {
        if (zadnjiKljuc.current === kljuc) zadnjiKljuc.current = "";
      }, 4000);
      oduzmiUkradeno(stolen);
    };
    const gurni = async (keepalive: boolean) => {
      if (leti.current || lokalniNoviJeAktivan() || uredjajJeSvjez()) return;
      leti.current = true;
      try {
        const res = await pushCloudSave({
          data: snapshot(),
          ...(keepalive
            ? {
                fetch: (input: RequestInfo | URL, init?: RequestInit) =>
                  fetch(input, { ...init, keepalive: true }),
              }
            : {}),
        });
        if (!cancelled) primijeni(res?.stolen);
      } catch {
        /* nema mreže */
      } finally {
        leti.current = false;
      }
    };
    (async () => {
      try {
        const cloud = await loadCloudSave();
        if (cancelled || lokalniNoviJeAktivan()) {
          if (lokalniNoviJeAktivan()) void deleteCloudSave().catch(() => {});
          return;
        }
        if (krenuoBezSavea || uredjajJeSvjez()) return;
        if (cloud) {
          const cloudAt = typeof cloud.savedAt === "number" && Number.isFinite(cloud.savedAt) ? cloud.savedAt : 0;
          const localAt = lokalniSavedAt();
          if (cloudAt >= localAt) {
            useGameStore.getState().primijeniCloudSave(cloud);
            if (cloud._raidNotice) {
              const s = cloud._raidNotice;
              zadnjiKljuc.current = `${s.drvo}|${s.kamen}|${s.zeljezo}`;
              useGameStore.getState().setPoruka(
                `NAPAD NA BAZU: −${s.drvo} drvo · −${s.kamen} kamen · −${s.zeljezo} željezo`,
              );
            }
          } else if (cloud._raidNotice) {
            primijeni(cloud._raidNotice);
          }
          useGameStore.getState().postaviUid(user.id);
          if (user.displayName && !imeJePrazno(user.displayName)) useGameStore.getState().postaviIme(user.displayName);
          if (cloudAt < localAt) await gurni(false);
        } else {
          useGameStore.getState().postaviUid(user.id);
          if (user.displayName && !imeJePrazno(user.displayName)) useGameStore.getState().postaviIme(user.displayName);
          await gurni(false);
        }
        synced.current = true;
      } catch {
        synced.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  useEffect(() => {
    if (!ready || lokalniNoviJeAktivan() || uredjajJeSvjez()) return;
    let t: number | null = null;
    const primijeni = (stolen: Ukradeno | null | undefined) => {
      if (!stolen) return;
      const kljuc = `${Math.floor(stolen.drvo)}|${Math.floor(stolen.kamen)}|${Math.floor(stolen.zeljezo)}`;
      if (kljuc === "0|0|0" || kljuc === zadnjiKljuc.current) return;
      zadnjiKljuc.current = kljuc;
      window.setTimeout(() => {
        if (zadnjiKljuc.current === kljuc) zadnjiKljuc.current = "";
      }, 4000);
      oduzmiUkradeno(stolen);
    };
    const gurni = (keepalive: boolean) => {
      if (!synced.current || lokalniNoviJeAktivan() || uredjajJeSvjez()) return;
      if (leti.current && !keepalive) return;
      leti.current = true;
      void pushCloudSave({
        data: snapshot(),
        ...(keepalive
          ? {
              fetch: (input: RequestInfo | URL, init?: RequestInit) =>
                fetch(input, { ...init, keepalive: true }),
            }
          : {}),
      })
        .then((res) => primijeni(res?.stolen))
        .catch(() => {})
        .finally(() => {
          leti.current = false;
        });
    };
    const flush = () => gurni(false);
    const unsub = useGameStore.subscribe(() => {
      if (!synced.current || lokalniNoviJeAktivan() || uredjajJeSvjez()) return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(flush, 2500);
    });
    const onHide = () => {
      if (document.visibilityState === "hidden") gurni(true);
    };
    const onPageHide = () => gurni(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      unsub();
      if (t) window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [ready]);
}