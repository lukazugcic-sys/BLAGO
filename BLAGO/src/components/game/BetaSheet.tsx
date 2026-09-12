import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { APP_VERSION, APP_CHANNEL } from "@/lib/game/version";
import { CREDITS } from "@/lib/game/art";
import { SAVE_KEYS } from "@/lib/game/persist";
import { playSfx } from "@/lib/game/audio";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useEffect, useState } from "react";

const ALATI: Array<{
  id: "zlato" | "energija" | "dijamanti" | "resursi" | "stitovi" | "popravi";
  n: string;
}> = [
  { id: "zlato", n: "+5 000 zlata" },
  { id: "energija", n: "Puna energija" },
  { id: "dijamanti", n: "+50 dijamant" },
  { id: "resursi", n: "+drvo kamen željezo" },
  { id: "stitovi", n: "Puni štitovi" },
  { id: "popravi", n: "Popravi zgrade" },
];

type ApkMeta = { version: string; versionCode: number; bytes: number; builtAt: string };

function mb(n: number) {
  return `${Math.max(1, Math.round(n / 1_000_000))} MB`;
}

export function BetaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [potvrda, setPotvrda] = useState(false);
  const [autoRez, setAutoRez] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApkMeta | null>(null);
  const testAlat = useGameStore((s) => s.testAlat);
  const autoTest = useGameStore((s) => s.autoTest);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);

  useEffect(() => {
    if (!open) return;
    let ziv = true;
    fetch(`/apk-meta.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (ziv && d?.version) setMeta(d as ApkMeta);
      })
      .catch(() => {});
    return () => {
      ziv = false;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const paket = meta?.version ?? APP_VERSION;
  const tag = `${paket}-${meta?.versionCode ?? 0}`;
  const svjez = !meta || meta.version === APP_VERSION;

  const reset = () => {
    if (!potvrda) {
      setPotvrda(true);
      return;
    }
    for (const key of Object.values(SAVE_KEYS)) {
      window.localStorage.removeItem(key);
    }
    window.location.reload();
  };

  return createPortal(
    <div className="modal-pozadina fixed inset-0 z-[80] flex items-end justify-center bg-void/75 p-4 sm:items-center">
      <div className="modal-ulaz max-h-[min(32rem,82dvh)] w-full max-w-sm overflow-y-auto rounded-3xl border border-line bg-panel">
        <div className="p-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase">
            {APP_CHANNEL} {APP_VERSION}
          </p>
          <button
            type="button"
            onClick={() => {
              setPotvrda(false);
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-full border border-line text-dim"
            aria-label="Zatvori"
          >
            <X className="size-4" />
          </button>
        </div>
        <h2 className="font-display text-lg text-gold">BLAGO beta</h2>
        <p className="mt-1 text-xs font-bold leading-relaxed text-ink/75">
          {svjez ? `Najnoviji paket · ${paket}` : `Igra ${APP_VERSION} · paket se sprema`}
        </p>

        <h3 className="mt-3 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          Preuzmi
        </h3>
        <div className="mt-1.5 grid grid-cols-1 gap-1.5">
          <a
            href="/preuzmi"
            target="_blank"
            rel="noreferrer"
            onClick={() => playSfx("button")}
            className="flex min-h-10 items-center justify-center rounded-xl bg-gold px-2 text-[11px] font-bold tracking-widest text-void uppercase"
          >
            Preuzmi APK · {meta ? mb(meta.bytes) : "paket"}
          </a>
          <a
            href={`/BLAGO-android.zip?v=${tag}`}
            download="BLAGO-android.zip"
            target="_blank"
            rel="noreferrer"
            onClick={() => playSfx("button")}
            className="flex min-h-10 items-center justify-center rounded-xl border border-gold/50 bg-gold/15 px-2 text-[11px] font-bold tracking-widest text-gold uppercase"
          >
            APK u ZIP-u · {meta ? mb(meta.bytes) : "paket"}
          </a>
          <a
            href={`/BLAGO-github.zip?v=${tag}`}
            download="BLAGO-github.zip"
            target="_blank"
            rel="noreferrer"
            onClick={() => playSfx("button")}
            className="flex min-h-10 items-center justify-center rounded-xl border border-line bg-panel-2 px-2 text-[11px] font-bold tracking-widest text-ink uppercase"
          >
            Izvor za GitHub · {APP_VERSION}
          </a>
        </div>

        <h3 className="mt-3 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          Alati za testiranje
        </h3>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {ALATI.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                playSfx("button");
                testAlat(a.id);
              }}
              className="min-h-10 rounded-xl border border-line bg-panel-2 px-2 text-[11px] font-bold text-ink"
            >
              {a.n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              onClose();
              setRaidAktivan(true);
            }}
            className="min-h-10 rounded-xl border border-ruby/50 bg-ruby/15 px-2 text-[11px] font-bold text-ruby"
          >
            Pokreni pohod
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            const r = autoTest();
            setAutoRez(`${r.ok}/${r.ukupno}`);
          }}
          className="mt-1.5 min-h-10 w-full rounded-xl border border-gold/50 bg-gold/15 text-xs font-bold tracking-widest text-gold uppercase"
        >
          {autoRez ? `Auto-test ${autoRez}` : "Pokreni auto-test"}
        </button>

        <p className="mt-2 text-[10px] font-bold leading-relaxed tracking-wide text-dim">{CREDITS}</p>
        <button
          type="button"
          onClick={() => {
            playSfx("button");
            reset();
          }}
          className="mt-2 min-h-10 w-full rounded-full border border-ruby/50 bg-ruby/15 text-xs font-bold tracking-widest text-ruby uppercase"
        >
          {potvrda ? "Stvarno obriši spremanje" : "Obriši spremanje"}
        </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
