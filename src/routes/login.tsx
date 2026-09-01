import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GROK_PROVIDERS,
  authEnabled,
  authClient,
  signIn,
} from "@/lib/auth/client";
import { ART } from "@/lib/game/art";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitEmail = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Igrač",
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prijava nije uspjela");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-scene grid min-h-dvh place-items-center px-6 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <img
            src={ART.splash}
            alt=""
            className="mx-auto size-20 rounded-full object-cover object-[center_18%] ring-2 ring-gold/50"
          />
          <h1 className="wordmark mt-3 text-3xl tracking-[0.28em]">BLAGO</h1>
          <p className="mt-2 text-xs font-bold tracking-widest text-dim uppercase">
            Spremi napredak · družina · pohodi
          </p>
        </div>

        {authEnabled ? (
          <div className="space-y-2.5">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="min-h-12 w-full rounded-xl border border-line bg-panel py-3 text-sm font-bold tracking-wide text-ink"
              >
                Nastavi s {p.label}
              </button>
            ))}

            <div className="flex items-center gap-3 py-2">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-bold tracking-widest text-dim">EMAIL</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {mode === "up" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ime igrača"
                className="min-h-12 w-full rounded-xl border border-line bg-panel px-4 text-base text-ink outline-none placeholder:text-dim"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="min-h-12 w-full rounded-xl border border-line bg-panel px-4 text-base text-ink outline-none placeholder:text-dim"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lozinka"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              className="min-h-12 w-full rounded-xl border border-line bg-panel px-4 text-base text-ink outline-none placeholder:text-dim"
            />
            {error && <p className="text-sm font-semibold text-ruby">{error}</p>}
            <button
              type="button"
              disabled={busy || !email || password.length < 8}
              onClick={() => void submitEmail()}
              className="min-h-12 w-full rounded-xl bg-gold py-3 text-sm font-bold tracking-wide text-void disabled:bg-line disabled:text-dim"
            >
              {busy ? "..." : mode === "up" ? "Registriraj se" : "Prijavi se"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
              className="w-full py-2 text-xs font-bold tracking-wide text-dim"
            >
              {mode === "up" ? "Već imaš račun? Prijavi se" : "Novi igrač? Registriraj se"}
            </button>
            <p className="text-center text-[11px] text-dim">Lozinka min. 8 znakova</p>
          </div>
        ) : (
          <p className="text-sm text-dim">Prijava je isključena.</p>
        )}

        <Link
          to="/"
          className="mt-8 block text-center text-xs font-bold tracking-widest text-dim"
        >
          Igraj bez računa
        </Link>
      </div>
    </main>
  );
}
