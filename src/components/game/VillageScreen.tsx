import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { BuildingCard } from "./BuildingCard";
import { IgraKarata } from "./IgraKarata";
import { UtrkaStaza } from "./UtrkaStaza";
import { MrezaSela } from "./MrezaSela";
import { LivePohod } from "./LivePohod";
import { ZidScreen } from "./ZidScreen";
import { KronikaLista } from "./KronikaLista";
import { ZGRADE, ZGRADE_SKINOVI, seloNaMaxu } from "@/lib/game/constants";
import { ART, SYMBOL_ART } from "@/lib/game/art";
import {
  kategorijaKaube,
  raspolozenjeKaube,
  hubZaZgradu,
  POTREBE_META,
  KONJ_DUZNOSTI,
  konjaKap,
  type KaubaStanje,
  type KaubaUsko,
} from "@/lib/game/economy";
import { recOsoba, govornik, naUlici, gdjeJe, ULICA_SLOTOVI, razgovor, darRec, mozeDati, danDoba, DOBA_REC, nalogOd, tkoZaNalog, recBuff, recSveBuff, recSveMane, recJahanje, tkoJaše, trebaKonja, likCrta, mozeKrupije, kaubaOd, LIK_XP_PO_LV, LIK_MAX_RAZINA, SEGRT_SKOLA, type Stanovnik, type Segrt, type DanDoba } from "@/lib/game/ljudi";
import { SUSJEDI, karavanaCilj, karavanaIsplata } from "@/lib/game/susjedi";
import { tjedanSad } from "@/lib/game/tjedan";
import { KONJ_CIJENA_DRVO, KONJ_CIJENA_ZLATO, SIJENO_ZLATO } from "@/lib/game/tuning";
import { TjedanTraka } from "./TjedanTraka";
import { LikAvatar } from "./LikAvatar";
import { IconBadge } from "./IconBadge";
import { GradnjaScena } from "./GradnjaScena";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import type { Gradevine, Gradnja, Karavana, Ostecenja, ResursId } from "@/lib/game/types";
import type { KaubaDogadaj } from "@/lib/game/dogadaji";

const LISTAK: Array<{ id: "tabor" | "mreza" | "kronika" | "uzivo" | "zid"; label: string }> = [
  { id: "tabor", label: "Tabor" },
  { id: "mreza", label: "Mreža" },
  { id: "zid", label: "Zid" },
  { id: "kronika", label: "Kronika" },
  { id: "uzivo", label: "Uživo" },
];

const HUB_REC: Record<KaubaUsko, string> = {
  krov: "Kuća i zgrada pod istim krovom",
  jelo: "Lov, mesnica, pekarna i farma",
  zabava: "Salun i faro",
  voda: "Bunar i mlin na vodi",
  posao: "Pilana, kamenolom, rudnik i trgovina",
  red: "Šerifov ured i banka. Red u kaubi.",
  konji: "Staja, korali i staza. Reci konju što radi.",
  zdravlje: "Ordinacija. Rana ne čeka.",
};

