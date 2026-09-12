import { type ReactNode } from "react";

export type ShakeKind = "soft" | "hard" | "skull";
export type FxGdje = "slot" | "app";

function hostZa(gdje: FxGdje) {
  if (typeof document === "undefined") return null;
  if (gdje === "slot") return document.querySelector(".slot-fx-host");
  return document.querySelector(".atmosphere");
}

export function flash(boja: string, gdje: FxGdje = "app") {
  const host = hostZa(gdje);
  if (!host) return;
  const el = document.createElement("div");
  el.className = "flash-overlay pointer-events-none absolute inset-0 z-40";
  el.style.backgroundColor = boja;
  host.appendChild(el);
  window.setTimeout(() => el.remove(), 820);
}

export function shake(kind: ShakeKind = "soft", gdje: FxGdje = "app") {
  if (typeof document === "undefined") return;
  const el =
    gdje === "slot"
      ? document.querySelector(".slot-fx-host")
      : document.querySelector(".game-shell");
  if (!el) return;
  const cls =
    kind === "skull" ? "screen-shake-skull" : kind === "hard" ? "screen-shake-hard" : "screen-shake";
  el.classList.remove("screen-shake", "screen-shake-hard", "screen-shake-skull");
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  const ms = kind === "skull" ? 620 : kind === "hard" ? 430 : 220;
  window.setTimeout(() => el.classList.remove(cls), ms);
}

export function hitstop(ms = 80, gdje: FxGdje = "app") {
  if (typeof document === "undefined") return;
  const el =
    gdje === "slot" ? document.querySelector(".slot-fx-host") : document.documentElement;
  if (!el) return;
  el.classList.add("hitstop");
  window.setTimeout(() => el.classList.remove("hitstop"), ms);
}

export function UIProvider({ children }: { children: ReactNode }) {
  return children;
}
