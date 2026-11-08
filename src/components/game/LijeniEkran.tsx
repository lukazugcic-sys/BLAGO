import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { TabKostur } from "./TabKostur";

type Mod = Record<string, ComponentType<any>>;

const kes = new Map<string, ComponentType<any>>();

function saRokom<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("rok")), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function LijeniEkran({
  ime,
  ucitaj,
  direktno,
  djeca,
}: {
  ime: string;
  ucitaj: () => Promise<Mod>;
  direktno: () => Promise<Mod>;
  djeca: (C: ComponentType<any>) => ReactNode;
}) {
  const [C, setC] = useState<ComponentType<any> | null>(() => kes.get(ime) ?? null);
  const [pokusaj, setPokusaj] = useState(0);
  const [greska, setGreska] = useState(false);

  useEffect(() => {
    if (kes.has(ime)) {
      setC(() => kes.get(ime) ?? null);
      setGreska(false);
      return;
    }
    let zivi = true;
    setGreska(false);
    const izvori = [ucitaj, ucitaj, direktno];
    void (async () => {
      for (const fn of izvori) {
        try {
          const m = await saRokom(fn(), 3500);
          const K = m[ime];
          if (!K) continue;
          kes.set(ime, K);
          if (zivi) setC(() => K);
          return;
        } catch {
          /* sljedeći pokušaj ili direktni uvoz */
        }
      }
      if (zivi) setGreska(true);
    })();
    return () => {
      zivi = false;
    };
  }, [ime, pokusaj, ucitaj, direktno]);

  if (C) return <>{djeca(C)}</>;
  if (greska) {
    return (
      <button type="button" className="tab-ponovo" onClick={() => setPokusaj((n) => n + 1)}>
        Učitaj opet
      </button>
    );
  }
  return <TabKostur />;
}
