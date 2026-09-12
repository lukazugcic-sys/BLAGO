import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadCloudSave, pushCloudSave, type CloudPayload } from "@/lib/game/cloud";
import { useGameStore } from "@/lib/stores/gameStore";

function snapshot(): CloudPayload {
  const s = useGameStore.getState();
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
    kisaDo: s.kisaDo,
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
  };
}

export function useCloudSync() {
  const { user, isPending } = useCurrentUserState();
  const ucitavam = useGameStore((s) => s.ucitavam);
  const ready = !isPending && !ucitavam && !!user;
  const synced = useRef(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    synced.current = false;
  }, [userId]);

  useEffect(() => {
    if (!ready || !user || synced.current) return;
    let cancelled = false;
    (async () => {
      try {
        const cloud = await loadCloudSave();
        if (cancelled) return;
        if (cloud) {
          useGameStore.getState().primijeniCloudSave(cloud);
          useGameStore.getState().postaviUid(user.id);
          if (user.displayName) useGameStore.getState().postaviIme(user.displayName);
          if (cloud._raidNotice) {
            const s = cloud._raidNotice;
            useGameStore.getState().setPoruka(
              `NAPAD NA BAZU: −${s.drvo} drvo · −${s.kamen} kamen · −${s.zeljezo} željezo`,
            );
          }
        } else {
          useGameStore.getState().postaviUid(user.id);
          if (user.displayName) useGameStore.getState().postaviIme(user.displayName);
          await pushCloudSave({ data: snapshot() });
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
    if (!ready) return;
    let t: number | null = null;
    const flush = () => {
      if (!synced.current) return;
      void pushCloudSave({ data: snapshot() }).catch(() => {});
    };
    const unsub = useGameStore.subscribe(() => {
      if (!synced.current) return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(flush, 2500);
    });
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      unsub();
      if (t) window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [ready]);
}
