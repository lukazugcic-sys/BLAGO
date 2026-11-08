import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { CHUNK_RELOAD_KEY, isChunkLoadError, reloadBustingCache } from "@/lib/chunk-error";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const chunk = isChunkLoadError(error);
  const poruka =
    error instanceof Error && error.message
      ? error.message
      : "Neočekivana pogreška. Osvježi stranicu.";

  useEffect(() => {
    if (!chunk || typeof sessionStorage === "undefined") return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } catch {
      return;
    }
    reloadBustingCache();
  }, [chunk]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-void px-6 text-center text-ink">
      <span className="text-ruby" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-xl text-gold">Nešto je pošlo po zlu</h1>
      <p className="max-w-md text-sm font-bold text-ink/80">
        {chunk
          ? "Igra se nije učitala. Novi paket je na mreži — osvježi stranicu."
          : "Dogodila se pogreška. Pokušaj osvježiti."}
      </p>
      <p className="max-w-md text-xs break-words text-dim">{poruka}</p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.removeItem(CHUNK_RELOAD_KEY);
          } catch {
            /* ignore */
          }
          reloadBustingCache();
        }}
        className="mt-2 min-h-11 rounded-full border border-gold/55 bg-gold/18 px-8 text-sm font-bold tracking-[0.2em] text-gold uppercase"
      >
        Osvježi
      </button>
    </main>
  );
}

export function NijeNadjeno() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-void px-6 text-center text-ink">
      <h1 className="font-display text-xl text-gold">Nije pronađeno</h1>
      <p className="max-w-md text-sm font-bold text-ink/80">Ova stranica ne postoji. Vrati se u kaubu.</p>
      <a
        href="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-full border border-gold/55 bg-gold/18 px-8 text-sm font-bold tracking-[0.2em] text-gold uppercase"
      >
        Natrag
      </a>
    </main>
  );
}
