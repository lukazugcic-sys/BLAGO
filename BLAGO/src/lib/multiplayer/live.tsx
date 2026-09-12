import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { izracunajPlijen, jeLegalniPotez, jeTerminal, noviPohodId, npcPotez, primijeniPotez, plijenUkupno, sljedeciTrojac, tkoIdePrvi, hrpeIzResursa, dohvatiLokalneMete, type Hrpe, type NimPotez, type TrojacTko } from "@/lib/game/raids";
import { raspolozenjeKaube, kategorijaKaube } from "@/lib/game/economy";
import { kaubaOd } from "@/lib/game/ljudi";
import { tjedanSad } from "@/lib/game/tjedan";
import { SUSJEDI } from "@/lib/game/susjedi";
import { serifDrziRed } from "@/lib/game/economy";
import { serif, dodajXpLiku } from "@/lib/game/ljudi";
import { playSfx } from "@/lib/game/audio";
import { flash, shake } from "@/lib/context/UIContext";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { useP2PRoom } from "./use-p2p-room";
import { loadJSON, saveJSON, SAVE_KEYS } from "@/lib/game/persist";

export type LiveCowboy = {
  id: string;
  ime: string;
  razina: number;
  zlato: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
  stitovi: number;
  jahanje: number;
  ophodnja: number;
  connected: boolean;
  rttMs: number | null;
  failed: boolean;
  ljudi: number;
  konji: number;
  mood: string;
  kat: string;
};

export type LiveFeed = { id: number; text: string; t: number };

export type LivePohod = {
  id: string;
  peerId: string;
  ime: string;
  hrpe: Hrpe;
  ostava: { drvo: number; kamen: number; zeljezo: number };
  uloga: "napadac" | "branitelj";
  faza: "poziv" | "ceka" | "igra" | "serif" | "kraj";
  naPotezu: boolean;
  napadacPrvi: boolean;
  pobjeda?: boolean;
};

export type TaborSnimka = {
  ime: string;
  razina: number;
  ljudi: number;
  konji: number;
  mood: string;
  moodRec: string;
  kat: string;
  zlato: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
  krov: number;
  jelo: number;
  zabava: number;
  voda: number;
  posao: number;
  red: number;
  konjiHub: number;
  zdravlje: number;
};

export type PosjetCin = "pozdrav" | "salun" | "pomoc" | "izdaj";

export type LivePosjet = {
  id: string;
  peerId: string;
  ime: string;
  uloga: "gost" | "domacin";
  faza: "poziv" | "ceka" | "unutra";
  tabor: TaborSnimka | null;
  cin: string | null;
};

export type TrojacMeta = {
  uid: string;
  ime: string;
  serif: string;
  rec: string;
};

export type LiveTrojac = {
  id: string;
  peerId: string;
  ime: string;
  meta: TrojacMeta;
  hrpe: Hrpe;
  ostava: { drvo: number; kamen: number; zeljezo: number };
  uloga: "vodja" | "saveznik";
  faza: "poziv" | "ceka" | "igra" | "kraj";
  naPotezu: TrojacTko;
  saveznikTu: boolean;
  pobjednik?: TrojacTko;
};

type Presence = {
  k: "p";
  ime: string;
  razina: number;
  zlato: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
  stitovi: number;
  jahanje: number;
  ophodnja: number;
  ljudi: number;
  konji: number;
  mood: string;
  kat: string;
};

type Wire =
  | Presence
  | { k: "win"; ime: string; zlato: number; fx: "win" | "jackpot" }
  | { k: "chat"; text: string }
  | { k: "napad"; ime: string }
  | { k: "stit"; ime: string }
  | { k: "plijen"; ime: string; drvo: number; kamen: number; zeljezo: number }
  | { k: "dar"; ime: string; drvo: number; zlato: number }
  | { k: "pohod-poziv"; id: string; ime: string; hrpe: Hrpe; jahanje: number }
  | { k: "pohod-prihvati"; id: string; napadacPrvi: boolean }
  | { k: "pohod-serif"; id: string }
  | { k: "pohod-odbij"; id: string }
  | { k: "pohod-potez"; id: string; hrpa: 0 | 1 | 2; skini: number }
  | { k: "pohod-bjezi"; id: string }
  | { k: "posjet-poziv"; id: string; ime: string }
  | { k: "posjet-prihvati"; id: string; tabor: TaborSnimka }
  | { k: "posjet-odbij"; id: string }
  | { k: "posjet-kraj"; id: string }
  | { k: "posjet-cin"; id: string; cin: PosjetCin; ime: string; drvo?: number; zlato?: number }
  | { k: "posjet-snimka"; id: string; tabor: TaborSnimka }
  | {
      k: "trojac-poziv";
      id: string;
      ime: string;
      hrpe: Hrpe;
      meta: TrojacMeta;
      ostava: { drvo: number; kamen: number; zeljezo: number };
    }
  | { k: "trojac-prihvati"; id: string }
  | { k: "trojac-odbij"; id: string }
  | { k: "trojac-potez"; id: string; hrpa: 0 | 1 | 2; skini: number; tko: TrojacTko }
  | { k: "trojac-bjezi"; id: string };

export type LiveApi = {
  joined: boolean;
  room: string;
  selfId: string;
  cowboys: LiveCowboy[];
  feed: LiveFeed[];
  ticker: string | null;
  pohod: LivePohod | null;
  posjet: LivePosjet | null;
  trojac: LiveTrojac | null;
  joinRoom: (code: string) => void;
  sendChat: (text: string) => void;
  napad: (peerId: string) => void;
  dar: (peerId: string, sto?: "drvo" | "zlato") => void;
  pozoviPohod: (peerId: string, ime: string, hrpe: Hrpe) => string;
  prihvatiPohod: () => void;
  pustiSerifa: () => void;
  odbijPohod: () => void;
  bjeziPohod: () => void;
  igrajPotez: (potez: NimPotez) => boolean;
  pozoviPosjet: (peerId: string, ime: string) => void;
  prihvatiPosjet: () => void;
  odbijPosjet: () => void;
  odjasiPosjet: () => void;
  cinPosjet: (cin: PosjetCin) => void;
  pozoviTrojac: (peerId: string, ime: string, meta?: TrojacMeta, ostava?: { drvo: number; kamen: number; zeljezo: number }) => void;
  prihvatiTrojac: () => void;
  odbijTrojac: () => void;
  bjeziTrojac: () => void;
  igrajTrojac: (potez: NimPotez) => boolean;
};

const POHOD_CEKA_MS = 9000;

function praznaOstava() {
  return { drvo: 0, kamen: 0, zeljezo: 0 };
}

