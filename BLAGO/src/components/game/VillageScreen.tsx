import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { BuildingCard } from "./BuildingCard";
import { IgraKarata } from "./IgraKarata";
import { IgraBlackjack } from "./IgraBlackjack";
import { UtrkaStaza } from "./UtrkaStaza";
import { MrezaSela } from "./MrezaSela";
import { LivePohod } from "./LivePohod";
import { SideGateKartica } from "./SideGateKartica";
import { jeSideOtkljucan, SIDE_GATE_REC } from "@/lib/game/sideGate";
import { ZidScreen } from "./ZidScreen";
import { KronikaLista } from "./KronikaLista";
import { ZGRADE, ZGRADE_SKINOVI, seloNaMaxu } from "@/lib/game/constants";
import { ZGRADA_ART } from "@/lib/game/art";
import {
  kategorijaKaube,
  raspolozenjeKaube,
  POTREBE_META,
  KONJ_DUZNOSTI,
  GOVEDO_DUZNOSTI,
  konjaKap,
  govedaKap,
  krdoTijesno,
  hubZaZgradu,
  type KaubaStanje,
  type KaubaUsko,
} from "@/lib/game/economy";
import { CILJ_EVENT } from "@/lib/game/sljedeciCilj";
import { gdjeJe, razgovor, darRec, mozeDati, danDoba, DOBA_REC, nalogOd, tkoZaNalog, recBuff, recSveBuff, recSveMane, recJahanje, tkoJaše, trebaKonja, likCrta, mozeKrupije, kaubaOd, likXpPostotak, SEGRT_SKOLA, jeGlavni, poredajGlavne, type Stanovnik, type Segrt, type DanDoba } from "@/lib/game/ljudi";
import { KONJ_CIJENA_DRVO, KONJ_CIJENA_ZLATO, SIJENO_ZLATO, KISA_ZLATO, GOVEDO_CIJENA_DRVO, GOVEDO_CIJENA_ZLATO, GOVEDO_TJERAJ, GOVEDO_KLANJE } from "@/lib/game/tuning";
import { LikAvatar } from "./LikAvatar";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { HubPrikaz } from "./TaborGrad";
import type { Gradevine, Gradnja, Karavana, Ostecenja, ResursId } from "@/lib/game/types";
import type { KaubaDogadaj } from "@/lib/game/dogadaji";

const LISTAK: Array<{ id: "tabor" | "kauboji" | "mreza" | "uzivo" | "zid"; label: string }> = [
  { id: "tabor", label: "Tabor" },
  { id: "kauboji", label: "Kauboji" },
  { id: "mreza", label: "Mreža" },
  { id: "zid", label: "Zid" },
  { id: "uzivo", label: "Uživo" },
];

const HUB_REC: Record<KaubaUsko, string> = {
  krov: "Kuća i zgrada. Smještaj.",
  jelo: "Lov, mesnica, pekarna, farma i tor. Firma drži krdo.",
  zabava: "Salun, asovi i blackjack.",
  voda: "Bunar, cisterna i mlin. Kiša ili bunar.",
  posao: "Pilana, kamenolom, rudnik i trgovina.",
  red: "Šerifov ured, banka i ćelija. Zakon u kaubi.",
  konji: "Staja, ispust i staza. Reci konju što radi.",
  zdravlje: "Ordinacija, travar i banja. Rana ne čeka.",
};

