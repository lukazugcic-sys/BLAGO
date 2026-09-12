import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_VERSION } from "@/lib/game/version";
import { ART, CREDITS } from "@/lib/game/art";

export const Route = createFileRoute("/preuzmi")({
  ssr: false,
  component: Preuzmi,
});

type ApkMeta = { version: string; versionCode: number; bytes: number; builtAt: string };

function mb(n: number) {
  return `${Math.max(1, Math.round(n / 1_000_000))} MB`;
}

function Preuzmi() {
  const [meta, setMeta] = useState<ApkMeta | null>(null);
  useEffect(() => {
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
  }, []);

  const paket = meta?.version ?? APP_VERSION;
  const tag = `${paket}-${meta?.versionCode ?? 0}`;
  const velicina = meta ? mb(meta.bytes) : "paket";

  return (
    <main className="preuzmi-scena relative grid min-h-dvh place-items-center overflow-hidden bg-void px-5 text-ink">
      <img src={ART.splash} alt="" className="pointer-events-none absolute inset-0 size-full object-cover object-[center_28%] opacity-55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/20 via-void/55 to-void" />
      <div className="relative z-[1] w-full max-w-sm rounded-[1.6rem] border border-gold/45 bg-panel p-5 shadow-[0_0_0_4px_#2a140c,0_18px_40px_rgb(0_0_0_/_0.45)]">
        <p className="text-[10px] font-bold tracking-[0.32em] text-gold uppercase">kaubojski automat</p>
        <h1 className="wordmark mt-2 text-4xl tracking-[0.2em]">BLAGO</h1>
        <p className="mt-3 text-sm font-bold leading-relaxed text-ink/80">
          Beta {paket}. Stisni i spremi na telefon. Ako APK ne krene, uzmi ZIP.
        </p>
        <a
          href={`/BLAGO.apk?v=${tag}`}
          download="BLAGO.apk"
          className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.18em] text-void uppercase"
        >
          Preuzmi APK · {velicina}
        </a>
        <a
          href={`/BLAGO-android.zip?v=${tag}`}
          download="BLAGO-android.zip"
          className="mt-2 flex min-h-12 items-center justify-center rounded-full border border-gold/50 bg-gold/15 text-sm font-bold tracking-[0.14em] text-gold uppercase"
        >
          APK u ZIP-u · {velicina}
        </a>
        <a
          href={`/BLAGO-github.zip?v=${tag}`}
          download="BLAGO-github.zip"
          className="mt-2 flex min-h-12 items-center justify-center rounded-full border border-line bg-panel-2 text-sm font-bold tracking-[0.14em] text-ink uppercase"
        >
          Izvor za GitHub · {paket}
        </a>
        <Link
          to="/"
          className="mt-5 block text-center text-[11px] font-bold tracking-widest text-dim uppercase"
        >
          Natrag u prašinu
        </Link>
        <p className="mt-4 text-center text-[10px] font-bold tracking-wide text-dim">{CREDITS}</p>
      </div>
    </main>
  );
}
