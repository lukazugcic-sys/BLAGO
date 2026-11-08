import type { SimbolId } from "./types";
import { postaviBlokaduSpremanja } from "./persist";

const SESIJA = "blago-v1:lokalni-novi";
const OBRADJEN = "blago-v1:novi-obraden";
const SVEZ = "blago-v1:svjez-uredjaj";

let brise = false;
let svjezUSesiji = false;
postaviBlokaduSpremanja(() => brise);

/** Uređaj koji je ušao bez lokalnog savea ne smije povući tuđi cloud. */
export function oznaciUredjajBezSavea(imaLokalniSave: boolean) {
  if (imaLokalniSave) return;
  svjezUSesiji = true;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SVEZ, "1");
  } catch {
    /* privatni način */
  }
}

export function uredjajJeSvjez() {
  if (svjezUSesiji) return true;
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SVEZ) === "1";
  } catch {
    return false;
  }
}

/** Query ?novi=1 radi na svakoj adresi, uključujući objavljenu igru. */
export function jePregledZaNovi() {
  return typeof window !== "undefined";
}

export function lokalniNoviJeAktivan() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESIJA) === "1";
  } catch {
    return false;
  }
}

function obradjenJe() {
  try {
    return window.sessionStorage.getItem(OBRADJEN) === "1";
  } catch {
    return false;
  }
}

/** Makne ?novi iz adrese bez reloada, da se dijalog ne vrti u petlji. */
export function skiniNoviParam() {
  if (typeof window === "undefined") return;
  const u = new URL(window.location.href);
  if (!u.searchParams.has("novi")) return;
  u.searchParams.delete("novi");
  window.history.replaceState(window.history.state, "", `${u.pathname}${u.search}${u.hash}`);
}

/** Pita samo jednom u sesiji. Ako je početak već gotov, parametar se samo skine. */
export function noviUpitTreba() {
  if (typeof window === "undefined" || !jePregledZaNovi()) return false;
  if (new URLSearchParams(window.location.search).get("novi") !== "1") return false;
  if (obradjenJe()) {
    skiniNoviParam();
    return false;
  }
  return true;
}

function obrisiKljuceve() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && (k.startsWith("blago-v1") || k.startsWith("blago:"))) keys.push(k);
  }
  for (const k of keys) window.localStorage.removeItem(k);
}

async function obrisiBaze() {
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

/** Briše spremanje na ovom uređaju i serverski zapis ove prijave, pa krene od priče. */
export async function lokalniNoviPocetak() {
  if (typeof window === "undefined" || brise) return;
  brise = true;
  svjezUSesiji = true;
  try {
    window.sessionStorage.setItem(SESIJA, "1");
    window.sessionStorage.setItem(OBRADJEN, "1");
    window.sessionStorage.setItem(SVEZ, "1");
  } catch {
    /* privatni način */
  }
  skiniNoviParam();
  try {
    const { deleteCloudSave } = await import("@/lib/game/cloud");
    await deleteCloudSave();
  } catch {
    /* nema prijave ili mreže — lokalni bris i dalje vrijedi */
  }
  obrisiKljuceve();
  try {
    const { useGameStore } = await import("@/lib/stores/gameStore");
    const { pocetnoStanje } = await import("@/lib/stores/gameParse");
    const { useSlotStore } = await import("@/lib/stores/slotStore");
    useGameStore.setState({ ...pocetnoStanje, ucitavam: false });
    useSlotStore.setState({
      simboli: Array(15).fill("gold") as SimbolId[],
      vrti: false,
      spinningCols: [false, false, false, false, false],
      dobitakNaCekanju: null,
      dobitnaPolja: [],
      dobitneLinije: [],
      gambleCount: 0,
      winCelebration: null,
    });
    const { vodicNaUcitavanju } = await import("./vodic");
    vodicNaUcitavanju(false);
  } catch {
    /* reload svejedno briše disk */
  }
  await obrisiBaze();
  obrisiKljuceve();
  skiniNoviParam();
  window.location.reload();
}