function uzmiOstava(
  p?: { drvo?: number; kamen?: number; zeljezo?: number } | null,
  hrpe?: Hrpe,
) {
  if (p && ((p.drvo ?? 0) > 0 || (p.kamen ?? 0) > 0 || (p.zeljezo ?? 0) > 0)) {
    return {
      drvo: Math.max(0, Math.floor(p.drvo ?? 0)),
      kamen: Math.max(0, Math.floor(p.kamen ?? 0)),
      zeljezo: Math.max(0, Math.floor(p.zeljezo ?? 0)),
    };
  }
  if (hrpe) {
    return { drvo: hrpe[0] * 48, kamen: hrpe[1] * 48, zeljezo: hrpe[2] * 48 };
  }
  return praznaOstava();
}

function plijenPohoda(ostava: { drvo: number; kamen: number; zeljezo: number }, razina: number, rad = 0) {
  return izracunajPlijen(ostava, razina, rad);
}

function snimkaTabora(): TaborSnimka {
  const s = useGameStore.getState();
  const kauba = kaubaOd({
    gradevine: s.gradevine,
    stanovnici: s.stanovnici,
    zamjenici: s.zamjenici,
    konjiBroj: s.konjiBroj,
    konjiDuznost: s.konjiDuznost,
    sijenoDo: s.sijenoDo,
    kisaDo: s.kisaDo,
    govedaBroj: s.govedaBroj,
    govedaDuznost: s.govedaDuznost,
  });
  const mood = raspolozenjeKaube(kauba);
  const kat = kategorijaKaube(kauba.ljudi);
  const p = kauba.pokrivaju;
  return {
    ime: s.imeIgraca || "Kauboj",
    razina: s.igracRazina,
    ljudi: kauba.ljudi,
    konji: s.konjiBroj,
    mood: mood.id,
    moodRec: mood.rec,
    kat: kat.naziv,
    zlato: Math.floor(s.zlato),
    drvo: Math.floor(s.resursi.drvo),
    kamen: Math.floor(s.resursi.kamen),
    zeljezo: Math.floor(s.resursi.zeljezo),
    krov: p.krov,
    jelo: p.jelo,
    zabava: p.zabava,
    voda: p.voda,
    posao: p.posao,
    red: p.red,
    konjiHub: p.konji,
    zdravlje: p.zdravlje,
  };
}

function metaZaTrojac(): { meta: TrojacMeta; ostava: { drvo: number; kamen: number; zeljezo: number }; hrpe: Hrpe } {
  const t = tjedanSad();
  const s = t.susjed ?? SUSJEDI[0]!;
  const lokal = dohvatiLokalneMete(1, useGameStore.getState().igracRazina)[0];
  const ostava = lokal?.resursi ?? { drvo: 96, kamen: 96, zeljezo: 96 };
  return {
    meta: { uid: s.uid, ime: s.kauba, serif: s.serif, rec: s.recPohod },
    ostava,
    hrpe: hrpeIzResursa(ostava),
  };
}

const POSJET_CEKA_MS = 12000;

const LiveCtx = createContext<LiveApi | null>(null);

export function sanitizeRoom(raw: string) {
  const t = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 12);
  return t.length >= 3 ? t : "BLAGO";
}