function skociNaZgradu(id: keyof Gradevine) {
  const el = document.getElementById(`zgrada-${id}`);
  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function VillageScreen() {
  const [listak, setListak] = useState<"tabor" | "mreza" | "kronika" | "uzivo" | "zid">("tabor");
  const [fokus, setFokus] = useState<KaubaUsko>("krov");
  const [odabranId, setOdabranId] = useState<string | null>(null);
  const [doba, setDoba] = useState<DanDoba>(() => danDoba());
  useEffect(() => {
    const sync = () => setDoba(danDoba());
    sync();
    const t = window.setInterval(sync, 20000);
    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
  const aktivniSkin = useGameStore((s) => s.aktivniSkin);
  const stanovnici = useGameStore((s) => s.stanovnici);
  const ljudiPopis = useGameStore((s) => s.ljudi);
  const gradnje = useGameStore((s) => s.gradnje);
  const segrti = useGameStore((s) => s.segrti);
  const zamjenici = useGameStore((s) => s.zamjenici);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const konjiDuznost = useGameStore((s) => s.konjiDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const dogadaj = useGameStore((s) => s.dogadaj);
  const karavana = useGameStore((s) => s.karavana);
  const zlato = useGameStore((s) => s.zlato);
  const resursi = useGameStore((s) => s.resursi);
  const dajLiku = useGameStore((s) => s.dajLiku);
  const rijesiDogadaj = useGameStore((s) => s.rijesiDogadaj);
  const postaviKrupija = useGameStore((s) => s.postaviKrupija);
  const faroKrupije = useGameStore((s) => s.faroKrupije);
  const misije = useGameStore((s) => s.misije);
  const jutro = useGameStore((s) => s.jutro);
  const skin = ZGRADE_SKINOVI.find((s) => s.id === aktivniSkin) ?? ZGRADE_SKINOVI[0]!;
  const gori = Object.values(ostecenja).some(Boolean);
  const kauba = kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo });
  const kat = kategorijaKaube(kauba.ljudi);
  const mood = raspolozenjeKaube(kauba);
  const krov = POTREBE_META.find((p) => p.id === fokus) ?? POTREBE_META[0]!;
  const skupina = ZGRADE.filter((z) => krov.zgrade.includes(z.id));
  const sviLikovi = ljudiPopis.concat(segrti).concat(zamjenici);
  const tkoGovori =
    sviLikovi.find((p) => p.id === odabranId) ??
    (doba === "noc" ? ljudiPopis.find((p) => p.posao === "Šerif") : null) ??
    govornik(ljudiPopis, mood.id, mood.usko);
  const ulica = naUlici(sviLikovi, gradevine, gradnje, ostecenja, doba, karavana);
  const jase = tkoJaše(sviLikovi, gradevine, ostecenja, konjiDuznost);
  const tkoGdje = tkoGovori ? gdjeJe(tkoGovori, gradevine, gradnje, ostecenja, doba, karavana, sviLikovi) : null;
  const tkoGovor = tkoGovori
    ? razgovor(tkoGovori, mood.id, tkoGdje?.mjesto === "zgrada", tkoGdje?.zgrada, doba)
    : null;

  const odaberiHub = (id: KaubaUsko) => {
    playSfx("button");
    setFokus(id);
    if (listak === "kronika" || listak === "uzivo" || listak === "zid") setListak("tabor");
  };

  return (
    <div className="flex min-h-full flex-col">
      {gori && (
        <button
          type="button"
          onClick={() => setRaidAktivan(true)}
          className="mx-3 mt-2 min-h-11 rounded-xl bg-ruby px-3 text-xs font-bold tracking-widest text-ink"
        >
          POHOD — nešto gori
        </button>
      )}

      <div className="px-3 pt-2">
        <div className="mb-2 flex gap-1 overflow-x-auto pb-0.5">
          {LISTAK.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                playSfx("button");
                setListak(t.id);
              }}
              className={cn(
                "min-h-9 shrink-0 rounded-full px-3 text-[11px] font-bold tracking-wide uppercase transition-[background,color,transform] duration-200 ease-out active:scale-[0.96]",
                listak === t.id ? "bg-gold text-void" : "border border-line bg-panel text-dim",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {listak === "mreza" ? (
        <div className="listak-ulaz px-3 pb-8">
          <MrezaSela
            velika
            onHub={odaberiHub}
            onZgrada={(id) => {
              setListak("tabor");
              window.setTimeout(() => skociNaZgradu(id), 40);
            }}
          />
        </div>
      ) : listak === "zid" ? (
        <div className="listak-ulaz px-3 pb-8 pt-1">
          {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}
          <ZidScreen />
        </div>
      ) : listak === "kronika" ? (
        <div className="listak-ulaz px-3 pb-8 pt-1">
          {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}
          <KronikaLista />
        </div>
      ) : listak === "uzivo" ? (
        <div className="listak-ulaz px-3 pb-8 pt-1">
          {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}
          <LivePohod />
        </div>
      ) : (
        <>
      <section
        className={cn(
          "kauba-hero relative w-full overflow-hidden",
          `kauba-mood-${mood.id}`,
          `kauba-doba-${doba}`,
          gori && "kauba-mood-gori",
          gradnje.length > 0 && "kauba-hero-gradi",
        )}
        data-mood={mood.id}
        data-lock-pan
        onPointerDown={(e) => e.stopPropagation()}
        style={{ ["--skin-filter" as string]: skin.nijansa }}
      >
        <img
          src={ART.seloPoster}
          alt=""
          draggable={false}
          className="kauba-hero-still"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: skin.boja, mixBlendMode: "color", opacity: Math.min(0.08, skin.koprena) }}
        />
        <div className="kauba-mood-veil pointer-events-none absolute inset-0" aria-hidden />
        <div className="kauba-doba-veil pointer-events-none absolute inset-0" aria-hidden />
        <KaubaAmbient doba={doba} gori={gori} />
        <SeloRast
          gradevine={gradevine}
          ostecenja={ostecenja}
          gradnje={gradnje}
          karavana={karavana}
          ljudi={ljudiPopis}
          segrti={segrti}
          doba={doba}
          onZnak={(id) => {
            const hub = hubZaZgradu(id);
            if (hub) odaberiHub(hub);
            window.setTimeout(() => skociNaZgradu(id), 40);
          }}
        />

        <div className="kauba-hero-platno relative w-full overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] bg-gradient-to-b from-void/80 via-void/35 to-transparent px-3 pb-10 pt-2">
            <p className="text-[11px] font-bold tracking-[0.28em] text-gold uppercase" style={{ color: skin.boja }}>
              {kat.naziv} · {ljudiPopis.length} · {DOBA_REC[doba]}
            </p>
          </div>
          {ulica.length === 0 && (
          <button
            type="button"
            className="kauba-mood-rec"
            onClick={() => {
              playSfx("button");
              if (mood.usko) odaberiHub(mood.usko);
            }}
          >
            {tkoGovor?.rec ?? (tkoGovori ? recOsoba(tkoGovori, mood.id) : mood.rec)}
          </button>
          )}
        </div>
        <SeloUlica
          ljudi={ulica}
          mood={mood.id}
          doba={doba}
          odabranId={odabranId}
          jase={jase}
          onLik={(p) => {
            playSfx("button");
            setOdabranId(p.id);
            odaberiHub(p.hub);
          }}
        />
      </section>

      <div className="px-3 pb-8 pt-2">
        {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}
        <div className="ljudi-traka mb-2 flex gap-1.5 overflow-x-auto">
          {sviLikovi.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.ime}
              onClick={() => {
                playSfx("button");
                setOdabranId(p.id);
                odaberiHub(p.hub);
              }}
              className={cn(
                "kauba-chip-avatar size-11 shrink-0",
                odabranId === p.id ? "ring-2 ring-gold kauba-chip-odabran" : "ring-1 ring-line",
                gdjeJe(p, gradevine, gradnje, ostecenja, doba, karavana, sviLikovi).mjesto !== "ulica" && "opacity-70",
              )}
            >
              <LikAvatar p={p} mood={mood.id} jaše={jase.has(p.id)} />
            </button>
          ))}
        </div>
        {tkoGovori && tkoGovor && (
          <LikKartica
            p={tkoGovori}
            rec={(() => {
              const učenik = segrti.find((x) => x.id === tkoGovori.id);
              if (učenik && !učenik.spreman) {
                return `Uči kod Ive. Još ${Math.max(1, SEGRT_SKOLA - učenik.skola)} posla.`;
              }
              return jutro.find((j) => j.likId === tkoGovori.id && !j.uzeto)?.rec ?? tkoGovor.rec;
            })()}
            dar={tkoGovori.posao === "Šegrt" ? undefined : tkoGovor.dar}
            mood={mood.id}
            moze={!!tkoGovor.dar && mozeDati(tkoGovor.dar, zlato, resursi)}
            nalog={misije.find((m) => m.trenutno < m.cilj && (m.likId === tkoGovori.id || tkoZaNalog(ljudiPopis, m.tip)?.id === tkoGovori.id))}
            jaše={jase.has(tkoGovori.id)}
            crta={likCrta(tkoGovori)}
            krupije={mozeKrupije(tkoGovori)}
            jeKrupije={faroKrupije === tkoGovori.id}
            onHub={() => odaberiHub(tkoGovori.hub)}
            onDaj={() => dajLiku(tkoGovori.id)}
            onKrupije={() => postaviKrupija(faroKrupije === tkoGovori.id ? null : tkoGovori.id)}
          />
        )}
        <KaubaPotrebe kauba={kauba} aktivna={fokus} onPotreba={odaberiHub} />

        {listak === "tabor" && (
          <div key={fokus} className="hub-ulaz">
            <p className="krov-greda mb-2">{HUB_REC[fokus]}</p>
            {fokus === "zdravlje" && <OrdinacijaKartica />}
            {fokus === "posao" && <TrgovinaKartica />}
            {fokus === "red" && <BankaKartica />}
            {fokus === "konji" && (
              <>
                <KonjiKartica />
                <UtrkaStaza />
              </>
            )}
            {skupina.map((z, i) => (
              <div key={z.id} className="hub-kartica" style={{ animationDelay: `${i * 70}ms` }}>
                <BuildingCard zgrada={z} />
              </div>
            ))}
            {fokus === "zabava" && (gradevine.salun || 0) > 0 && <IgraKarata />}
            {fokus === "krov" && (
              <>
                <TjedanTraka />
                <KaravanaKartica />
                <KrunidbaKartica />
              </>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function KaubaAmbient({ doba, gori }: { doba: DanDoba; gori: boolean }) {
  return (
    <div className="kauba-ambient" aria-hidden>
      <span className="kauba-oblak" />
      <span className="kauba-oblak kauba-oblak-2" />
      {doba !== "noc" && (
        <>
          <span className="kauba-ptica" />
          <span className="kauba-ptica kauba-ptica-2" />
        </>
      )}
      {doba === "noc" && <span className="kauba-zvijezde" />}
      <span className="kauba-prasina-ambijent" />
      {gori && <span className="kauba-vatra" />}
    </div>
  );
}

const SELO_ZNAKOVI: Array<{
  id: keyof Gradevine;
  x: number;
  y: number;
  znak: "dim" | "svjetlo" | "kuca" | "kolo" | "zvezda" | "voda" | "logor" | "konj" | "kriz" | "torba" | "seif" | "klasa";
  od?: number;
}> = [
  { id: "staja", x: 6, y: 50, znak: "konj" },
  { id: "korali", x: 2, y: 42, znak: "konj" },
  { id: "staza", x: 4, y: 34, znak: "konj" },
  { id: "farma", x: 10, y: 72, znak: "klasa" },
  { id: "lov", x: 8, y: 62, znak: "logor" },
  { id: "kuca", x: 16, y: 58, znak: "kuca", od: 1 },
  { id: "kuca", x: 21, y: 54, znak: "kuca", od: 3 },
  { id: "salun", x: 28, y: 48, znak: "svjetlo" },
  { id: "salun", x: 32, y: 51, znak: "svjetlo" },
  { id: "trgovina", x: 38, y: 42, znak: "torba" },
  { id: "mesnica", x: 36, y: 50, znak: "dim" },
  { id: "ured", x: 42, y: 44, znak: "zvezda" },
  { id: "banka", x: 48, y: 36, znak: "seif" },
  { id: "bunar", x: 48, y: 64, znak: "voda" },
  { id: "ordinacija", x: 56, y: 34, znak: "kriz" },
  { id: "pekara", x: 58, y: 50, znak: "dim" },
  { id: "kuca", x: 63, y: 52, znak: "kuca", od: 2 },
  { id: "blok", x: 54, y: 46, znak: "kuca", od: 1 },
  { id: "pilana", x: 71, y: 36, znak: "dim" },
  { id: "mlin", x: 78, y: 40, znak: "kolo" },
  { id: "kamenolom", x: 86, y: 30, znak: "dim" },
  { id: "rudnik", x: 91, y: 26, znak: "dim" },
];

function SeloRast({
  gradevine,
  ostecenja,
  gradnje,
  karavana,
  ljudi,
  segrti,
  doba,
  onZnak,
}: {
  gradevine: Gradevine;
  ostecenja: Ostecenja;
  gradnje: Gradnja[];
  karavana: Karavana | null;
  ljudi: Stanovnik[];
  segrti: Segrt[];
  doba: DanDoba;
  onZnak: (id: keyof Gradevine) => void;
}) {
  return (
    <div className="selo-rast pointer-events-none absolute inset-0 z-[3]">
      {SELO_ZNAKOVI.map((z, i) => {
        const lv = gradevine[z.id] || 0;
        if (lv < (z.od ?? 1) && !gradnje.some((g) => g.zgrada === z.id)) return null;
        const gori = !!ostecenja[z.id];
        return (
          <button
            key={`${z.id}-${z.znak}-${i}`}
            type="button"
            aria-label={z.id}
            onClick={() => {
              playSfx("button");
              onZnak(z.id);
            }}
            className={cn(
              "selo-znak pointer-events-auto",
              `selo-znak-${z.znak}`,
              gori && "selo-znak-gori",
              doba === "noc" && z.znak === "svjetlo" && "selo-znak-noc",
            )}
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            {z.znak === "kuca" && (
              <svg viewBox="0 0 40 32" className="selo-kuca-svg" aria-hidden>
                <polygon points="2,14 20,2 38,14" fill="#2a160c" />
                <rect x="6" y="14" width="28" height="16" fill="#3d2416" />
                <rect x="16" y="20" width="8" height="10" fill="#120806" />
              </svg>
            )}
            {z.znak === "dim" && <span className="selo-dim" />}
            {z.znak === "svjetlo" && <span className="selo-svjetlo" />}
            {z.znak === "zvezda" && <span className="selo-zvezda">★</span>}
            {z.znak === "voda" && <span className="selo-voda" />}
            {z.znak === "kolo" && <span className="selo-kolo" />}
            {z.znak === "logor" && <span className="selo-logor" />}
            {z.znak === "konj" && <span className="selo-konj" />}
            {z.znak === "kriz" && <span className="selo-kriz">†</span>}
            {z.znak === "torba" && <span className="selo-torba" />}
            {z.znak === "seif" && <span className="selo-seif" />}
            {z.znak === "klasa" && <span className="selo-klasa" />}
          </button>
        );
      })}
      {gradnje.map((g) => {
        const mjesto =
          SELO_ZNAKOVI.find((z) => z.id === g.zgrada) ??
          (g.zgrada === "karte" ? SELO_ZNAKOVI.find((z) => z.id === "salun") : undefined);
        if (!mjesto) return null;
        const tko = [...ljudi, ...segrti].find((p) => p.id === g.majstorId) ?? null;
        const ivoRadi = ljudi.some((p) => p.posao === "Građevinac" && p.id === g.majstorId);
        const učenici = ivoRadi ? segrti.filter((p) => !p.spreman) : [];
        return (
          <div key={g.zgrada} className="selo-gradnja" style={{ left: `${mjesto.x}%`, top: `${mjesto.y}%` }}>
            <GradnjaScena
              majstor={tko}
              segrti={učenici}
              start={g.start}
              kraj={g.kraj}
              rec={tko ? `${tko.ime} diže` : "Diže se"}
            />
          </div>
        );
      })}
      {karavana && (
        <div className="selo-karavana" aria-hidden>
          <span className="selo-kola" />
          <span className="selo-karavana-rec">{karavana.vozacIme} → {karavana.ciljIme}</span>
        </div>
      )}
    </div>
  );
}

function KrunidbaKartica() {
  const [da, setDa] = useState(false);
  const gradevine = useGameStore((s) => s.gradevine);
  const prestige = useGameStore((s) => s.prestigeRazina);
  const krunjenja = useGameStore((s) => s.krunjenja);
  const izvrsi = useGameStore((s) => s.izvrsiPrestige);
  if (!seloNaMaxu(gradevine)) return null;
  return (
    <article className="mb-3 rounded-2xl border border-prestige bg-prestige/15 p-4">
      <p className="text-[10px] font-bold tracking-[0.22em] text-prestige uppercase">Krunidba</p>
      <p className="mt-1 text-sm font-bold text-ink">Selo je puno. Dalje se ne diže.</p>
      <p className="mt-1 text-xs font-bold text-ink/70">
        Kruna ostaje. Dobiješ jedno krunjenje za alate. Kauba kreće iznova.
        {krunjenja > 0 ? ` Slobodno ${krunjenja}.` : prestige > 0 ? ` Imaš ${prestige}.` : ""}
      </p>
      <button
        type="button"
        onClick={() => {
          playSfx("button");
          if (!da) {
            setDa(true);
            return;
          }
          playSfx("jackpot");
          izvrsi();
          setDa(false);
        }}
        className="mt-3 min-h-11 w-full rounded-xl bg-prestige text-xs font-bold tracking-widest text-void uppercase"
      >
        {da ? "Stvarno kruni" : "Kruni kaubu"}
      </button>
    </article>
  );
}

function KaravanaKartica() {
  const karavana = useGameStore((s) => s.karavana);
  const resursi = useGameStore((s) => s.resursi);
  const posalji = useGameStore((s) => s.posaljiKaravanu);
  const [cilj, setCilj] = useState(SUSJEDI[0]!.uid);
  const [res, setRes] = useState<"drvo" | "kamen" | "zeljezo">("drvo");
  const [lot, setLot] = useState(10);
  const [sad, setSad] = useState(() => Date.now());
  useEffect(() => {
    if (!karavana) return;
    setSad(Date.now());
    const t = window.setInterval(() => setSad(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [karavana]);
  const ostalo = karavana ? Math.max(0, Math.ceil((karavana.kraj - sad) / 1000)) : 0;
  const ima = Math.floor(resursi[res]);
  const ponuda = karavanaCilj(cilj);
  const sajam = tjedanSad().vrsta === "sajam";
  const pregled = karavanaIsplata({ drvo: 0, kamen: 0, zeljezo: 0, [res]: lot }, sajam, cilj);
  const hoceOvo = ponuda.hoce === res;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Karavana</p>
      {karavana ? (
        <p className="mt-1 text-sm font-bold text-ink">
          {karavana.vozacIme} ide u {karavana.ciljIme} · {ostalo}s
        </p>
      ) : (
        <>
          <p className="mt-1 text-[11px] font-bold text-ink/70">{ponuda.rec}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {SUSJEDI.map((s) => (
              <button
                key={s.uid}
                type="button"
                onClick={() => {
                  playSfx("button");
                  setCilj(s.uid);
                }}
                className={cn(
                  "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                  cilj === s.uid ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
                )}
              >
                {s.kauba}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(["drvo", "kamen", "zeljezo"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playSfx("button");
                  setRes(id);
                }}
                className={cn(
                  "min-h-8 rounded-full px-2.5 text-[10px] font-bold uppercase",
                  res === id ? "bg-gold text-void" : "border border-line bg-panel-2 text-dim",
                  ponuda.hoce === id && res !== id && "ring-1 ring-gold/50",
                )}
              >
                {id}
                {ponuda.hoce === id ? " · hoće" : ""}
              </button>
            ))}
            {[10, 30, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  playSfx("button");
                  setLot(n);
                }}
                className={cn(
                  "min-h-8 rounded-full px-2.5 text-[10px] font-bold",
                  lot === n ? "bg-ink text-gold" : "border border-line text-dim",
                )}
              >
                ×{n}
              </button>
            ))}
            <button
              type="button"
              disabled={ima < lot}
              onClick={() => posalji(cilj, { drvo: 0, kamen: 0, zeljezo: 0, [res]: lot })}
              className="min-h-8 rounded-full bg-gold px-3 text-[10px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
            >
              Pošalji · +{pregled.zlato} zlata
              {pregled.drvo ? ` · +${pregled.drvo} drva` : ""}
              {pregled.kamen ? ` · +${pregled.kamen} kamena` : ""}
              {pregled.zeljezo ? ` · +${pregled.zeljezo} željeza` : ""}
            </button>
          </div>
          {hoceOvo ? (
            <p className="mt-1 text-[10px] font-bold text-quest">Ovo hoće. Plaća bolje.</p>
          ) : (
            <p className="mt-1 text-[10px] font-bold text-dim">Pošalji {ponuda.hoce} pa bolje plaća.</p>
          )}
        </>
      )}
    </article>
  );
}

function SeloUlica({
  ljudi,
  mood,
  doba,
  odabranId,
  jase,
  onLik,
}: {
  ljudi: Stanovnik[];
  mood: ReturnType<typeof raspolozenjeKaube>["id"];
  doba: DanDoba;
  odabranId: string | null;
  jase: Set<string>;
  onLik: (p: Stanovnik) => void;
}) {
  const n = Math.max(0, Math.min(ULICA_SLOTOVI.length, ljudi.length));
  if (n === 0) return null;
  return (
    <div className="kauba-ulica absolute inset-0 z-[5]">
      {ljudi.slice(0, n).map((p, i) => {
        const mj = ULICA_SLOTOVI[i]!;
        const naKonju = jase.has(p.id);
        const jahanje = recJahanje(p, naKonju);
        const rec = !naKonju && trebaKonja(p) && jahanje ? jahanje : recOsoba(p, mood);
        const govori = odabranId === p.id || (!odabranId && i === 0);
        return (
          <button
            key={p.id}
            type="button"
            aria-label={`${p.ime}, ${p.posao}. ${rec}`}
            onClick={() => onLik(p)}
            className={cn(
              "kauba-lik",
              `kauba-lik-${mood}`,
              naKonju && "kauba-lik-jase",
              odabranId === p.id && "kauba-lik-odabran",
            )}
            style={{
              left: `${mj.x}%`,
              top: `${mj.y}%`,
              animationDelay: `${i * 0.22}s`,
              animationDuration: `${2.4 + (i % 3) * 0.4}s`,
            }}
          >
            {govori && <span className="kauba-balon">{rec}</span>}
            <LikAvatar p={p} mood={mood} jaše={naKonju} />
            {!naKonju && <span className="kauba-stopa" />}
            <span className="kauba-lik-ime">{p.ime}</span>
          </button>
        );
      })}
    </div>
  );
}

function LikKartica({
  p,
  rec,
  dar,
  moze,
  mood,
  nalog,
  jaše,
  crta,
  krupije,
  jeKrupije,
  onHub,
  onDaj,
  onKrupije,
}: {
  p: Stanovnik;
  rec: string;
  dar?: { zlato?: number; drvo?: number; kamen?: number; zeljezo?: number };
  moze: boolean;
  mood: string;
  nalog?: { tip: string; cilj: number } | null;
  jaše?: boolean;
  crta?: string;
  krupije?: boolean;
  jeKrupije?: boolean;
  onHub: () => void;
  onDaj: () => void;
  onKrupije?: () => void;
}) {
  const plus = recSveBuff(p);
  const minus = recSveMane(p);
  const jahanje = recJahanje(p, !!jaše);
  return (
    <article className="lik-plakat mb-2 flex w-full items-center gap-3 px-3 py-2.5">
      <button type="button" onClick={onHub} className="lik-plakat-okvir">
        <LikAvatar p={p} mood={mood} veliki jaše={!!jaše} />
      </button>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">{p.posao}</span>
        <span className="block text-base font-bold text-ink">
          {p.ime} · lv {p.razina}
          {jaše ? " · na konju" : trebaKonja(p) ? " · pješke" : recBuff(p) ? ` · ${recBuff(p)}` : ""}
        </span>
        {crta && <span className="mt-0.5 block text-[11px] font-bold text-ink/70">{crta}</span>}
        <span className="mt-0.5 block text-[12px] font-bold text-gold">{rec}</span>
        {jahanje && trebaKonja(p) && !jaše && (
          <span className="mt-0.5 block text-[11px] font-bold text-ruby">{jahanje}</span>
        )}
        {(plus.length > 0 || minus.length > 0) && (
          <span className="mt-1 flex flex-wrap gap-1">
            {plus.map((b) => (
              <span key={b} className="lik-crta lik-crta-plus">
                {b}
              </span>
            ))}
            {minus.map((b) => (
              <span key={b} className="lik-crta lik-crta-minus">
                {b}
              </span>
            ))}
          </span>
        )}
        {nalog && (
          <span className="mt-1 block text-[11px] font-bold text-quest">{nalogOd(p, nalog.tip, nalog.cilj)}</span>
        )}
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-void">
          <span
            className="block h-full rounded-full bg-gold lik-xp-traka"
            style={{
              width: `${
                p.razina >= LIK_MAX_RAZINA
                  ? 100
                  : Math.min(100, ((p.xp % LIK_XP_PO_LV) / LIK_XP_PO_LV) * 100)
              }%`,
            }}
          />
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onHub}
            className="min-h-9 rounded-lg border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink"
          >
            Idi
          </button>
          {dar && (
            <button
              type="button"
              disabled={!moze}
              onClick={onDaj}
              className="min-h-9 rounded-lg bg-gold px-3 text-[11px] font-bold text-void disabled:bg-panel-2 disabled:text-dim"
            >
              {darRec(dar)}
            </button>
          )}
          {krupije && onKrupije && (
            <button
              type="button"
              onClick={onKrupije}
              className={cn(
                "min-h-9 rounded-lg px-3 text-[11px] font-bold",
                jeKrupije ? "bg-gold text-void" : "border border-line bg-panel-2 text-ink",
              )}
            >
              {jeKrupije ? "Krupije · skini" : "Krupije"}
            </button>
          )}
        </span>
      </span>
    </article>
  );
}

function KaubaPotrebe({
  kauba,
  aktivna,
  onPotreba,
}: {
  kauba: KaubaStanje;
  aktivna: KaubaUsko;
  onPotreba: (id: KaubaUsko) => void;
}) {
  const ljudi = Math.max(0, Math.floor(kauba.ljudi));
  const veze = kauba.utjecaji.filter((u) => u.od === aktivna || u.do === aktivna).slice(0, 4);
  return (
    <div className="mb-2">
    <div className="grid grid-cols-4 gap-1">
      {POTREBE_META.map((r) => {
        const v = kauba.potrebe[r.id];
        const kap = Math.round(kauba.pokrivaju[r.id]);
        const boja = v < 0.4 ? "var(--color-ruby)" : v < 0.75 ? "var(--color-volt)" : "var(--color-xp)";
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onPotreba(r.id)}
            className={cn(
              "min-h-11 rounded-lg border px-0.5 py-1",
              aktivna === r.id ? "border-gold bg-gold/15" : "border-line bg-panel",
              v < 0.4 && "potreba-hit",
            )}
          >
            <p className="text-center text-[10px] font-bold tracking-wide text-gold uppercase">{r.naziv}</p>
            <p className="mb-1 text-center text-[10px] font-bold tabular-nums text-ink">
              {r.id === "krov"
                ? `${ljudi}/${Math.max(4, kap)}`
                : r.id === "konji" && ljudi < 8
                  ? kap > 0
                    ? `${kap} · tabor`
                    : "tabor"
                  : r.id === "zdravlje" && ljudi < 10
                    ? kap > 0
                      ? `${kap} · tabor`
                      : "tabor"
                    : `${Math.min(ljudi, kap)}/${ljudi || 0}`}
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-void">
              <div className="h-full rounded-full potreba-traka" style={{ width: `${Math.round(v * 100)}%`, backgroundColor: boja }} />
            </div>
          </button>
        );
      })}
    </div>
    {veze.length > 0 && (
      <ul className="mt-1.5 flex flex-col gap-0.5 px-0.5">
        {veze.map((u, i) => (
          <li key={`${u.od}-${u.do}-${i}`} className="text-[11px] font-bold leading-snug">
            <span className={u.predznak > 0 ? "text-xp" : "text-ruby"}>{u.predznak > 0 ? "+" : "−"}</span>
            <span className="text-gold"> {POTREBE_META.find((p) => p.id === u.od)?.naziv}</span>
            <span className="text-dim"> → {POTREBE_META.find((p) => p.id === u.do)?.naziv}</span>
            <span className="text-ink/80"> · {u.rec}</span>
          </li>
        ))}
      </ul>
    )}
    </div>
  );
}

function KonjiKartica() {
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const konjiBroj = useGameStore((s) => s.konjiBroj);
  const duznost = useGameStore((s) => s.konjiDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const kupiKonja = useGameStore((s) => s.kupiKonja);
  const prodajKonja = useGameStore((s) => s.prodajKonja);
  const pomakniKonja = useGameStore((s) => s.pomakniKonja);
  const kupiSijeno = useGameStore((s) => s.kupiSijeno);
  const [sad, setSad] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setSad(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if ((gradevine.staja || 0) < 1 || ostecenja.staja) return null;
  const kap = konjaKap(gradevine);
  const sijenoOstalo = Math.max(0, Math.ceil((sijenoDo - sad) / 1000));
  const izvor = (KONJ_DUZNOSTI.find((x) => x.id !== "jahanje" && duznost[x.id] > 0)?.id ?? "jahanje") as typeof KONJ_DUZNOSTI[number]["id"];
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Konji</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">
        {konjiBroj}/{kap} pod uzdom. Jedu i piju. Reci im što rade.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {KONJ_DUZNOSTI.map((d) => (
          <div key={d.id} className="rounded-xl border border-line bg-void/40 px-2 py-1.5">
            <p className="text-[10px] font-bold tracking-wide text-gold uppercase">{d.naziv}</p>
            <p className="text-[11px] font-bold text-ink/70">{d.rec}</p>
            <div className="mt-1 flex items-center gap-1">
              <button
                type="button"
                disabled={duznost[d.id] < 1}
                onClick={() => pomakniKonja(d.id, d.id === "jahanje" ? izvor : "jahanje")}
                className="min-h-8 min-w-8 rounded-full border border-line bg-panel-2 text-sm font-bold text-ink disabled:text-dim"
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm font-bold tabular-nums text-ink">{duznost[d.id]}</span>
              <button
                type="button"
                disabled={(d.id === "jahanje" ? izvor === "jahanje" : duznost.jahanje < 1) || konjiBroj < 1}
                onClick={() => pomakniKonja(d.id === "jahanje" ? izvor : "jahanje", d.id)}
                className="min-h-8 min-w-8 rounded-full bg-gold text-sm font-bold text-void disabled:bg-panel-2 disabled:text-dim"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={zlato < KONJ_CIJENA_ZLATO || drvo < KONJ_CIJENA_DRVO || konjiBroj >= kap}
          onClick={() => kupiKonja()}
          className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
        >
          Uzmi konja · {KONJ_CIJENA_ZLATO}g {KONJ_CIJENA_DRVO}d
        </button>
        {kap - konjiBroj >= 5 && (
          <button
            type="button"
            disabled={zlato < KONJ_CIJENA_ZLATO * 5 || drvo < KONJ_CIJENA_DRVO * 5}
            onClick={() => kupiKonja(5)}
            className="min-h-10 rounded-full border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wide text-gold uppercase disabled:border-line disabled:bg-panel-2 disabled:text-dim"
          >
            Uzmi pet · {KONJ_CIJENA_ZLATO * 5}g
          </button>
        )}
        <button
          type="button"
          disabled={konjiBroj < 1}
          onClick={prodajKonja}
          className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
        >
          Prodaj
        </button>
        <button
          type="button"
          disabled={zlato < SIJENO_ZLATO || konjiBroj < 1}
          onClick={kupiSijeno}
          className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
        >
          {sijenoOstalo > 0 ? `Sijeno ${sijenoOstalo}s` : `Sijeno · ${SIJENO_ZLATO}g`}
        </button>
      </div>
    </article>
  );
}

function EventKartica({ d, onOpcija }: { d: KaubaDogadaj; onOpcija: (id: string) => void }) {
  const naslov = d.tip === "stranac" ? "Stranac" : d.tip === "dvoboj" ? "Dvoboj" : "Salun";
  return (
    <article className="kauba-dogadaj mb-2 rounded-2xl border border-gold/70 bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">{naslov}</p>
      <p className="mt-1 text-sm font-bold text-ink">{d.rec}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.opcije.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              playSfx("button");
              onOpcija(o.id);
            }}
            className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase"
          >
            {o.rec}
          </button>
        ))}
      </div>
    </article>
  );
}

function OrdinacijaKartica() {
  const lv = useGameStore((s) => s.gradevine.ordinacija || 0);
  const gori = useGameStore((s) => s.ostecenja.ordinacija);
  const zlato = useGameStore((s) => s.zlato);
  const lijeci = useGameStore((s) => s.lijeci);
  if (lv < 1 || gori) return null;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Liječi</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">Ruža zavije. 8 zlata. +3 energije. Ponekad skine tegobu.</p>
      <button
        type="button"
        disabled={zlato < 8}
        onClick={lijeci}
        className="mt-2 min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
      >
        Liječi · 8
      </button>
    </article>
  );
}

