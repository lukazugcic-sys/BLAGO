import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_VERSION } from "@/lib/game/version";
import { ART, CREDITS } from "@/lib/game/art";

export const Route = createFileRoute("/preuzmi")({
  ssr: false,
  component: Preuzmi,
});

function Preuzmi() {
  return (
    <main className="preuzmi-scena relative grid min-h-dvh place-items-center overflow-hidden bg-void px-5 text-ink">
      <img src={ART.splash} alt="" className="pointer-events-none absolute inset-0 size-full object-cover object-[center_28%] opacity-55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/20 via-void/55 to-void" />
      <div className="relative z-[1] w-full max-w-sm rounded-[1.6rem] border border-gold/45 bg-panel p-5 shadow-[0_0_0_4px_#2a140c,0_18px_40px_rgb(0_0_0_/_0.45)]">
        <p className="text-[10px] font-bold tracking-[0.32em] text-gold uppercase">kaubojski automat</p>
        <h1 className="wordmark mt-2 text-4xl tracking-[0.2em]">BLAGO</h1>
        <p className="mt-3 text-sm font-bold leading-relaxed text-ink/80">
          Igra se u pregledniku. Beta {APP_VERSION}. Na telefonu otvori izbornik preglednika i dodaj BLAGO na početni zaslon — ikona ostaje, bez trgovine.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs font-bold leading-relaxed text-ink/75">
          <li>Otvori igru u Chromeu ili Safariju.</li>
          <li>Izbornik preglednika → Dodaj na početni zaslon.</li>
          <li>Otvori ikonu. Puni zaslon, bez trake adrese.</li>
        </ol>
        <a
          href={`/apk/BLAGO-${APP_VERSION}.apk`}
          download={`BLAGO-${APP_VERSION}.apk`}
          className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.18em] text-void uppercase"
        >
          Preuzmi APK
        </a>
        <Link
          to="/"
          className="mt-2 flex min-h-12 items-center justify-center rounded-full border border-gold/50 text-sm font-bold tracking-[0.18em] text-gold uppercase"
        >
          Igraj
        </Link>
        <p className="mt-4 text-center text-[10px] font-bold tracking-wide text-dim">{CREDITS}</p>
      </div>
    </main>
  );
}
