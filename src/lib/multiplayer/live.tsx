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
import { izracunajPlijen, plijenUkupno } from "@/lib/game/raids";
import { playSfx } from "@/lib/game/audio";
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
  connected: boolean;
  rttMs: number | null;
};

export type LiveFeed = { id: number; text: string; t: number };

type Presence = {
  k: "p";
  ime: string;
  razina: number;
  zlato: number;
  drvo: number;
  kamen: number;
  zeljezo: number;
  stitovi: number;
};

type Wire =
  | Presence
  | { k: "win"; ime: string; zlato: number; fx: "win" | "jackpot" }
  | { k: "chat"; text: string }
  | { k: "napad"; ime: string }
  | { k: "stit"; ime: string }
  | { k: "plijen"; ime: string; drvo: number; kamen: number; zeljezo: number };

export type LiveApi = {
  joined: boolean;
  room: string;
  selfId: string;
  cowboys: LiveCowboy[];
  feed: LiveFeed[];
  ticker: string | null;
  joinRoom: (code: string) => void;
  sendChat: (text: string) => void;
  napad: (peerId: string) => void;
};

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
        if (msg.k === "napad") {
          const gs = useGameStore.getState();
          if (gs.stitovi > 0) {
            useGameStore.setState({
              stitovi: gs.stitovi - 1,
              poruka: `${msg.ime} juriš na tabor — štit drži!`,
            });
            p2p.send({ k: "stit", ime: gs.imeIgraca || "Kauboj" } satisfies Wire, from);
            pushFeed(`${msg.ime} je udarao u tvoj štit`);
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
      };
      p2p.broadcast(packet);
    };
    tick();
    const id = window.setInterval(tick, 2000);
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
        connected: peer.connectionState === "connected",
        rttMs: peer.rttMs,
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

  const value = useMemo<LiveApi>(
    () => ({
      joined: p2p.joined,
      room: p2p.room,
      selfId: p2p.selfId,
      cowboys,
      feed,
      ticker,
      joinRoom: onRoomCode,
      sendChat,
      napad,
    }),
    [p2p.joined, p2p.room, p2p.selfId, cowboys, feed, ticker, onRoomCode, sendChat, napad],
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
      joinRoom: () => {},
      sendChat: () => {},
      napad: () => {},
    }
  );
}