function TrgovinaKartica() {
  const lv = useGameStore((s) => s.gradevine.trgovina || 0);
  const gori = useGameStore((s) => s.ostecenja.trgovina);
  const zlato = useGameStore((s) => s.zlato);
  const kupi = useGameStore((s) => s.trgovinaKupi);
  if (lv < 1 || gori) return null;
  const kolicina = 4 + lv;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Trgovina</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">Šime prodaje. 8 zlata, +{kolicina} zalihe.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["drvo", "kamen", "zeljezo"] as ResursId[]).map((res) => (
          <button
            key={res}
            type="button"
            disabled={zlato < 8}
            onClick={() => kupi(res)}
            className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            {res} · 8
          </button>
        ))}
      </div>
    </article>
  );
}

function BankaKartica() {
  const lv = useGameStore((s) => s.gradevine.banka || 0);
  const gori = useGameStore((s) => s.ostecenja.banka);
  const seif = useGameStore((s) => s.bankaZlato);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const spremi = useGameStore((s) => s.bankaSpremi);
  const uzmi = useGameStore((s) => s.bankaUzmi);
  if (lv < 1 || gori) return null;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Banka</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">
        Seif {Math.floor(seif)} zlata. Pohod ne dira. Kamata spava unutra.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[20, 50].map((n) => (
          <button
            key={`s${n}`}
            type="button"
            disabled={zlato < n}
            onClick={() => spremi(n)}
            className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            Spremi {n}
          </button>
        ))}
        <button
          type="button"
          disabled={zlato < 1}
          onClick={() => spremi(zlato)}
          className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
        >
          Spremi sve
        </button>
        {[20, 50].map((n) => (
          <button
            key={`u${n}`}
            type="button"
            disabled={seif < n}
            onClick={() => uzmi(n)}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Uzmi {n}
          </button>
        ))}
        <button
          type="button"
          disabled={seif < 1}
          onClick={() => uzmi(Math.floor(seif))}
          className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
        >
          Uzmi sve
        </button>
      </div>
    </article>
  );
}