function skociNaZgradu(id: keyof Gradevine) {
  const el = document.getElementById(`zgrada-${id}`);
  el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function VillageScreen() {
  const [listak, setListak] = useState<"tabor" | "kauboji" | "mreza" | "uzivo" | "zid">("tabor");
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
  const sideOtkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
  const setPoruka = useGameStore((s) => s.setPoruka);
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
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const govedaDuznost = useGameStore((s) => s.govedaDuznost);
  const sijenoDo = useGameStore((s) => s.sijenoDo);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const celijaBroj = useGameStore((s) => s.celijaBroj);
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
  const kauba = kaubaOd({ gradevine, stanovnici, zamjenici, konjiBroj, konjiDuznost, sijenoDo, kisaDo, govedaBroj, govedaDuznost, celijaBroj });
  const kat = kategorijaKaube(kauba.ljudi);
  const mood = raspolozenjeKaube(kauba);
  const krov = POTREBE_META.find((p) => p.id === fokus) ?? POTREBE_META[0]!;
  const skupina = ZGRADE.filter((z) => krov.zgrade.includes(z.id));
  const sviLikovi = poredajGlavne(ljudiPopis.concat(segrti).concat(zamjenici));
  const odabran = sviLikovi.find((p) => p.id === odabranId) ?? null;
  const tkoGovori = odabran;
  const jase = tkoJaše(sviLikovi, gradevine, ostecenja, konjiDuznost);
  const tkoGdje = tkoGovori ? gdjeJe(tkoGovori, gradevine, gradnje, ostecenja, doba, karavana, sviLikovi) : null;
  const tkoGovor = tkoGovori
    ? razgovor(tkoGovori, mood.id, tkoGdje?.mjesto === "zgrada", tkoGdje?.zgrada, doba)
    : null;

  const odaberiHub = (id: KaubaUsko) => {
    playSfx("button");
    setFokus(id);
    if (listak === "uzivo" || listak === "zid") setListak("tabor");
  };

  useEffect(() => {
    const onScrollCilj = (e: Event) => {
      const id = (e as CustomEvent<{ id?: keyof Gradevine }>).detail?.id;
      if (!id) return;
      const hub = hubZaZgradu(id);
      if (hub) setFokus(hub);
      setListak("tabor");
      window.setTimeout(() => skociNaZgradu(id), 60);
    };
    window.addEventListener(CILJ_EVENT + ":scroll", onScrollCilj);
    return () => window.removeEventListener(CILJ_EVENT + ":scroll", onScrollCilj);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {gori && (
        <button
          type="button"
          onClick={() => setRaidAktivan(true)}
          className="mx-3 mt-2 shrink-0 min-h-11 rounded-xl bg-ruby px-3 text-xs font-bold tracking-widest text-ink"
        >
          POHOD — nešto gori
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {listak === "mreza" ? (
        <div className="listak-ulaz pb-8">
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
          {sideOtkljucan ? (
            <>
              <ZidScreen />
              <div className="mt-4">
                <KronikaLista />
              </div>
            </>
          ) : (
            <SideGateKartica naslov="Zid · potjernice" />
          )}
        </div>
      ) : listak === "uzivo" ? (
        <div className="listak-ulaz px-3 pb-8 pt-1">
          {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}
          {sideOtkljucan ? <LivePohod /> : <SideGateKartica naslov="Uživo · pohod" />}
        </div>
      ) : listak === "kauboji" ? (
        <div className="listak-ulaz px-3 pb-8 pt-1">
          <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Kauboji kaube</p>
          <div className="kauboji-mreza">
            {sviLikovi.map((p) => {
              const gdje = gdjeJe(p, gradevine, gradnje, ostecenja, doba, karavana, sviLikovi);
              const govor = razgovor(p, mood.id, gdje.mjesto === "zgrada", gdje.zgrada, doba);
              const otvoren = odabranId === p.id;
              return (
                <article
                  key={p.id}
                  className={cn(
                    "kauboj-kartica",
                    otvoren && "kauboj-kartica-otvoren",
                    jeGlavni(p.id) && "kauboj-kartica-glavni",
                  )}
                >
                  <button
                    type="button"
                    className="kauboj-glava"
                    onClick={() => {
                      playSfx("button");
                      setOdabranId(otvoren ? null : p.id);
                    }}
                  >
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[10px] font-bold tracking-[0.18em] text-gold uppercase">
                        {jeGlavni(p.id) ? "★ " : ""}
                        {p.posao}
                      </span>
                      <span className="block text-sm font-bold text-ink">
                        {p.ime} · lv {p.razina}
                      </span>
                      <span className="block text-[11px] font-bold text-dim">
                        {gdje.mjesto === "zgrada" ? gdje.zgrada : gdje.mjesto === "put" ? "Na putu" : "Ulica"}
                      </span>
                    </span>
                  </button>
                  {otvoren && tkoGovor && (
                    <div className="lik-let mt-2">
                      <LikKartica
                        p={p}
                        skratiGlavu
                        rec={(() => {
                          const učenik = segrti.find((x) => x.id === p.id);
                          if (učenik && !učenik.spreman) {
                            return `Uči kod Ive. Još ${Math.max(1, SEGRT_SKOLA - učenik.skola)} posla.`;
                          }
                          return jutro.find((j) => j.likId === p.id && !j.uzeto)?.rec ?? govor.rec;
                        })()}
                        dar={p.posao === "Šegrt" ? undefined : govor.dar}
                        mood={mood.id}
                        moze={!!govor.dar && mozeDati(govor.dar, zlato, resursi)}
                        nalog={misije.find((m) => m.trenutno < m.cilj && (m.likId === p.id || tkoZaNalog(ljudiPopis, m.tip)?.id === p.id))}
                        jaše={jase.has(p.id)}
                        crta={likCrta(p)}
                        krupije={mozeKrupije(p)}
                        jeKrupije={faroKrupije === p.id}
                        onHub={() => {
                          odaberiHub(p.hub);
                          setListak("tabor");
                        }}
                        onDaj={() => dajLiku(p.id)}
                        onKrupije={() => postaviKrupija(faroKrupije === p.id ? null : p.id)}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <>
      <div className="kauba-tabor">
      <section
        className={cn(
          "kauba-hero kauba-hero-labav relative w-full overflow-hidden",
          `kauba-mood-${mood.id}`,
          `kauba-doba-${doba}`,
          gori && "kauba-mood-gori",
        )}
        data-mood={mood.id}
        data-lock-pan
        onPointerDown={(e) => e.stopPropagation()}
        style={{ ["--skin-filter" as string]: skin.nijansa }}
      >
        <div className="relative overflow-hidden">
        <HubPrikaz hub={fokus} doba={doba} gori={gori} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: skin.boja, mixBlendMode: "color", opacity: Math.min(0.08, skin.koprena) }}
        />
        <KaubaAmbient doba={doba} gori={gori} />
        <div className="kauba-hero-platno pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 z-[4] bg-gradient-to-b from-void/80 via-void/35 to-transparent px-3 pb-8 pt-1.5">
            <p className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase" style={{ color: skin.boja }}>
              {kat.naziv} · {ljudiPopis.length} · {DOBA_REC[doba]}
            </p>
          </div>
          <button
            type="button"
            className="kauba-mood-rec pointer-events-auto"
            onClick={() => {
              playSfx("button");
              if (mood.usko) odaberiHub(mood.usko);
            }}
          >
            {mood.rec}
          </button>
        </div>
        </div>
      </section>
      <div className="kauba-meni-stick sticky top-0 z-[5] bg-void px-2 pb-1 pt-1">
        <KaubaPotrebe kauba={kauba} aktivna={fokus} onPotreba={odaberiHub} />
      </div>

      <div className="kauba-tabor-sadrzaj">
        {dogadaj && <EventKartica d={dogadaj} onOpcija={rijesiDogadaj} />}

        {listak === "tabor" && (
          <div key={fokus} className="hub-ulaz">
            <p className="krov-greda mb-2">{HUB_REC[fokus]}</p>
            {fokus === "jelo" && <GovedaKartica />}
            {fokus === "zdravlje" && <LijekKartica />}
            {fokus === "voda" && <VodaKartica />}
            {fokus === "posao" && <TrgovinaKartica />}
            {fokus === "red" && (
              <>
                <ZatvorKartica />
                <BankaKartica />
              </>
            )}
            {fokus === "konji" && (
              <>
                <KonjiKartica />
                <UtrkaStaza />
              </>
            )}
            {skupina.map((z) => (
              <div key={z.id} className="hub-kartica">
                <BuildingCard zgrada={z} />
              </div>
            ))}
            {fokus === "zabava" && (gradevine.salun || 0) > 0 && (
              sideOtkljucan ? (
                <>
                  <IgraKarata />
                  <IgraBlackjack />
                </>
              ) : (
                <SideGateKartica naslov="Salun · igre" />
              )
            )}
            {fokus === "krov" && <KrunidbaKartica />}
          </div>
        )}
      </div>
      </div>
        </>
      )}
      </div>
      <div className="kauba-listak shrink-0 px-2 pb-[0.35rem] pt-1">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {LISTAK.map((t) => {
            const sideTab = t.id === "uzivo" || t.id === "zid";
            const zakljucan = sideTab && !sideOtkljucan;
            return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                playSfx("button");
                if (zakljucan) setPoruka(SIDE_GATE_REC);
                setListak(t.id);
              }}
              className={cn(
                "min-h-10 flex-1 rounded-full px-2 text-[11px] font-bold tracking-wide uppercase transition-[background,color,transform] duration-200 ease-out active:scale-[0.96]",
                listak === t.id ? "bg-gold text-void" : zakljucan ? "border border-line bg-panel text-dim/50" : "border border-line bg-panel text-dim",
              )}
              aria-label={zakljucan ? `${t.label} · ${SIDE_GATE_REC}` : t.label}
            >
              {zakljucan ? (
                <span className="inline-flex items-center justify-center gap-0.5">
                  <Lock className="size-3 shrink-0" strokeWidth={2.6} />
                  {t.label}
                </span>
              ) : (
                t.label
              )}
            </button>
            );
          })}
        </div>
      </div>
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
  skratiGlavu,
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
  skratiGlavu?: boolean;
  onHub: () => void;
  onDaj: () => void;
  onKrupije?: () => void;
}) {
  const glavni = jeGlavni(p.id);
  const [imeEdit, setImeEdit] = useState(false);
  const [imeDraft, setImeDraft] = useState(p.ime);
  const preimenujLika = useGameStore((s) => s.preimenujLika);
  const dajCasu = useGameStore((s) => s.dajCasu);
  const zlatoSad = useGameStore((s) => Math.floor(s.zlato));
  const plus = recSveBuff(p);
  const minus = recSveMane(p);
  const jahanje = recJahanje(p, !!jaše);
  const spremiIme = () => {
    preimenujLika(p.id, imeDraft);
    setImeEdit(false);
  };
  return (
    <article className={cn("lik-plakat mb-2 flex w-full items-center gap-3 px-3 py-2.5", glavni && "lik-glavni")}>
      {!skratiGlavu && (
        <button type="button" onClick={onHub} className="lik-plakat-okvir">
          <LikAvatar p={p} mood={mood} veliki jaše={!!jaše} />
        </button>
      )}
      <span className="min-w-0 flex-1">
        {!skratiGlavu && (
          <span className="block text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
            {glavni ? "★ " : ""}
            {p.posao}
          </span>
        )}
        {imeEdit ? (
          <input
            data-lock-pan
            value={imeDraft}
            maxLength={14}
            autoFocus
            aria-label="Ime"
            onChange={(e) => setImeDraft(e.target.value)}
            onBlur={spremiIme}
            onKeyDown={(e) => {
              if (e.key === "Enter") spremiIme();
              if (e.key === "Escape") {
                setImeDraft(p.ime);
                setImeEdit(false);
              }
            }}
            className="mt-0.5 w-full rounded-lg border border-gold bg-void px-2 py-1 text-base font-bold text-ink"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              playSfx("button");
              setImeDraft(p.ime);
              setImeEdit(true);
            }}
            className="block text-left text-[12px] font-bold text-ink/80"
          >
            {skratiGlavu ? "Preimenuj" : `${p.ime} · lv ${p.razina}`}
            {!skratiGlavu && (jaše ? " · na konju" : trebaKonja(p) ? " · pješke" : recBuff(p) ? ` · ${recBuff(p)}` : "")}
          </button>
        )}
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
              width: `${likXpPostotak(p)}%`,
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
          {glavni && (
            <button
              type="button"
              disabled={zlatoSad < 2}
              onClick={() => dajCasu(p.id)}
              className="min-h-9 rounded-lg bg-gold px-3 text-[11px] font-bold text-void disabled:bg-panel-2 disabled:text-dim"
            >
              Kocka · 2
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
              {jeKrupije ? "Djelitelj · skini" : "Djelitelj"}
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
  return (
    <div className="grid grid-cols-4 gap-1">
      {POTREBE_META.map((r) => {
        const v = kauba.potrebe[r.id];
        const boja = v < 0.4 ? "var(--color-ruby)" : v < 0.75 ? "var(--color-volt)" : "var(--color-xp)";
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onPotreba(r.id)}
            className={cn(
              "min-h-9 rounded-lg border px-0.5 py-1",
              aktivna === r.id ? "border-gold bg-gold/15" : "border-line bg-panel",
              v < 0.4 && "potreba-hit",
            )}
          >
            <p className="text-center text-[9px] font-bold tracking-wide text-gold uppercase">{r.naziv}</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-void">
              <div className="h-full rounded-full potreba-traka" style={{ width: `${Math.round(v * 100)}%`, backgroundColor: boja }} />
            </div>
          </button>
        );
      })}
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
  const naslov =
    d.naslov ??
    (d.tip === "stranac"
      ? "Stranac"
      : d.tip === "dvoboj"
        ? "Dvoboj"
        : d.tip === "krdo"
          ? "Krdo"
          : d.tip === "konj"
            ? "Konj"
            : d.tip === "kisa"
              ? "Kiša"
              : d.tip === "trgovac"
                ? "Trgovac"
                : d.tip === "svadba"
                  ? "Svadba"
                  : d.tip === "posta"
                    ? "Pošta"
                    : d.tip === "cirkus"
                      ? "Cirkus"
                : "Salun");
  return (
    <article className="kauba-dogadaj kauba-dogadaj-veselo mb-2 overflow-hidden rounded-2xl border border-gold/80 p-3">
      <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">{naslov}</p>
      <p className="mt-1 text-sm font-bold leading-snug text-ink">{d.rec}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.opcije.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              playSfx("button");
              onOpcija(o.id);
            }}
            className={cn(
              "min-h-10 rounded-full px-3 text-[11px] font-bold tracking-wide uppercase",
              i === 0 ? "bg-gold text-void" : i === 1 ? "bg-volt text-void" : "bg-xp text-void",
            )}
          >
            {o.rec}
          </button>
        ))}
      </div>
    </article>
  );
}

