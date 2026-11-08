/** Briše lokalni BLAGO save prije hidracije. Ne uvozi store. */

export const SESIJA_NOVI = "blago-v1:lokalni-novi";
export const OBRADJEN_NOVI = "blago-v1:novi-obraden";

export type KljucSpremnik = {
  length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
};

export type SesijaSpremnik = {
  setItem(key: string, value: string): void;
};

export type NoviHost = {
  href: string;
  local: KljucSpremnik;
  session: SesijaSpremnik;
  replace(url: string): void;
};

export function kljucJeBlago(key: string) {
  return key.startsWith("blago-v1") || key.startsWith("blago:");
}

export function obrisiBlagoKljuceve(storage: KljucSpremnik) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && kljucJeBlago(k)) keys.push(k);
  }
  for (const k of keys) {
    try {
      storage.removeItem(k);
    } catch {
      /* kvota / privatno */
    }
  }
}

/** Putanja bez ?novi=1, ili null ako parametra nema. */
export function adresaBezNovi(href: string): string | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  if (u.searchParams.get("novi") !== "1") return null;
  u.searchParams.delete("novi");
  return `${u.pathname}${u.search}${u.hash}`;
}

/** Sinkrono: zastavica, brisanje ključeva, adresa bez ?novi. Bez reloada i bez storea. */
export function primijeniNoviPrije(host: NoviHost): boolean {
  const sljedeci = adresaBezNovi(host.href);
  if (!sljedeci) return false;
  try {
    host.session.setItem(SESIJA_NOVI, "1");
    host.session.setItem(OBRADJEN_NOVI, "1");
  } catch {
    /* privatni način */
  }
  obrisiBlagoKljuceve(host.local);
  try {
    host.replace(sljedeci);
  } catch {
    /* povijest zaključana */
  }
  return true;
}

async function obrisiBlagoBaze() {
  const idb = window.indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string | null }[]> };
  if (!idb || typeof idb.databases !== "function") return;
  let sve: { name?: string | null }[] = [];
  try {
    sve = await idb.databases();
  } catch {
    return;
  }
  await Promise.all(
    sve.map((d) => {
      const name = d.name || "";
      if (!/blago/i.test(name) || /auth/i.test(name)) return Promise.resolve();
      return new Promise<void>((res) => {
        try {
          const req = idb.deleteDatabase(name);
          req.onsuccess = () => res();
          req.onerror = () => res();
          req.onblocked = () => res();
        } catch {
          res();
        }
      });
    }),
  );
}

/** Pozovi prije ucitaj(). Na serveru ne radi ništa. Ne uvozi store. */
export function pokreniNoviPrijeHidracije(): boolean {
  if (typeof window === "undefined") return false;
  const bilo = primijeniNoviPrije({
    href: window.location.href,
    local: window.localStorage,
    session: window.sessionStorage,
    replace: (url) => {
      window.history.replaceState(window.history.state, "", url);
    },
  });
  if (bilo) void obrisiBlagoBaze();
  return bilo;
}