export function LiveProvider({
  roomCode,
  onRoomCode,
  children,
}: {
  roomCode: string;
  onRoomCode: (code: string) => void;
  children: ReactNode;
}) {
  const ime = useGameStore((s) => s.imeIgraca) || "Kauboj";
  const p2p = useP2PRoom({ room: roomCode, name: ime });
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const presenceRef = useRef(presence);
  presenceRef.current = presence;
  const [feed, setFeed] = useState<LiveFeed[]>([]);
  const [ticker, setTicker] = useState<string | null>(null);
  const [pohod, setPohod] = useState<LivePohod | null>(null);
  const pohodRef = useRef(pohod);
  pohodRef.current = pohod;
  const [posjet, setPosjet] = useState<LivePosjet | null>(null);
  const posjetRef = useRef(posjet);
  posjetRef.current = posjet;
  const [trojac, setTrojac] = useState<LiveTrojac | null>(null);
  const trojacRef = useRef(trojac);
  trojacRef.current = trojac;
  const seq = useRef(0);

  const pushFeed = useCallback((text: string) => {
    const id = ++seq.current;
    setFeed((f) => [...f.slice(-11), { id, text, t: Date.now() }]);
    setTicker(text);
  }, []);

  useEffect(() => {
    if (!ticker) return;
    const t = window.setTimeout(() => setTicker(null), 2800);
    return () => window.clearTimeout(t);
  }, [ticker]);

  useEffect(
    () =>
      p2p.onMessage((from, data) => {
        const msg = data as Wire;
        if (!msg || typeof msg !== "object" || !("k" in msg)) return;
        if (msg.k === "p") {
          setPresence((p) => ({ ...p, [from]: msg }));
          return;
        }
        if (msg.k === "win") {
          playSfx(msg.fx === "jackpot" ? "jackpot" : "win");
          pushFeed(
            msg.fx === "jackpot"
              ? `${msg.ime} je pogodio JACKPOT · ${msg.zlato} zlata!`
              : `${msg.ime} je uzeo ${msg.zlato} zlata`,
          );
          return;
        }
        if (msg.k === "chat") {
          const imePeer = presenceRef.current[from]?.ime ?? "Kauboj";
          pushFeed(`${imePeer}: ${msg.text}`);
          playSfx("button");
          return;
        }
        if (msg.k === "pohod-poziv") {
          const sad = pohodRef.current;
          if (sad && sad.faza !== "kraj") {
            p2p.send({ k: "pohod-odbij", id: msg.id } satisfies Wire, from);
            return;
          }
          const hrpe: Hrpe = [
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[0] ?? 0))),
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[1] ?? 0))),
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[2] ?? 0))),
          ];
          const gs = useGameStore.getState();
          const napadacPrvi = tkoIdePrvi(msg.jahanje ?? 0, gs.konjiDuznost.ophodnja) === "igrac";
          setPohod({
            id: msg.id,
            peerId: from,
            ime: msg.ime || presenceRef.current[from]?.ime || "Kauboj",
            hrpe,
            ostava: uzmiOstava(gs.resursi, hrpe),
            uloga: "branitelj",
            faza: "poziv",
            naPotezu: false,
            napadacPrvi,
          });
          pushFeed(`${msg.ime} juriša na ostavu.`);
          playSfx("attack");
          shake("hard");
          flash("rgba(232, 93, 93, 0.35)");
          return;
        }
        if (msg.k === "pohod-prihvati") {
          const sad = pohodRef.current;
          if (!sad || sad.id !== msg.id || sad.uloga !== "napadac") return;
          const napadacPrvi = msg.napadacPrvi ?? sad.napadacPrvi;
          setPohod({ ...sad, faza: "igra", naPotezu: napadacPrvi, napadacPrvi });
          pushFeed(`${sad.ime} je stao. Dvoboj.`);
          playSfx("button");
          return;
        }
        if (msg.k === "pohod-serif") {
          const sad = pohodRef.current;
          if (!sad || sad.id !== msg.id || sad.uloga !== "napadac") return;
          setPohod({ ...sad, faza: "serif", naPotezu: true });
          pushFeed(`${sad.ime} pušta šerifa.`);
          return;
        }
        if (msg.k === "pohod-odbij") {
          const sad = pohodRef.current;
          if (!sad || sad.id !== msg.id) return;
          setPohod(null);
          pushFeed("Pohod odbijen. Štit ili prašina.");
          playSfx("attack");
          return;
        }
        if (msg.k === "pohod-potez") {
          const sad = pohodRef.current;
          if (!sad || sad.id !== msg.id || sad.faza !== "igra") return;
          const potez: NimPotez = { hrpa: msg.hrpa, skini: msg.skini };
          if (!jeLegalniPotez(sad.hrpe, potez)) return;
          const next = primijeniPotez(sad.hrpe, potez);
          if (jeTerminal(next)) {
            const pobjeda = sad.uloga === "branitelj";
            setPohod({ ...sad, hrpe: next, faza: "kraj", naPotezu: false, pobjeda });
            if (!pobjeda) {
              const stolen = plijenPohoda(sad.ostava, useGameStore.getState().igracRazina);
              useGameStore.setState((s) => ({
                resursi: {
                  drvo: Math.max(0, s.resursi.drvo - stolen.drvo),
                  kamen: Math.max(0, s.resursi.kamen - stolen.kamen),
                  zeljezo: Math.max(0, s.resursi.zeljezo - stolen.zeljezo),
                },
                poruka: `${sad.ime} je uzeo zadnji žeton.`,
              }));
              playSfx("skull");
              shake("hard");
            } else {
              playSfx("collect");
              flash("rgba(198, 224, 90, 0.4)");
            }
            return;
          }
          setPohod({ ...sad, hrpe: next, naPotezu: true });
          playSfx("attack");
          return;
        }
        if (msg.k === "pohod-bjezi") {
          const sad = pohodRef.current;
          if (!sad || sad.id !== msg.id || sad.faza === "kraj") return;
          const bilaIgra = sad.faza === "igra";
          setPohod({ ...sad, faza: "kraj", naPotezu: false, pobjeda: true });
          if (bilaIgra && sad.uloga === "napadac") {
            const peer = presenceRef.current[sad.peerId];
            const loot = plijenPohoda(sad.ostava, peer?.razina ?? 1, useGameStore.getState().konjiDuznost.rad);
            if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
          }
          pushFeed(`${sad.ime} je pobjegao.`);
          playSfx("button");
          return;
        }
        if (msg.k === "napad") {
          const gs = useGameStore.getState();
          if (gs.stitovi > 0) {
            useGameStore.setState({
              stitovi: gs.stitovi - 1,
              poruka: `${msg.ime} juriša na tabor — štit drži!`,
            });
            p2p.send({ k: "stit", ime: gs.imeIgraca || "Kauboj" } satisfies Wire, from);
            pushFeed(`${msg.ime} je udarao u tvoj štit`);
            playSfx("attack");
            return;
          }
          const tko = serif(gs.ljudi);
          const drzi =
            serifDrziRed(gs.gradevine.ured || 0, tko?.razina ?? 0, gs.stanovnici) +
            gs.zamjenici.filter((z) => z.spreman).length * 0.06;
          if (tko && Math.random() < drzi) {
            useGameStore.setState({
              poruka: `${tko.ime} je otjerao ${msg.ime}.`,
              ljudi: gs.ljudi.map((p) => (p.id === tko.id ? dodajXpLiku(p, 6) : p)),
            });
            p2p.send({ k: "stit", ime: tko.ime } satisfies Wire, from);
            pushFeed(`${tko.ime} je čuvao ostavu`);
            playSfx("attack");
            return;
          }
          const stolen = izracunajPlijen(gs.resursi);
          if (plijenUkupno(stolen) <= 0) {
            p2p.send(
              { k: "plijen", ime: gs.imeIgraca || "Kauboj", drvo: 0, kamen: 0, zeljezo: 0 },
              from,
            );
            pushFeed(`${msg.ime} je zavirio u praznu ostavu`);
            return;
          }
          useGameStore.setState((s) => ({
            resursi: {
              drvo: Math.max(0, s.resursi.drvo - stolen.drvo),
              kamen: Math.max(0, s.resursi.kamen - stolen.kamen),
              zeljezo: Math.max(0, s.resursi.zeljezo - stolen.zeljezo),
            },
            poruka: `${msg.ime} je opljačkao ostavu!`,
          }));
          p2p.send(
            {
              k: "plijen",
              ime: gs.imeIgraca || "Kauboj",
              drvo: stolen.drvo,
              kamen: stolen.kamen,
              zeljezo: stolen.zeljezo,
            },
            from,
          );
          pushFeed(`${msg.ime} je uzeo tvoje blago`);
          playSfx("skull");
          useGameStore.getState().zapisiDebrief({
            metaIme: msg.ime,
            pobjeda: false,
            stav: null,
            vrsta: "obrana",
            recap: `${msg.ime} je uzeo blago iz ostave.`,
          });
          return;
        }
        if (msg.k === "stit") {
          pushFeed(`${msg.ime} ima štit — pohod odbijen`);
          playSfx("attack");
          return;
        }
        if (msg.k === "plijen") {
          const n = msg.drvo + msg.kamen + msg.zeljezo;
          pushFeed(n > 0 ? `Uzeo si plijen od ${msg.ime}` : `${msg.ime}: ostava prazna`);
          return;
        }
        if (msg.k === "dar") {
          useGameStore.setState((s) => ({
            zlato: s.zlato + Math.max(0, msg.zlato),
            resursi: { ...s.resursi, drvo: s.resursi.drvo + Math.max(0, msg.drvo) },
            poruka: msg.zlato > 0 ? `${msg.ime} ti šalje zlato.` : `${msg.ime} ti šalje drvo.`,
          }));
          pushFeed(msg.zlato > 0 ? `${msg.ime} ti je poslao zlato.` : `${msg.ime} ti je poslao drvo.`);
          playSfx("collect");
          return;
        }
        if (msg.k === "posjet-poziv") {
          const sad = posjetRef.current;
          if (sad) {
            p2p.send({ k: "posjet-odbij", id: msg.id } satisfies Wire, from);
            return;
          }
          setPosjet({
            id: msg.id,
            peerId: from,
            ime: msg.ime || presenceRef.current[from]?.ime || "Kauboj",
            uloga: "domacin",
            faza: "poziv",
            tabor: null,
            cin: null,
          });
          pushFeed(`${msg.ime} jaše u tabor.`);
          playSfx("button");
          return;
        }
        if (msg.k === "posjet-prihvati") {
          const sad = posjetRef.current;
          if (!sad || sad.id !== msg.id || sad.uloga !== "gost") return;
          setPosjet({ ...sad, faza: "unutra", tabor: msg.tabor });
          pushFeed(`Kapija otvorena. U ${msg.tabor.kat} ${msg.tabor.ime}.`);
          playSfx("collect");
          flash("rgba(198, 224, 90, 0.28)");
          return;
        }
        if (msg.k === "posjet-odbij") {
          const sad = posjetRef.current;
          if (!sad || sad.id !== msg.id) return;
          setPosjet(null);
          pushFeed("Kapija zatvorena. Prašina.");
          playSfx("attack");
          return;
        }
        if (msg.k === "posjet-kraj") {
          const sad = posjetRef.current;
          if (!sad || sad.id !== msg.id) return;
          setPosjet(null);
          pushFeed(`${sad.ime} je odjahao.`);
          playSfx("button");
          return;
        }
        if (msg.k === "posjet-snimka") {
          const sad = posjetRef.current;
          if (!sad || sad.id !== msg.id || sad.uloga !== "gost") return;
          setPosjet({ ...sad, tabor: msg.tabor });
          return;
        }
        if (msg.k === "posjet-cin") {
          const sad = posjetRef.current;
          if (!sad || sad.id !== msg.id) return;
          if (msg.cin === "izdaj") {
            setPosjet(null);
            pushFeed(`${msg.ime} je izdao tabor. Nož iza leđa.`);
            playSfx("skull");
            shake("hard");
            flash("rgba(232, 93, 93, 0.4)");
            return;
          }
          if (msg.cin === "pozdrav") {
            setPosjet({ ...sad, cin: `${msg.ime} skida šešir.` });
            pushFeed(`${msg.ime}: pozdrav s ulice.`);
            playSfx("button");
            return;
          }
          if (msg.cin === "salun") {
            const zlato = Math.max(0, msg.zlato ?? 4);
            useGameStore.setState((s) => ({
              zlato: s.zlato + zlato,
              poruka: `${msg.ime} plaća kolo u salunu.`,
            }));
            setPosjet({ ...sad, cin: "Kolo u salunu." });
            pushFeed(`${msg.ime} plaća kolo.`);
            playSfx("collect");
            return;
          }
          if (msg.cin === "pomoc") {
            const drvo = Math.max(0, msg.drvo ?? 0);
            const zlato = Math.max(0, msg.zlato ?? 0);
            useGameStore.setState((s) => ({
              zlato: s.zlato + zlato,
              resursi: { ...s.resursi, drvo: s.resursi.drvo + drvo },
              poruka: drvo > 0 ? `${msg.ime} nosi drvo u tabor.` : `${msg.ime} ostavlja zlato na stolu.`,
            }));
            setPosjet({ ...sad, cin: "Ruke pomažu." });
            pushFeed(`${msg.ime} pomaže taboru.`);
            playSfx("build");
            return;
          }
          return;
        }
        if (msg.k === "trojac-poziv") {
          const sad = trojacRef.current;
          if (sad && sad.faza !== "kraj") {
            p2p.send({ k: "trojac-odbij", id: msg.id } satisfies Wire, from);
            return;
          }
          const hrpe: Hrpe = [
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[0] ?? 0))),
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[1] ?? 0))),
            Math.max(0, Math.min(6, Math.floor(msg.hrpe?.[2] ?? 0))),
          ];
          setTrojac({
            id: msg.id,
            peerId: from,
            ime: msg.ime || presenceRef.current[from]?.ime || "Kauboj",
            meta: msg.meta,
            hrpe,
            ostava: uzmiOstava(msg.ostava, hrpe),
            uloga: "saveznik",
            faza: "poziv",
            naPotezu: "vodja",
            saveznikTu: true,
          });
          pushFeed(`${msg.ime} zove u jato. Meta: ${msg.meta.ime}.`);
          playSfx("attack");
          return;
        }
        if (msg.k === "trojac-prihvati") {
          const sad = trojacRef.current;
          if (!sad || sad.id !== msg.id || sad.uloga !== "vodja") return;
          setTrojac({ ...sad, faza: "igra", naPotezu: "vodja", saveznikTu: true });
          pushFeed(`${sad.ime} jaše s tobom.`);
          playSfx("button");
          return;
        }
        if (msg.k === "trojac-odbij") {
          const sad = trojacRef.current;
          if (!sad || sad.id !== msg.id) return;
          setTrojac(null);
          pushFeed("Jato se raspalo. Jašeš sam.");
          playSfx("button");
          return;
        }
        if (msg.k === "trojac-potez") {
          const sad = trojacRef.current;
          if (!sad || sad.id !== msg.id || sad.faza !== "igra") return;
          const potez: NimPotez = { hrpa: msg.hrpa, skini: msg.skini };
          if (!jeLegalniPotez(sad.hrpe, potez)) return;
          const next = primijeniPotez(sad.hrpe, potez);
          if (jeTerminal(next)) {
            setTrojac({ ...sad, hrpe: next, faza: "kraj", pobjednik: msg.tko });
            if (msg.tko === sad.uloga) {
              const loot = plijenPohoda(sad.ostava, 4, useGameStore.getState().konjiDuznost.rad);
              if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
              playSfx("collect");
              flash("rgba(198, 224, 90, 0.4)");
            } else {
              playSfx("skull");
              shake("hard");
            }
            return;
          }
          const naPotezu = sljedeciTrojac(msg.tko, sad.saveznikTu);
          setTrojac({ ...sad, hrpe: next, naPotezu });
          playSfx(msg.tko === "serif" ? "button" : "attack");
          return;
        }
        if (msg.k === "trojac-bjezi") {
          const sad = trojacRef.current;
          if (!sad || sad.id !== msg.id || sad.faza === "kraj") return;
          if (sad.faza !== "igra") {
            setTrojac(null);
            pushFeed(`${sad.ime} nije stao u jato.`);
            return;
          }
          if (sad.uloga === "vodja") {
            setTrojac({
              ...sad,
              saveznikTu: false,
              naPotezu: sad.naPotezu === "saveznik" ? "serif" : sad.naPotezu,
            });
            pushFeed(`${sad.ime} je odjahao. Šerif ostaje.`);
          } else {
            setTrojac({ ...sad, faza: "kraj", pobjednik: "serif" });
            pushFeed("Vođa je pao. Jato se raspalo.");
          }
          playSfx("button");
        }
      }),
    [p2p.onMessage, p2p.send, pushFeed],
  );

  useEffect(() => {
    const alive = new Set(p2p.peers.map((p) => p.id));
    setPresence((prev) => {
      let dirty = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!alive.has(id)) {
          delete next[id];
          dirty = true;
        }
      }
      return dirty ? next : prev;
    });
  }, [p2p.peers]);

  useEffect(() => {
    const tick = () => {
      const s = useGameStore.getState();
      const packet: Presence = {
        k: "p",
        ime: s.imeIgraca || "Kauboj",
        razina: s.igracRazina,
        zlato: Math.floor(s.zlato),
        drvo: Math.floor(s.resursi.drvo),
        kamen: Math.floor(s.resursi.kamen),
        zeljezo: Math.floor(s.resursi.zeljezo),
        stitovi: s.stitovi,
        jahanje: s.konjiDuznost.jahanje,
        ophodnja: s.konjiDuznost.ophodnja,
        ljudi: s.stanovnici,
        konji: s.konjiBroj,
        mood: raspolozenjeKaube(
          kaubaOd({
            gradevine: s.gradevine,
            stanovnici: s.stanovnici,
            zamjenici: s.zamjenici,
            konjiBroj: s.konjiBroj,
            konjiDuznost: s.konjiDuznost,
            sijenoDo: s.sijenoDo,
            kisaDo: s.kisaDo,
            govedaBroj: s.govedaBroj,
            govedaDuznost: s.govedaDuznost,
          }),
        ).id,
        kat: kategorijaKaube(s.stanovnici).naziv,
      };
      p2p.broadcast(packet);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [p2p.broadcast]);

  useEffect(() => {
    let last: string | null = null;
    return useSlotStore.subscribe((s) => {
      const tip = s.winCelebration;
      if (tip === last) return;
      last = tip;
      if (tip !== "win" && tip !== "jackpot") return;
      const zlato = s.dobitakNaCekanju?.zlato ?? 0;
      if (zlato <= 0) return;
      const imeNow = useGameStore.getState().imeIgraca || "Kauboj";
      p2p.send({ k: "win", ime: imeNow, zlato, fx: tip } satisfies Wire);
    });
  }, [p2p.send]);

  const cowboys = useMemo<LiveCowboy[]>(() => {
    return p2p.peers.slice(0, 8).map((peer) => {
      const p = presence[peer.id];
      return {
        id: peer.id,
        ime: p?.ime || peer.name || "Kauboj",
        razina: p?.razina ?? 1,
        zlato: p?.zlato ?? 0,
        drvo: p?.drvo ?? 0,
        kamen: p?.kamen ?? 0,
        zeljezo: p?.zeljezo ?? 0,
        stitovi: p?.stitovi ?? 0,
        jahanje: p?.jahanje ?? 0,
        ophodnja: p?.ophodnja ?? 0,
        connected: peer.connectionState === "connected",
        rttMs: peer.rttMs,
        failed: peer.connectionState === "failed",
        ljudi: p?.ljudi ?? 0,
        konji: p?.konji ?? 0,
        mood: p?.mood ?? "",
        kat: p?.kat ?? "",
      };
    });
  }, [p2p.peers, presence]);

  const sendChat = useCallback(
    (text: string) => {
      const t = text.trim().slice(0, 48);
      if (!t) return;
      p2p.send({ k: "chat", text: t } satisfies Wire);
      pushFeed(`Ti: ${t}`);
    },
    [p2p, pushFeed],
  );

  const napad = useCallback(
    (peerId: string) => {
      const imeNow = useGameStore.getState().imeIgraca || "Kauboj";
      p2p.send({ k: "napad", ime: imeNow } satisfies Wire, peerId);
    },
    [p2p],
  );

  const dar = useCallback(
    (peerId: string, sto: "drvo" | "zlato" = "drvo") => {
      const s = useGameStore.getState();
      if (sto === "zlato") {
        if (s.zlato < 8) {
          useGameStore.setState({ poruka: "Nemaš 8 zlata za poslati." });
          return;
        }
        useGameStore.setState({ zlato: s.zlato - 8, poruka: "Zlato jaše u drugi tabor." });
        const imeNow = s.imeIgraca || "Kauboj";
        p2p.send({ k: "dar", ime: imeNow, drvo: 0, zlato: 8 } satisfies Wire, peerId);
        pushFeed("Poslao si zlato.");
        playSfx("collect");
        return;
      }
      if (s.resursi.drvo < 20) {
        useGameStore.setState({ poruka: "Nemaš 20 drva za poslati." });
        return;
      }
      useGameStore.setState({
        resursi: { ...s.resursi, drvo: s.resursi.drvo - 20 },
        poruka: "Drvo jaše u drugi tabor.",
      });
      const imeNow = s.imeIgraca || "Kauboj";
      p2p.send({ k: "dar", ime: imeNow, drvo: 20, zlato: 0 } satisfies Wire, peerId);
      pushFeed("Poslao si drvo.");
      playSfx("collect");
    },
    [p2p, pushFeed],
  );

  const pozoviPohod = useCallback(
    (peerId: string, imePeer: string, hrpe: Hrpe) => {
      const id = noviPohodId();
      const s = useGameStore.getState();
      const imeNow = s.imeIgraca || "Kauboj";
      const peer = presenceRef.current[peerId];
      const napadacPrvi = tkoIdePrvi(s.konjiDuznost.jahanje, peer?.ophodnja ?? 0) === "igrac";
      p2p.send(
        { k: "pohod-poziv", id, ime: imeNow, hrpe, jahanje: s.konjiDuznost.jahanje } satisfies Wire,
        peerId,
      );
      setPohod({
        id,
        peerId,
        ime: imePeer,
        hrpe,
        ostava: uzmiOstava(peer, hrpe),
        uloga: "napadac",
        faza: "ceka",
        naPotezu: napadacPrvi,
        napadacPrvi,
      });
      pushFeed(`Juriš na ${imePeer}.`);
      playSfx("attack");
      return id;
    },
    [p2p, pushFeed],
  );

  const prihvatiPohod = useCallback(() => {
    const sad = pohodRef.current;
    if (!sad || sad.uloga !== "branitelj" || sad.faza !== "poziv") return;
    p2p.send(
      { k: "pohod-prihvati", id: sad.id, napadacPrvi: sad.napadacPrvi } satisfies Wire,
      sad.peerId,
    );
    setPohod({ ...sad, faza: "igra", naPotezu: !sad.napadacPrvi });
    playSfx("button");
    useSlotStore.getState().setRaidAktivan(true);
  }, [p2p]);

  const pustiSerifa = useCallback(() => {
    const sad = pohodRef.current;
    if (!sad || sad.uloga !== "branitelj" || sad.faza !== "poziv") return;
    p2p.send({ k: "pohod-serif", id: sad.id } satisfies Wire, sad.peerId);
    setPohod(null);
    pushFeed("Šerif stane na ulicu.");
    playSfx("button");
  }, [p2p, pushFeed]);

  const odbijPohod = useCallback(() => {
    const sad = pohodRef.current;
    if (!sad) return;
    p2p.send({ k: "pohod-odbij", id: sad.id } satisfies Wire, sad.peerId);
    setPohod(null);
  }, [p2p]);

  const bjeziPohod = useCallback(() => {
    const sad = pohodRef.current;
    if (!sad || sad.faza === "kraj") return;
    p2p.send({ k: "pohod-bjezi", id: sad.id } satisfies Wire, sad.peerId);
    setPohod({ ...sad, faza: "kraj", naPotezu: false, pobjeda: false });
    pushFeed("Pobjegao si. Prašina iza kopita.");
    playSfx("button");
  }, [p2p, pushFeed]);

  const igrajPotez = useCallback(
    (potez: NimPotez) => {
      const sad = pohodRef.current;
      if (!sad || sad.faza !== "igra" || !sad.naPotezu) return false;
      if (!jeLegalniPotez(sad.hrpe, potez)) return false;
      const next = primijeniPotez(sad.hrpe, potez);
      p2p.send(
        { k: "pohod-potez", id: sad.id, hrpa: potez.hrpa, skini: potez.skini } satisfies Wire,
        sad.peerId,
      );
      if (jeTerminal(next)) {
        const pobjeda = sad.uloga === "napadac";
        setPohod({ ...sad, hrpe: next, faza: "kraj", naPotezu: false, pobjeda });
        if (pobjeda) {
          const peer = presenceRef.current[sad.peerId];
          const loot = plijenPohoda(
            sad.ostava,
            peer?.razina ?? 1,
            useGameStore.getState().konjiDuznost.rad,
          );
          if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
          playSfx("collect");
          flash("rgba(198, 224, 90, 0.4)");
        } else {
          playSfx("skull");
        }
        return true;
      }
      setPohod({ ...sad, hrpe: next, naPotezu: false });
      return true;
    },
    [p2p],
  );

  const pozoviPosjet = useCallback(
    (peerId: string, imePeer: string) => {
      if (posjetRef.current) {
        useGameStore.setState({ poruka: "Već jašeš u tabor." });
        return;
      }
      const id = noviPohodId();
      const imeNow = useGameStore.getState().imeIgraca || "Kauboj";
      p2p.send({ k: "posjet-poziv", id, ime: imeNow } satisfies Wire, peerId);
      setPosjet({
        id,
        peerId,
        ime: imePeer,
        uloga: "gost",
        faza: "ceka",
        tabor: null,
        cin: null,
      });
      pushFeed(`Jašeš u tabor ${imePeer}.`);
      playSfx("button");
    },
    [p2p, pushFeed],
  );

  const prihvatiPosjet = useCallback(() => {
    const sad = posjetRef.current;
    if (!sad || sad.uloga !== "domacin" || sad.faza !== "poziv") return;
    const tabor = snimkaTabora();
    p2p.send({ k: "posjet-prihvati", id: sad.id, tabor } satisfies Wire, sad.peerId);
    setPosjet({ ...sad, faza: "unutra", tabor });
    playSfx("collect");
    useGameStore.setState({ poruka: `${sad.ime} ulazi u tabor.` });
  }, [p2p]);

  const odbijPosjet = useCallback(() => {
    const sad = posjetRef.current;
    if (!sad) return;
    p2p.send({ k: "posjet-odbij", id: sad.id } satisfies Wire, sad.peerId);
    setPosjet(null);
  }, [p2p]);

  const odjasiPosjet = useCallback(() => {
    const sad = posjetRef.current;
    if (!sad) return;
    p2p.send({ k: "posjet-kraj", id: sad.id } satisfies Wire, sad.peerId);
    setPosjet(null);
    pushFeed("Odjahao si.");
    playSfx("button");
  }, [p2p, pushFeed]);

  const cinPosjet = useCallback(
    (cin: PosjetCin) => {
      const sad = posjetRef.current;
      if (!sad || sad.faza !== "unutra") return;
      const s = useGameStore.getState();
      const imeNow = s.imeIgraca || "Kauboj";
      if (cin === "pozdrav") {
        p2p.send({ k: "posjet-cin", id: sad.id, cin, ime: imeNow } satisfies Wire, sad.peerId);
        setPosjet({ ...sad, cin: "Skidaš šešir." });
        pushFeed("Pozdrav s ulice.");
        playSfx("button");
        return;
      }
      if (cin === "salun") {
        if (s.zlato < 6) {
          useGameStore.setState({ poruka: "Nemaš 6 zlata za kolo." });
          return;
        }
        useGameStore.setState({ zlato: s.zlato - 6, poruka: "Plaćaš kolo u salunu." });
        p2p.send({ k: "posjet-cin", id: sad.id, cin, ime: imeNow, zlato: 4 } satisfies Wire, sad.peerId);
        setPosjet({ ...sad, cin: "Kolo u salunu." });
        pushFeed("Kolo u salunu.");
        playSfx("collect");
        return;
      }
      if (cin === "pomoc") {
        if (s.resursi.drvo >= 15) {
          useGameStore.setState({
            resursi: { ...s.resursi, drvo: s.resursi.drvo - 15 },
            poruka: "Nosiš drvo u tuđi tabor.",
          });
          p2p.send({ k: "posjet-cin", id: sad.id, cin, ime: imeNow, drvo: 15 } satisfies Wire, sad.peerId);
        } else if (s.zlato >= 6) {
          useGameStore.setState({ zlato: s.zlato - 6, poruka: "Ostavljaš zlato na stolu." });
          p2p.send({ k: "posjet-cin", id: sad.id, cin, ime: imeNow, zlato: 6 } satisfies Wire, sad.peerId);
        } else {
          useGameStore.setState({ poruka: "Prazne ruke. Nemaš drvo ni zlato." });
          return;
        }
        setPosjet({ ...sad, cin: "Ruke pomažu." });
        pushFeed("Pomažeš taboru.");
        playSfx("build");
        return;
      }
      if (cin === "izdaj") {
        const ostava = sad.tabor
          ? { drvo: sad.tabor.drvo, kamen: sad.tabor.kamen, zeljezo: sad.tabor.zeljezo }
          : uzmiOstava(presenceRef.current[sad.peerId]);
        p2p.send({ k: "posjet-cin", id: sad.id, cin, ime: imeNow } satisfies Wire, sad.peerId);
        setPosjet(null);
        pushFeed("Nož iza leđa.");
        playSfx("attack");
        const h = hrpeIzResursa(ostava);
        if (h[0] + h[1] + h[2] <= 0) {
          useGameStore.setState({ poruka: `${sad.ime}: ostava prazna. Izdaja bez plijena.` });
          return;
        }
        pozoviPohod(sad.peerId, sad.ime, h);
        useSlotStore.getState().setRaidAktivan(true);
      }
    },
    [p2p, pushFeed, pozoviPohod],
  );

  const pozoviTrojac = useCallback(
    (peerId: string, imePeer: string, meta?: TrojacMeta, ostava?: { drvo: number; kamen: number; zeljezo: number }) => {
      if (trojacRef.current && trojacRef.current.faza !== "kraj") {
        useGameStore.setState({ poruka: "Već jašeš u jatu." });
        return;
      }
      const pack = metaZaTrojac();
      const m = meta ?? pack.meta;
      const o = ostava ?? pack.ostava;
      const hrpe = hrpeIzResursa(o);
      const id = noviPohodId();
      const imeNow = useGameStore.getState().imeIgraca || "Kauboj";
      p2p.send({ k: "trojac-poziv", id, ime: imeNow, hrpe, meta: m, ostava: o } satisfies Wire, peerId);
      setTrojac({
        id,
        peerId,
        ime: imePeer,
        meta: m,
        hrpe,
        ostava: o,
        uloga: "vodja",
        faza: "ceka",
        naPotezu: "vodja",
        saveznikTu: true,
      });
      pushFeed(`Zoveš ${imePeer} na ${m.ime}.`);
      playSfx("attack");
    },
    [p2p, pushFeed],
  );

  const prihvatiTrojac = useCallback(() => {
    const sad = trojacRef.current;
    if (!sad || sad.uloga !== "saveznik" || sad.faza !== "poziv") return;
    p2p.send({ k: "trojac-prihvati", id: sad.id } satisfies Wire, sad.peerId);
    setTrojac({ ...sad, faza: "igra", naPotezu: "vodja" });
    playSfx("button");
  }, [p2p]);

  const odbijTrojac = useCallback(() => {
    const sad = trojacRef.current;
    if (!sad) return;
    p2p.send({ k: "trojac-odbij", id: sad.id } satisfies Wire, sad.peerId);
    setTrojac(null);
  }, [p2p]);

  const bjeziTrojac = useCallback(() => {
    const sad = trojacRef.current;
    if (!sad || sad.faza === "kraj") return;
    p2p.send({ k: "trojac-bjezi", id: sad.id } satisfies Wire, sad.peerId);
    setTrojac({ ...sad, faza: "kraj", pobjednik: "serif" });
    pushFeed("Odjahao si iz jata.");
    playSfx("button");
  }, [p2p, pushFeed]);

  const igrajTrojac = useCallback(
    (potez: NimPotez) => {
      const sad = trojacRef.current;
      if (!sad || sad.faza !== "igra") return false;
      const moj: TrojacTko = sad.uloga;
      if (sad.naPotezu !== moj) return false;
      if (!jeLegalniPotez(sad.hrpe, potez)) return false;
      const next = primijeniPotez(sad.hrpe, potez);
      p2p.send(
        { k: "trojac-potez", id: sad.id, hrpa: potez.hrpa, skini: potez.skini, tko: moj } satisfies Wire,
        sad.peerId,
      );
      if (jeTerminal(next)) {
        setTrojac({ ...sad, hrpe: next, faza: "kraj", pobjednik: moj });
        const loot = plijenPohoda(sad.ostava, 4, useGameStore.getState().konjiDuznost.rad);
        if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
        playSfx("collect");
        flash("rgba(198, 224, 90, 0.4)");
        return true;
      }
      setTrojac({ ...sad, hrpe: next, naPotezu: sljedeciTrojac(moj, sad.saveznikTu) });
      return true;
    },
    [p2p],
  );

  useEffect(() => {
    if (!pohod || (pohod.faza !== "ceka" && pohod.faza !== "poziv")) return;
    const t = window.setTimeout(() => {
      const sad = pohodRef.current;
      if (!sad || (sad.faza !== "ceka" && sad.faza !== "poziv")) return;
      if (sad.uloga === "napadac") {
        setPohod({ ...sad, faza: "serif", naPotezu: true });
        pushFeed("Šerif stane. Ti jašeš na njega.");
      } else {
        setPohod(null);
        pushFeed("Šerif je stao na ulicu.");
      }
    }, POHOD_CEKA_MS);
    return () => window.clearTimeout(t);
  }, [pohod?.id, pohod?.faza, pushFeed]);

  useEffect(() => {
    const sad = pohodRef.current;
    if (!sad || sad.faza !== "igra") return;
    const peer = p2p.peers.find((p) => p.id === sad.peerId);
    if (peer && (peer.connectionState === "connected" || peer.connectionState === "connecting")) return;
    setPohod({ ...sad, faza: "kraj", naPotezu: false, pobjeda: true });
    if (sad.uloga === "napadac") {
      const loot = plijenPohoda(
        sad.ostava,
        presenceRef.current[sad.peerId]?.razina ?? 1,
        useGameStore.getState().konjiDuznost.rad,
      );
      if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
    }
    pushFeed(`${sad.ime} je pobjegao.`);
  }, [p2p.peers, pushFeed]);

  useEffect(() => {
    if (!posjet || (posjet.faza !== "ceka" && posjet.faza !== "poziv")) return;
    const t = window.setTimeout(() => {
      const sad = posjetRef.current;
      if (!sad || (sad.faza !== "ceka" && sad.faza !== "poziv")) return;
      setPosjet(null);
      pushFeed(sad.uloga === "gost" ? "Kapija ne pušta. Jaši dalje." : "Gost nije čekao.");
    }, POSJET_CEKA_MS);
    return () => window.clearTimeout(t);
  }, [posjet?.id, posjet?.faza, pushFeed]);

  useEffect(() => {
    if (!posjet || posjet.faza !== "unutra" || posjet.uloga !== "domacin") return;
    const tick = () => {
      const sad = posjetRef.current;
      if (!sad || sad.faza !== "unutra") return;
      p2p.send({ k: "posjet-snimka", id: sad.id, tabor: snimkaTabora() } satisfies Wire, sad.peerId);
    };
    const id = window.setInterval(tick, 6000);
    return () => window.clearInterval(id);
  }, [posjet?.id, posjet?.faza, posjet?.uloga, p2p]);

  useEffect(() => {
    if (!trojac || (trojac.faza !== "ceka" && trojac.faza !== "poziv")) return;
    const t = window.setTimeout(() => {
      const sad = trojacRef.current;
      if (!sad || (sad.faza !== "ceka" && sad.faza !== "poziv")) return;
      setTrojac(null);
      pushFeed("Jato se nije sleglo.");
    }, POHOD_CEKA_MS);
    return () => window.clearTimeout(t);
  }, [trojac?.id, trojac?.faza, pushFeed]);

  useEffect(() => {
    const sad = trojac;
    if (!sad || sad.faza !== "igra" || sad.naPotezu !== "serif" || sad.uloga !== "vodja") return;
    const delay = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 520;
    const t = window.setTimeout(() => {
      const now = trojacRef.current;
      if (!now || now.faza !== "igra" || now.naPotezu !== "serif") return;
      const p = npcPotez(now.hrpe);
      if (!p) {
        setTrojac({ ...now, faza: "kraj", pobjednik: "vodja" });
        const loot = plijenPohoda(now.ostava, 4, useGameStore.getState().konjiDuznost.rad);
        if (plijenUkupno(loot) > 0) useGameStore.getState().primiResurse(loot);
        playSfx("collect");
        return;
      }
      const next = primijeniPotez(now.hrpe, p);
      p2p.send(
        { k: "trojac-potez", id: now.id, hrpa: p.hrpa, skini: p.skini, tko: "serif" } satisfies Wire,
        now.peerId,
      );
      if (jeTerminal(next)) {
        setTrojac({ ...now, hrpe: next, faza: "kraj", pobjednik: "serif" });
        playSfx("skull");
        shake("hard");
        return;
      }
      setTrojac({ ...now, hrpe: next, naPotezu: sljedeciTrojac("serif", now.saveznikTu) });
      playSfx("button");
    }, delay);
    return () => window.clearTimeout(t);
  }, [trojac, p2p]);

  useEffect(() => {
    const sad = posjetRef.current;
    if (!sad) return;
    const peer = p2p.peers.find((p) => p.id === sad.peerId);
    if (peer && (peer.connectionState === "connected" || peer.connectionState === "connecting")) return;
    setPosjet(null);
    pushFeed(`${sad.ime} je odjahao.`);
  }, [p2p.peers, pushFeed]);

  useEffect(() => {
    const sad = trojacRef.current;
    if (!sad || sad.faza !== "igra") return;
    const peer = p2p.peers.find((p) => p.id === sad.peerId);
    if (peer && (peer.connectionState === "connected" || peer.connectionState === "connecting")) return;
    if (sad.uloga === "vodja") {
      setTrojac({ ...sad, saveznikTu: false, naPotezu: sad.naPotezu === "saveznik" ? "serif" : sad.naPotezu });
      pushFeed(`${sad.ime} je odjahao. Šerif ostaje.`);
    } else {
      setTrojac({ ...sad, faza: "kraj", pobjednik: "serif" });
      pushFeed("Vođa je pao. Jato se raspalo.");
    }
  }, [p2p.peers, pushFeed]);

  const value = useMemo<LiveApi>(
    () => ({
      joined: p2p.joined,
      room: p2p.room,
      selfId: p2p.selfId,
      cowboys,
      feed,
      ticker,
      pohod,
      posjet,
      trojac,
      joinRoom: onRoomCode,
      sendChat,
      napad,
      dar,
      pozoviPohod,
      prihvatiPohod,
      pustiSerifa,
      odbijPohod,
      bjeziPohod,
      igrajPotez,
      pozoviPosjet,
      prihvatiPosjet,
      odbijPosjet,
      odjasiPosjet,
      cinPosjet,
      pozoviTrojac,
      prihvatiTrojac,
      odbijTrojac,
      bjeziTrojac,
      igrajTrojac,
    }),
    [p2p.joined, p2p.room, p2p.selfId, cowboys, feed, ticker, pohod, posjet, trojac, onRoomCode, sendChat, napad, dar, pozoviPohod, prihvatiPohod, pustiSerifa, odbijPohod, bjeziPohod, igrajPotez, pozoviPosjet, prihvatiPosjet, odbijPosjet, odjasiPosjet, cinPosjet, pozoviTrojac, prihvatiTrojac, odbijTrojac, bjeziTrojac, igrajTrojac],
  );

  return <LiveCtx.Provider value={value}>{children}</LiveCtx.Provider>;
}

export function LiveShell({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState(() => {
    const saved = loadJSON<string>(SAVE_KEYS.room);
    return saved && /^[A-Z0-9_-]{3,12}$/.test(saved) ? saved : "BLAGO";
  });
  const join = (code: string) => {
    const next = sanitizeRoom(code);
    saveJSON(SAVE_KEYS.room, next);
    setRoomCode(next);
  };
  return (
    <LiveProvider key={roomCode} roomCode={roomCode} onRoomCode={join}>
      {children}
    </LiveProvider>
  );
}

export function useLive(): LiveApi {
  const ctx = useContext(LiveCtx);
  return (
    ctx ?? {
      joined: false,
      room: "BLAGO",
      selfId: "",
      cowboys: [],
      feed: [],
      ticker: null,
      pohod: null,
      posjet: null,
      trojac: null,
      joinRoom: () => {},
      sendChat: () => {},
      napad: () => {},
      dar: () => {},
      pozoviPohod: () => "",
      prihvatiPohod: () => {},
      pustiSerifa: () => {},
      odbijPohod: () => {},
      bjeziPohod: () => {},
      igrajPotez: () => false,
      pozoviPosjet: () => {},
      prihvatiPosjet: () => {},
      odbijPosjet: () => {},
      odjasiPosjet: () => {},
      cinPosjet: () => {},
      pozoviTrojac: () => {},
      prihvatiTrojac: () => {},
      odbijTrojac: () => {},
      bjeziTrojac: () => {},
      igrajTrojac: () => false,
    }
  );
}