function LijekKartica() {
  const ordinacija = useGameStore((s) => s.gradevine.ordinacija || 0);
  const travar = useGameStore((s) => s.gradevine.travar || 0);
  const banja = useGameStore((s) => s.gradevine.banja || 0);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const zlato = useGameStore((s) => s.zlato);
  const lijeci = useGameStore((s) => s.lijeci);
  const imaOrdinaciju = ordinacija > 0 && !ostecenja.ordinacija;
  const imaTravara = travar > 0 && !ostecenja.travar;
  const imaBanju = banja > 0 && !ostecenja.banja;
  if (!imaOrdinaciju && !imaTravara && !imaBanju) return null;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Liječi</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">Rana ne čeka. Trava, voda ili zavoj.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {imaOrdinaciju && (
          <button
            type="button"
            disabled={zlato < 8}
            onClick={() => lijeci("ordinacija")}
            className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            Liječi · 8
          </button>
        )}
        {imaTravara && (
          <button
            type="button"
            disabled={zlato < 5}
            onClick={() => lijeci("travar")}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Uber · 5
          </button>
        )}
        {imaBanju && (
          <button
            type="button"
            disabled={zlato < 6}
            onClick={() => lijeci("banja")}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Operi · 6
          </button>
        )}
      </div>
    </article>
  );
}

function VodaKartica() {
  const lv = useGameStore((s) => s.gradevine.cisterna || 0);
  const gori = useGameStore((s) => s.ostecenja.cisterna);
  const zlato = useGameStore((s) => s.zlato);
  const kisaDo = useGameStore((s) => s.kisaDo);
  const skupi = useGameStore((s) => s.skupiKisu);
  const [sad, setSad] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setSad(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (lv < 1 || gori) return null;
  const ostalo = Math.max(0, Math.ceil((kisaDo - sad) / 1000));
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Cisterna</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">
        {ostalo > 0 ? `Kiša u krovu. Još ${ostalo}s.` : "Krov hvata kišu. Pet zlata."}
      </p>
      <button
        type="button"
        disabled={zlato < KISA_ZLATO}
        onClick={skupi}
        className="mt-2 min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
      >
        {ostalo > 0 ? `Kiša ${ostalo}s` : `Skupi kišu · ${KISA_ZLATO}g`}
      </button>
    </article>
  );
}

function GovedaKartica() {
  const gradevine = useGameStore((s) => s.gradevine);
  const ostecenja = useGameStore((s) => s.ostecenja);
  const govedaBroj = useGameStore((s) => s.govedaBroj);
  const duznost = useGameStore((s) => s.govedaDuznost);
  const jahanje = useGameStore((s) => s.konjiDuznost.jahanje);
  const zlato = useGameStore((s) => Math.floor(s.zlato));
  const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
  const ljudi = useGameStore((s) => s.ljudi);
  const kupiGovedo = useGameStore((s) => s.kupiGovedo);
  const prodajGovedo = useGameStore((s) => s.prodajGovedo);
  const pomakniGovedo = useGameStore((s) => s.pomakniGovedo);
  const tjerajGovedo = useGameStore((s) => s.tjerajGovedo);
  const koljiGovedo = useGameStore((s) => s.koljiGovedo);
  const kap = govedaKap(gradevine);
  if ((gradevine.tor || 0) < 1 || ostecenja.tor) return null;
  const tijesno = krdoTijesno(govedaBroj, kap);
  const izvor = GOVEDO_DUZNOSTI.find((d) => duznost[d.id] > 0)?.id ?? "pasa";
  const tjerajN = Math.max(1, duznost.tjeranje || 1);
  const gazda = ljudi.find((p) => p.posao === "Gazda");
  const referent = ljudi.find((p) => p.posao === "Referent");
  const rec =
    govedaBroj < 1
      ? "Tor prazan. Firma stoji."
      : tijesno >= 1
        ? "Tor pun. Gazda hoće još. Referent šuti."
        : tijesno > 0
          ? "Koža je tijesna. Gazda viče. Referent broji."
          : "Gazda kaže. Goniči tjeraju.";
  return (
    <article className={cn("mb-2 overflow-hidden rounded-2xl border bg-panel", tijesno > 0 ? "border-ruby/70" : "border-line")}>
      <div className="relative h-16 overflow-hidden" aria-hidden>
        <img src={ZGRADA_ART.tor} alt="" className="size-full object-cover object-[center_45%]" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
      </div>
      <div className="p-3 pt-1">
        <p className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase">Firma</p>
        <p className="mt-1 text-[12px] font-bold text-ink/80">
          {govedaBroj}/{kap} u toru. {rec}
          {gazda ? ` ${gazda.ime} gazda.` : ""}
          {referent ? ` ${referent.ime} referent.` : ""}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {GOVEDO_DUZNOSTI.map((d) => (
            <div key={d.id} className="rounded-xl border border-line bg-void/40 px-2 py-1.5">
              <p className="text-[10px] font-bold tracking-wide text-gold uppercase">{d.naziv}</p>
              <p className="text-[11px] font-bold text-ink/70">{d.rec}</p>
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  disabled={duznost[d.id] < 1}
                  onClick={() => pomakniGovedo(d.id, d.id === "pasa" ? izvor : "pasa")}
                  className="min-h-8 min-w-8 rounded-full border border-line bg-panel-2 text-sm font-bold text-ink disabled:text-dim"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-sm font-bold tabular-nums text-ink">{duznost[d.id]}</span>
                <button
                  type="button"
                  disabled={(d.id === "pasa" ? izvor === "pasa" : duznost.pasa < 1) || govedaBroj < 1}
                  onClick={() => pomakniGovedo(d.id === "pasa" ? izvor : "pasa", d.id)}
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
            disabled={zlato < GOVEDO_CIJENA_ZLATO || drvo < GOVEDO_CIJENA_DRVO || govedaBroj >= kap}
            onClick={() => kupiGovedo(1)}
            className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
          >
            Uzmi · {GOVEDO_CIJENA_ZLATO}
          </button>
          {kap - govedaBroj >= 5 && (
            <button
              type="button"
              disabled={zlato < GOVEDO_CIJENA_ZLATO * 5 || drvo < GOVEDO_CIJENA_DRVO * 5}
              onClick={() => kupiGovedo(5)}
              className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
            >
              Pet
            </button>
          )}
          <button
            type="button"
            disabled={govedaBroj < 1}
            onClick={prodajGovedo}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Prodaj
          </button>
          <button
            type="button"
            disabled={govedaBroj < 1 || jahanje < 1}
            onClick={tjerajGovedo}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Tjeraj · {GOVEDO_TJERAJ * tjerajN}g
          </button>
          <button
            type="button"
            disabled={govedaBroj < 1}
            onClick={koljiGovedo}
            className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
          >
            Kolji · {GOVEDO_KLANJE}g
          </button>
        </div>
      </div>
    </article>
  );
}

function ZatvorKartica() {
  const ured = useGameStore((s) => s.gradevine.ured || 0);
  const gori = useGameStore((s) => s.ostecenja.ured);
  const n = useGameStore((s) => s.celijaBroj);
  const strpaj = useGameStore((s) => s.strpajCeliju);
  const pusti = useGameStore((s) => s.pustiCeliju);
  if (ured < 1 || gori) return null;
  return (
    <article className="mb-2 rounded-2xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Ćelija</p>
      <p className="mt-1 text-[12px] font-bold text-ink/80">
        {n}/3 iza rešetaka. {n < 1 ? "Prazna. Zakon čeka." : "Zakon diše."}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={n >= 3}
          onClick={strpaj}
          className="min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim"
        >
          Strpaj
        </button>
        <button
          type="button"
          disabled={n < 1}
          onClick={pusti}
          className="min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim"
        >
          Pusti · {n * 8}g
        </button>
      </div>
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
        Sef {Math.floor(seif)} zlata. Pohod ne dira. Kamata spava unutra.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[100, 500, 2000].map((n) => (
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
        {[100, 500, 2000].map((n) => (
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

