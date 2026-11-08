// @ts-nocheck
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CloudRain, Crosshair, Store, Wheat } from "lucide-react";
import { useGameStore } from "@/lib/stores/gameStore";
import { useSlotStore } from "@/lib/stores/slotStore";
import { BuildingCard } from "./BuildingCard";
import { IgraKarata } from "./IgraKarata";
import { IgraBlackjack } from "./IgraBlackjack";
import { UtrkaStaza } from "./UtrkaStaza";
import { KaubaScena, kadriScena } from "./KaubaScena";
import { SideGateKartica } from "./SideGateKartica";
import { jeSideOtkljucan } from "@/lib/game/sideGate";
import { ZGRADE, seloNaMaxu } from "@/lib/game/constants";
import { METAK_OBNOVA_MS, metciPoObnovi, potkovePoObnovi } from "@/lib/game/economy";
import { ZGRADA_ART } from "@/lib/game/art";
import {
  raspolozenjeKaube,
  POTREBE_META,
  cijenaUzKrunu,
  hubZaZgradu,
  KONJ_DUZNOSTI,
  GOVEDO_DUZNOSTI,
  konjaKap,
  govedaKap,
  krdoTijesno,
} from "@/lib/game/economy";
import { recTrga } from "@/lib/game/dijalozi";
import { CILJ_EVENT } from "@/lib/game/sljedeciCilj";
import { IDI_EVENT, procitajIdi, tokMeniEkran, tokMeniPrsten, tokMeniZaDio } from "@/lib/game/tokMeni";
import { KaubaDio, jeKaubaUsko } from "./KaubaDio";
import { AlmanahSloj } from "./AlmanahSloj";
import {
  gdjeJe,
  razgovor,
  darRec,
  mozeDati,
  danDoba,
  nalogOd,
  tkoZaNalog,
  recBuff,
  recSveBuff,
  recSveMane,
  recJahanje,
  tkoJaše,
  trebaKonja,
  likCrta,
  mozeKrupije,
  kaubaOd,
  likXpPostotak,
  jeGlavni,
  poredajGlavne,
  srecaLika,
} from "@/lib/game/ljudi";
import { LikAvatar } from "./LikAvatar";
import { TokRadial } from "./TokRadial";
import { playSfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { vidljiviInterval } from "@/lib/game/helpers";
import { useSekunda } from "@/lib/game/sat";
import { EventKartica } from "./EventKartica";
import { useVodic, vodicNalog } from "@/lib/game/vodic";

var HUB_REC = {
	krov: "Kuća i zgrada. Smještaj.",
	jelo: "Lovački dom, mesnica, pekarna, farma i tor. Firma drži krdo.",
	zabava: "Salun, casino i blackjack.",
	voda: "Bunar, cisterna i mlin. Kiša ili bunar.",
	posao: "Pilana, kamenolom, rudnik i trgovina.",
	red: "Šerifov ured, banka i ćelija. Zakon u kaubi.",
	konji: "Staja, ispust i staza. Reci konju što radi.",
	zdravlje: "Ordinacija, travar i banja. Rana ne čeka.",
	oruzje: "Kovačnica, barutana i tvornica. Metci se sami obnavljaju."
};
function tokNaslov(tok) {
	if (tok === "selo") return "Tko drži kaubu";
	if (tok === "oklop") return "Oklop";
	if (tok === "stav") return "Šerif";
	if (tok === "pozar") return "Požar";
	return POTREBE_META.find((p) => p.id === tok)?.naziv ?? "Tko se angažira";
}
function skociNaZgradu(id) {
	const el = document.getElementById(`zgrada-${id}`);
	if (!el) return;
	const box = el.closest(".kauba-dio-skrol") ?? el.closest(".kauba-skrol") ?? el.closest(".pager-pane");
	if (box) {
		const y = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
		box.scrollTo({
			top: Math.max(0, y),
			behavior: "smooth"
		});
		return;
	}
	el.scrollIntoView({
		behavior: "smooth",
		block: "start",
		inline: "nearest"
	});
}
export function VillageScreen({ naTab, aktivan = true }) {
	const [fokus, setFokus] = useState("krov");
	const [scena, setScena] = useState("selo");
	const [tok, setTok] = useState("selo");
	const [dio, setDio] = useState(null);
	const [meni, setMeni] = useState(null);
	const [dioHold, setDioHold] = useState(null);
	const [almanah, setAlmanah] = useState(false);
	const [postaMala, setPostaMala] = useState(false);
	const vodic = useVodic();
	const [odabranId, setOdabranId] = useState(null);
	const [doba, setDoba] = useState(() => danDoba());
	useEffect(() => {
		return vidljiviInterval(() => setDoba(danDoba()), 2e4);
	}, []);
	const gradevine = useGameStore((s) => s.gradevine);
	const sideOtkljucan = useGameStore((s) => jeSideOtkljucan(s.gradevine));
	const ostecenja = useGameStore((s) => s.ostecenja);
	const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
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
	const potkoveDo = useGameStore((s) => s.potkoveDo);
	const kisaDo = useGameStore((s) => s.kisaDo);
	const travaDo = useGameStore((s) => s.travaDo);
	const celijaBroj = useGameStore((s) => s.celijaBroj);
	const karavana = useGameStore((s) => s.karavana);
	const imeNaselja = useGameStore((s) => s.imeIgraca);
	const dogadaj = useGameStore((s) => s.dogadaj);
	const rijesiDogadaj = useGameStore((s) => s.rijesiDogadaj);
	const kauba = useMemo(() => kaubaOd({
		gradevine,
		stanovnici,
		zamjenici,
		konjiBroj,
		konjiDuznost,
		sijenoDo,
		potkoveDo,
		kisaDo,
		travaDo,
		govedaBroj,
		govedaDuznost,
		celijaBroj,
		ljudi: ljudiPopis,
		segrti
	}), [
		gradevine,
		stanovnici,
		zamjenici,
		konjiBroj,
		konjiDuznost,
		sijenoDo,
		potkoveDo,
		kisaDo,
		travaDo,
		govedaBroj,
		govedaDuznost,
		celijaBroj,
		ljudiPopis,
		segrti
	]);
	const mood = raspolozenjeKaube(kauba);
	const krov = POTREBE_META.find((p) => p.id === fokus) ?? POTREBE_META[0];
	const skupina = ZGRADE.filter((z) => krov.zgrade.includes(z.id));
	const sviLikovi = poredajGlavne(ljudiPopis.concat(segrti).concat(zamjenici));
	const tkoGovori = sviLikovi.find((p) => p.id === odabranId) ?? null;
	const jase = tkoJaše(sviLikovi, gradevine, ostecenja, konjiDuznost);
	const tkoGdje = tkoGovori ? gdjeJe(tkoGovori, gradevine, gradnje, ostecenja, doba, karavana, sviLikovi) : null;
	tkoGovori && razgovor(tkoGovori, mood.id, tkoGdje?.mjesto === "zgrada", tkoGdje?.zgrada, doba);
	const odaberiHub = (id) => {
		playSfx("button");
		kadriScena(() => {
			setFokus(id);
			setTok(id);
			setScena(id);
			setDio(id);
			setMeni(null);
		});
	};
	const otvoriDio = (id) => {
		setTok(id);
		if (POTREBE_META.some((p) => p.id === id)) setFokus(id);
		setDio(id);
		setMeni(null);
	};
	const naMeni = (s) => {
		setMeni(null);
		if (s.zakljucano) {
			useGameStore.getState().setPoruka(s.rec);
			return;
		}
		const a = s.akcija;
		if (a.vrsta === "hub") {
			odaberiHub(a.hub);
			return;
		}
		if (a.vrsta === "trg") {
			playSfx("button");
			kadriScena(() => {
				setScena("selo");
				setTok("selo");
				setDio(null);
			});
			return;
		}
		if (a.vrsta === "ruke") {
			otvoriDio("ruke");
			return;
		}
		if (a.vrsta === "pohod") {
			setRaidAktivan(true);
			return;
		}
		if (a.vrsta === "metci") {
			odaberiHub("posao");
			window.setTimeout(() => skociNaZgradu("trgovina"), 80);
			window.setTimeout(() => {
				document.querySelector("[data-testid=metci-kartica]")?.scrollIntoView({
					behavior: "smooth",
					block: "center"
				});
			}, 160);
			return;
		}
		if (a.vrsta === "almanah") {
			setAlmanah(true);
			return;
		}
		if (a.vrsta === "travar") {
			useGameStore.getState().lijeci("travar");
			odaberiHub("zdravlje");
			otvoriDio("zdravlje");
			return;
		}
		if (a.vrsta === "kisa") {
			useGameStore.getState().skupiKisu();
			odaberiHub("voda");
			otvoriDio("voda");
			return;
		}
		if (a.vrsta === "zgrada") {
			const hub = hubZaZgradu(a.id);
			if (hub) {
				setFokus(hub);
				setTok(hub);
				kadriScena(() => setScena(hub));
				setDio(hub);
			}
			window.setTimeout(() => skociNaZgradu(a.id), 120);
		}
	};
	const drziPrsten = () => {
		setMeni(tokMeniPrsten(seloNaMaxu(gradevine)));
	};
	useEffect(() => {
		if (aktivan) return;
		setDio(null);
		setDioHold(null);
		setMeni(null);
		setAlmanah(false);
		setScena("selo");
		setTok("selo");
	}, [aktivan]);
	useEffect(() => {
		const onScrollCilj = (e) => {
			const id = e.detail?.id;
			if (!id) return;
			const hub = hubZaZgradu(id);
			if (hub) {
				setFokus(hub);
				setTok(hub);
				setScena(hub);
				setDio(hub);
			}
			window.setTimeout(() => skociNaZgradu(id), 60);
		};
		window.addEventListener(CILJ_EVENT + ":scroll", onScrollCilj);
		return () => window.removeEventListener(CILJ_EVENT + ":scroll", onScrollCilj);
	}, []);
	const scenaRef = useRef(scena);
	const dioRef = useRef(dio);
	scenaRef.current = scena;
	dioRef.current = dio;
	useEffect(() => {
		const primijeni = (d) => {
			if (!d) return;
			if (d.ruke) {
				setAlmanah(false);
				setTok("ruke");
				setDio("ruke");
				setMeni(null);
				return;
			}
			if (d.almanah) {
				setAlmanah(true);
				return;
			}
			if (d.trg) {
				setAlmanah(false);
				setMeni(null);
				setDio(null);
				setTok("selo");
				setScena("selo");
				return;
			}
			if (d.hub) odaberiHub(d.hub);
		};
		const onIdi = (e) => {
			procitajIdi();
			primijeni(e.detail);
		};
		window.addEventListener(IDI_EVENT, onIdi);
		primijeni(procitajIdi());
		return () => window.removeEventListener(IDI_EVENT, onIdi);
	}, []);
	useEffect(() => {
		const naReset = () => {
			setAlmanah(false);
			setMeni(null);
			setDio(null);
			setTok("selo");
			setScena("selo");
		};
		window.addEventListener("blago-karta-reset", naReset);
		return () => window.removeEventListener("blago-karta-reset", naReset);
	}, []);
	const sakrijKarticu = !!vodic.bubble || (vodic.traka && vodic.korak !== "nalog");
	return /* @__PURE__ */ jsx("div", {
		className: "flex h-full min-h-0 flex-col overflow-hidden",
		children: /* @__PURE__ */ jsxs("div", {
			className: "kauba-skrol relative min-h-0 flex-1 overflow-hidden",
			children: [
				/* @__PURE__ */ jsx(KaubaScena, {
					id: scena,
					doba,
					meni,
					imeNaselja,
					onHold: drziPrsten,
					onTap: () => {
						useGameStore.getState().ispali();
					},
					onOdabir: naMeni,
					onZatvori: () => setMeni(null),
					ziva: aktivan && !dio && !almanah
				}),
				dio && /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "kauba-natrag",
					"data-lock-pan": true,
					onPointerUp: (e) => {
						if (e.button !== 0 && e.pointerType === "mouse") return;
						e.preventDefault();
						e.stopPropagation();
						playSfx("button");
						setDio(null);
						setMeni(null);
						setTok("selo");
						setScena("selo");
						window.dispatchEvent(new CustomEvent("blago-karta-rucno"));
					},
					children: "Karta"
				}),
				dogadaj && !dio && !almanah && !sakrijKarticu && (postaMala ? /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "posta-ikona",
					"data-lock-pan": true,
					onPointerUp: (e) => {
						e.preventDefault();
						e.stopPropagation();
						setPostaMala(false);
					},
					children: "Pošta"
				}) : /* @__PURE__ */ jsxs("div", {
					className: "pointer-events-none absolute inset-x-2 bottom-2 z-20 flex max-h-[42%] flex-col items-end gap-1",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "posta-smanji pointer-events-auto",
							"data-lock-pan": true,
							onPointerUp: (e) => {
								e.preventDefault();
								e.stopPropagation();
								setPostaMala(true);
							},
							children: "Smanji"
						}),
						/* @__PURE__ */ jsx(EventKartica, {
							className: "pointer-events-auto",
							d: dogadaj,
							oznaka: dogadaj.tip === "stranac" ? "nalog-kauba" : void 0,
							onOpcija: (id) => {
								if (dogadaj.tip === "stranac") vodicNalog(true);
								rijesiDogadaj(id);
							}
						})
					]
				})),
				dio && /* @__PURE__ */ jsx(KaubaDio, {
					id: dio,
					rec: jeKaubaUsko(dio) ? HUB_REC[dio] : dio === "selo" ? recTrga(doba, mood.id) : dio === "oklop" ? "Štitovi i oklop. Drži kaubu." : dio === "ruke" ? "" : tokNaslov(dio),
					doba,
					onHold: (x, y) => {
						const ekran = tokMeniEkran(x, y);
						setDioHold({
							x: ekran.x,
							y: ekran.y,
							w: ekran.w,
							h: ekran.h
						});
					},
					children: /* @__PURE__ */ jsx(DioMogucnosti, {
						dio,
						fokus,
						skupina,
						sviLikovi,
						odabranId,
						onOdaberi: setOdabranId,
						onHub: odaberiHub,
						gradevine,
						sideOtkljucan,
						moodId: mood.id,
						jase
					})
				}, dio),
				dioHold && dio && /* @__PURE__ */ jsx(TokRadial, {
					x: dioHold.x,
					y: dioHold.y,
					sirina: dioHold.w,
					visina: dioHold.h,
					stavke: tokMeniZaDio(dio === "ruke" ? "ruke" : jeKaubaUsko(dio) ? dio : "selo", gradevine),
					polukrug: true,
					onOdabir: (s) => {
						setDioHold(null);
						naMeni(s);
					},
					onZatvori: () => setDioHold(null)
				}),
				almanah && /* @__PURE__ */ jsx(AlmanahSloj, {
					kauba,
					imeNaselja,
					onZatvori: () => setAlmanah(false),
					onHub: (id) => {
						setAlmanah(false);
						odaberiHub(id);
					}
				})
			]
		})
	});
}
function DioMogucnosti({ dio, fokus, skupina, sviLikovi, odabranId, onOdaberi, onHub, gradevine, sideOtkljucan, moodId, jase }) {
	const lijeci = useGameStore((s) => s.lijeci);
	const skupiKisu = useGameStore((s) => s.skupiKisu);
	const kupiSijeno = useGameStore((s) => s.kupiSijeno);
	const setRaidAktivan = useSlotStore((s) => s.setRaidAktivan);
	const hub = jeKaubaUsko(dio) ? dio : fokus;
	if (dio === "ruke") return /* @__PURE__ */ jsx(KaubojiMreza, {
		ljudi: sviLikovi,
		odabranId,
		onOdaberi,
		onHub,
		moodId,
		jase
	});
	const akcije = [];
	if (dio === "zdravlje") akcije.push({
		rec: "Zovi travara",
		go: () => lijeci("travar")
	});
	if (dio === "voda") akcije.push({
		rec: "Skupi kišu",
		go: () => skupiKisu()
	});
	if (dio === "konji") akcije.push({
		rec: "Sijeno",
		go: () => kupiSijeno()
	});
	if (dio === "red" || dio === "oklop") akcije.push({
		rec: "Pohod",
		go: () => setRaidAktivan(true),
		ruby: true
	});
	if (dio === "oklop") akcije.push({
		rec: "Zakon",
		go: () => onHub("red")
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		akcije.length > 0 && /* @__PURE__ */ jsx("div", {
			className: "kauba-dio-akcije",
			children: akcije.map((a) => /* @__PURE__ */ jsx("button", {
				type: "button",
				className: a.ruby ? "ruby" : void 0,
				onClick: () => {
					playSfx("button");
					a.go();
				},
				children: a.rec
			}, a.rec))
		}),
		dio === "selo" && /* @__PURE__ */ jsx("div", {
			className: "kauba-dio-akcije kauba-kat-mreza",
			children: POTREBE_META.map((h) => /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => {
					playSfx("button");
					onHub(h.id);
				},
				children: h.naziv
			}, h.id))
		}),
		jeKaubaUsko(dio) && /* @__PURE__ */ jsxs("div", {
			className: "hub-ulaz",
			children: [
				hub === "jelo" && /* @__PURE__ */ jsx(GovedaKartica, {}),
				hub === "zdravlje" && /* @__PURE__ */ jsx(LijekKartica, {}),
				hub === "voda" && /* @__PURE__ */ jsx(VodaKartica, {}),
				hub === "posao" && /* @__PURE__ */ jsx(TrgovinaKartica, {}),
				hub === "oruzje" && /* @__PURE__ */ jsx(MetciKartica, {}),
				hub === "red" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ZatvorKartica, {}), /* @__PURE__ */ jsx(BankaKartica, {})] }),
				hub === "konji" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(KonjiKartica, {}), /* @__PURE__ */ jsx(UtrkaStaza, {})] }),
				skupina.map((z) => /* @__PURE__ */ jsx("div", {
					className: "hub-kartica",
					children: /* @__PURE__ */ jsx(BuildingCard, { zgrada: z })
				}, z.id)),
				hub === "zabava" && (gradevine.karte || 0) > 0 && (sideOtkljucan ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(IgraKarata, {}), /* @__PURE__ */ jsx(IgraBlackjack, {})] }) : /* @__PURE__ */ jsx(SideGateKartica, { naslov: "Casino · igre" })),
				hub === "krov" && /* @__PURE__ */ jsx(KrunidbaKartica, {})
			]
		}, hub)
	] });
}
function KrunidbaKartica() {
	const [da, setDa] = useState(false);
	const gradevine = useGameStore((s) => s.gradevine);
	const prestige = useGameStore((s) => s.prestigeRazina);
	const krunjenja = useGameStore((s) => s.krunjenja);
	const izvrsi = useGameStore((s) => s.izvrsiPrestige);
	if (!seloNaMaxu(gradevine)) return null;
	return /* @__PURE__ */ jsxs("article", {
		className: "mb-3 rounded-2xl border border-prestige bg-prestige/15 p-4",
		"data-testid": "krunidba-kartica",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[10px] font-bold tracking-[0.22em] text-prestige uppercase",
				children: "Krunidba"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm font-bold text-ink",
				children: "Selo je puno. Dalje se ne diže."
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-xs font-bold text-ink/70",
				children: ["Kruna ostaje. Dobiješ jedno krunjenje za alate. Kauba kreće iznova — zgrade, konji i alati poslije krunidbe puno skuplje.", krunjenja > 0 ? ` Slobodno ${krunjenja}.` : prestige > 0 ? ` Imaš ${prestige}.` : ""]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => {
					playSfx("button");
					if (!da) {
						setDa(true);
						return;
					}
					playSfx("jackpot");
					izvrsi();
					setDa(false);
				},
				className: "mt-3 min-h-11 w-full rounded-xl bg-prestige text-xs font-bold tracking-widest text-void uppercase",
				children: da ? "Stvarno kruni" : "Kruni kaubu"
			})
		]
	});
}
function LikKartica({ p, rec, dar, moze, mood, nalog, jaše, crta, krupije, jeKrupije, skratiGlavu, onHub, onDaj, onKrupije }) {
	const glavni = jeGlavni(p.id);
	const [imeEdit, setImeEdit] = useState(false);
	const [imeDraft, setImeDraft] = useState(p.ime);
	const imePolje = useRef(null);
	useEffect(() => {
		if (!imeEdit) return;
		const id = window.requestAnimationFrame(() => {
			const el = imePolje.current;
			if (!el) return;
			el.focus();
			const n = el.value.length;
			try {
				el.setSelectionRange(n, n);
			} catch {
				/* stariji webview */
			}
		});
		return () => window.cancelAnimationFrame(id);
	}, [imeEdit]);
	const preimenujLika = useGameStore((s) => s.preimenujLika);
	const premjestiLika = useGameStore((s) => s.premjestiLika);
	const dajCasu = useGameStore((s) => s.dajCasu);
	const zlatoSad = useGameStore((s) => Math.floor(s.zlato));
	const plus = recSveBuff(p);
	const minus = recSveMane(p);
	const jahanje = recJahanje(p, !!jaše);
	const spremiIme = () => {
		preimenujLika(p.id, imeDraft);
		setImeEdit(false);
	};
	return /* @__PURE__ */ jsxs("article", {
		className: cn("lik-plakat mb-2 flex w-full items-center gap-3 px-3 py-2.5", glavni && "lik-glavni"),
		children: [!skratiGlavu && /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: onHub,
			className: "lik-plakat-okvir",
			children: /* @__PURE__ */ jsx(LikAvatar, {
				p,
				mood,
				veliki: true,
				jaše: !!jaše
			})
		}), /* @__PURE__ */ jsxs("span", {
			className: "min-w-0 flex-1",
			children: [
				!skratiGlavu && /* @__PURE__ */ jsxs("span", {
					className: "block text-[10px] font-bold tracking-[0.2em] text-gold uppercase",
					children: [glavni ? "★ " : "", p.posao]
				}),
				imeEdit ? /* @__PURE__ */ jsx("input", {
					ref: imePolje,
					"data-lock-pan": true,
					value: imeDraft,
					maxLength: 14,
					"aria-label": "Ime",
					onChange: (e) => setImeDraft(e.target.value),
					onBlur: spremiIme,
					onKeyDown: (e) => {
						e.stopPropagation();
						if (e.key === "Enter") spremiIme();
						if (e.key === "Escape") {
							setImeDraft(p.ime);
							setImeEdit(false);
						}
					},
					className: "mt-0.5 w-full rounded-lg border border-gold bg-void px-2 py-1 text-base font-bold text-ink"
				}) : /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => {
						playSfx("button");
						setImeDraft(p.ime);
						setImeEdit(true);
					},
					className: "block text-left text-[12px] font-bold text-ink/80",
					"aria-label": `Preimenuj ${p.ime}`,
					children: [`${glavni ? "★ " : ""}${p.ime} · lv ${p.razina}`, !skratiGlavu && (jaše ? " · na konju" : trebaKonja(p) ? " · pješke" : recBuff(p) ? ` · ${recBuff(p)}` : "")]
				}),
				crta && /* @__PURE__ */ jsx("span", {
					className: "mt-0.5 block text-[11px] font-bold text-ink/70",
					children: crta
				}),
				/* @__PURE__ */ jsx("span", {
					className: "mt-0.5 block text-[12px] font-bold text-gold",
					children: rec
				}),
				jahanje && trebaKonja(p) && !jaše && /* @__PURE__ */ jsx("span", {
					className: "mt-0.5 block text-[11px] font-bold text-ruby",
					children: jahanje
				}),
				(plus.length > 0 || minus.length > 0) && /* @__PURE__ */ jsxs("span", {
					className: "mt-1 flex flex-wrap gap-1",
					children: [plus.map((b) => /* @__PURE__ */ jsx("span", {
						className: "lik-crta lik-crta-plus",
						children: b
					}, b)), minus.map((b) => /* @__PURE__ */ jsx("span", {
						className: "lik-crta lik-crta-minus",
						children: b
					}, b))]
				}),
				nalog && /* @__PURE__ */ jsx("span", {
					className: "mt-1 block text-[11px] font-bold text-quest",
					children: nalogOd(p, nalog.tip, nalog.cilj)
				}),
				/* @__PURE__ */ jsx("span", {
					className: "mt-1.5 block h-1 overflow-hidden rounded-full bg-void",
					children: /* @__PURE__ */ jsx("span", {
						className: "block h-full rounded-full bg-gold lik-xp-traka",
						style: { width: `${likXpPostotak(p)}%` }
					})
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onHub,
							className: "min-h-9 rounded-lg border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink",
							children: "Idi"
						}),
						dar && /* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: !moze,
							onClick: onDaj,
							className: "min-h-9 rounded-lg bg-gold px-3 text-[11px] font-bold text-void disabled:bg-panel-2 disabled:text-dim",
							children: darRec(dar)
						}),
						glavni && /* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: zlatoSad < 2,
							onClick: () => dajCasu(p.id),
							className: "min-h-9 rounded-lg bg-gold px-3 text-[11px] font-bold text-void disabled:bg-panel-2 disabled:text-dim",
							children: "Kocka · 2"
						}),
						krupije && onKrupije && /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onKrupije,
							className: cn("min-h-9 rounded-lg px-3 text-[11px] font-bold", jeKrupije ? "bg-gold text-void" : "border border-line bg-panel-2 text-ink"),
							children: jeKrupije ? "Djelitelj · skini" : "Djelitelj"
						})
					]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "hub-birac mt-1.5 flex flex-wrap gap-1",
					"data-testid": "lik-hub-birac",
					children: POTREBE_META.map((h) => /* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-pressed": p.hub === h.id,
						"data-vodic": p.hub === h.id ? void 0 : "zaposli",
						onClick: () => {
							playSfx("button");
							premjestiLika(p.id, h.id);
						},
						className: cn("min-h-9 rounded-lg px-2 text-[11px] font-bold", p.hub === h.id ? "bg-gold text-void" : "border border-line bg-panel-2 text-ink"),
						children: h.naziv
					}, h.id))
				})
			]
		})]
	});
}
var KaubojiMreza = memo(function KaubojiMreza({ ljudi, odabranId, onOdaberi, onHub, moodId, jase }) {
	const gradevine = useGameStore((s) => s.gradevine);
	const gradnje = useGameStore((s) => s.gradnje);
	const ostecenja = useGameStore((s) => s.ostecenja);
	const karavana = useGameStore((s) => s.karavana);
	const jutro = useGameStore((s) => s.jutro);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
	const kamen = useGameStore((s) => Math.floor(s.resursi.kamen));
	const zeljezo = useGameStore((s) => Math.floor(s.resursi.zeljezo));
	const misije = useGameStore((s) => s.misije);
	const ljudiPopis = useGameStore((s) => s.ljudi);
	const faroKrupije = useGameStore((s) => s.faroKrupije);
	const dajLiku = useGameStore((s) => s.dajLiku);
	const postaviKrupija = useGameStore((s) => s.postaviKrupija);
	const doba = danDoba();
	return /* @__PURE__ */ jsx("div", {
		className: "kauboji-mreza",
		"data-testid": "kauboji-mreza",
		children: ljudi.map((p, i) => {
			const open = odabranId === p.id;
			const hubIme = POTREBE_META.find((h) => h.id === p.hub)?.naziv ?? p.hub;
			const gdje = gdjeJe(p, gradevine, gradnje, ostecenja, doba, karavana, ljudi);
			const nalog = jutro.find((j) => j.likId === p.id) ?? misije.find((m) => tkoZaNalog(ljudiPopis, m.tip)?.id === p.id) ?? null;
			const govor = razgovor(p, moodId, gdje.mjesto === "zgrada", gdje.zgrada, doba);
			return /* @__PURE__ */ jsxs("article", {
				className: cn("kauboj-kartica", jeGlavni(p.id) && "kauboj-kartica-glavni", open && "kauboj-kartica-otvoren"),
				style: { ["--i"]: i },
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "kauboj-glava",
					"aria-expanded": open,
					"aria-label": `${p.ime}, ${p.posao}`,
					onClick: () => {
						playSfx("button");
						onOdaberi(open ? null : p.id);
					},
					children: [/* @__PURE__ */ jsx("span", {
						className: cn("kauba-chip-avatar", jeGlavni(p.id) && "lik-glavni"),
						children: /* @__PURE__ */ jsx(LikAvatar, {
							p,
							mood: moodId,
							jaše: jase.has(p.id)
						})
					}), /* @__PURE__ */ jsxs("span", {
						className: "kauboj-glava-txt",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "kauboj-glava-posao",
								children: p.posao
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "kauboj-glava-ime",
								children: [jeGlavni(p.id) ? "★ " : "", p.ime]
							}),
							/* @__PURE__ */ jsx("span", {
								className: "kauboj-glava-hub",
								children: `uloga ${hubIme}`
							}),
							/* @__PURE__ */ jsx("span", {
								className: "kauboj-glava-hub",
								children: `sreća ${srecaLika(p)}`
							})
						]
					})]
				}), open && /* @__PURE__ */ jsx("div", {
					className: "lik-let",
					children: /* @__PURE__ */ jsx(LikKartica, {
						p,
						rec: govor.rec,
						dar: govor.dar,
						moze: govor.dar ? mozeDati(govor.dar, zlato, {
							drvo,
							kamen,
							zeljezo
						}) : false,
						mood: moodId,
						nalog,
						jaše: jase.has(p.id),
						crta: likCrta(p),
						krupije: mozeKrupije(p),
						jeKrupije: faroKrupije === p.id,
						skratiGlavu: true,
						onHub: () => onHub(p.hub),
						onDaj: () => dajLiku(p.id),
						onKrupije: () => postaviKrupija(p.id)
					})
				})]
			}, p.id);
		})
	});
});
function Potkovica() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		className: "size-4",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2.2",
		strokeLinecap: "round",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M7 7.5c0-3 2.2-5 5-5s5 2 5 5v6.5" }),
			/* @__PURE__ */ jsx("path", { d: "M7 14.5V18M17 14.5V18" }),
			/* @__PURE__ */ jsx("path", {
				d: "M9.2 10.2h.01M12 10.2h.01M14.8 10.2h.01",
				strokeWidth: "3"
			})
		]
	});
}
function KonjiKartica() {
	const gradevine = useGameStore((s) => s.gradevine);
	const ostecenja = useGameStore((s) => s.ostecenja);
	const konjiBroj = useGameStore((s) => s.konjiBroj);
	const duznost = useGameStore((s) => s.konjiDuznost);
	const sijenoDo = useGameStore((s) => s.sijenoDo);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
	const prestige = useGameStore((s) => s.prestigeRazina);
	const kupiKonja = useGameStore((s) => s.kupiKonja);
	const prodajKonja = useGameStore((s) => s.prodajKonja);
	const pomakniKonja = useGameStore((s) => s.pomakniKonja);
	const kupiSijeno = useGameStore((s) => s.kupiSijeno);
	const potkovaj = useGameStore((s) => s.potkovaj);
	const potkove = useGameStore((s) => s.potkove);
	const potkoveDo = useGameStore((s) => s.potkoveDo);
	const sad = useSekunda(sijenoDo > Date.now() || potkoveDo > Date.now());
	if ((gradevine.staja || 0) < 1 || ostecenja.staja) return null;
	const kap = konjaKap(gradevine);
	const sijenoOstalo = Math.max(0, Math.ceil((sijenoDo - sad) / 1e3));
	const potkovaOstalo = Math.max(0, Math.ceil((potkoveDo - sad) / 1e3));
	const izvor = KONJ_DUZNOSTI.find((x) => x.id !== "jahanje" && duznost[x.id] > 0)?.id ?? "jahanje";
	const konjZl = cijenaUzKrunu(16, prestige);
	const konjDr = cijenaUzKrunu(4, prestige);
	const sijenoZl = cijenaUzKrunu(6, prestige);
	return /* @__PURE__ */ jsxs("article", {
		className: "potreba-stalak",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "potreba-stalak-znak",
				"aria-hidden": true,
				children: /* @__PURE__ */ jsx(Potkovica, {})
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "potreba-stalak-ime",
				children: "Sajam konja"
			}), /* @__PURE__ */ jsxs("p", {
				className: "potreba-stalak-rec",
				children: [
					konjiBroj,
					"/",
					kap,
					" pod uzdom. Potkove ",
					potkove,
					".",
					potkovaOstalo > 0 ? ` Kopita još ${potkovaOstalo}s.` : ""
				]
			})] }),
			/* @__PURE__ */ jsx("div", {
				className: "mt-2 grid grid-cols-2 gap-1.5",
				children: KONJ_DUZNOSTI.map((d) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-xl border border-line bg-void/40 px-2 py-1.5",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-[10px] font-bold tracking-wide text-gold uppercase",
							children: d.naziv
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] font-bold text-ink/70",
							children: d.rec
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-1 flex items-center gap-1",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: duznost[d.id] < 1,
									onClick: () => pomakniKonja(d.id, d.id === "jahanje" ? izvor : "jahanje"),
									className: "min-h-8 min-w-8 rounded-full border border-line bg-panel-2 text-sm font-bold text-ink disabled:text-dim",
									children: "−"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "min-w-6 text-center text-sm font-bold tabular-nums text-ink",
									children: duznost[d.id]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: (d.id === "jahanje" ? izvor === "jahanje" : duznost.jahanje < 1) || konjiBroj < 1,
									onClick: () => pomakniKonja(d.id === "jahanje" ? izvor : "jahanje", d.id),
									className: "min-h-8 min-w-8 rounded-full bg-gold text-sm font-bold text-void disabled:bg-panel-2 disabled:text-dim",
									children: "+"
								})
							]
						})
					]
				}, d.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: zlato < konjZl || drvo < konjDr || konjiBroj >= kap,
						onClick: () => kupiKonja(),
						className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
						children: [
							"Uzmi konja · ",
							konjZl,
							"g ",
							konjDr,
							"d"
						]
					}),
					kap - konjiBroj >= 5 && /* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: zlato < konjZl * 5 || drvo < konjDr * 5,
						onClick: () => kupiKonja(5),
						className: "min-h-10 rounded-full border border-gold/50 bg-gold/15 px-3 text-[11px] font-bold tracking-wide text-gold uppercase disabled:border-line disabled:bg-panel-2 disabled:text-dim",
						children: [
							"Uzmi pet · ",
							konjZl * 5,
							"g"
						]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: konjiBroj < 1,
						onClick: prodajKonja,
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: "Prodaj"
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: zlato < sijenoZl || konjiBroj < 1,
						onClick: kupiSijeno,
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: [/* @__PURE__ */ jsx(Wheat, {
							className: "mr-1 inline size-3.5",
							"aria-hidden": true
						}), sijenoOstalo > 0 ? `Sijeno ${sijenoOstalo}s` : `Sijeno · ${sijenoZl}g`]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: potkove < 1 || konjiBroj < 1,
						onClick: potkovaj,
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: potkovaOstalo > 0 ? `Potkovaj · ${potkovaOstalo}s` : "Potkovaj · 1"
					})
				]
			})
		]
	});
}
function LijekKartica() {
	const ordinacija = useGameStore((s) => s.gradevine.ordinacija || 0);
	const travar = useGameStore((s) => s.gradevine.travar || 0);
	const banja = useGameStore((s) => s.gradevine.banja || 0);
	const ostecenja = useGameStore((s) => s.ostecenja);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const travaDo = useGameStore((s) => s.travaDo);
	const lijeci = useGameStore((s) => s.lijeci);
	const sad = useSekunda(travaDo > Date.now());
	const imaOrdinaciju = ordinacija > 0 && !ostecenja.ordinacija;
	const imaTravara = travar > 0 && !ostecenja.travar;
	const imaBanju = banja > 0 && !ostecenja.banja;
	if (!imaOrdinaciju && !imaTravara && !imaBanju) return null;
	const travaOstalo = Math.max(0, Math.ceil((travaDo - sad) / 1e3));
	return /* @__PURE__ */ jsxs("article", {
		className: "mb-2 rounded-2xl border border-line bg-panel p-3",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[10px] font-bold tracking-[0.2em] text-gold uppercase",
				children: "Liječi"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 text-[12px] font-bold text-ink/80",
				children: travaOstalo > 0 ? `Trava u kaubi. Zabava diže. Još ${travaOstalo}s.` : "Rana ne čeka. Trava, voda ili zavoj."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [
					imaOrdinaciju && /* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: zlato < 8,
						onClick: () => lijeci("ordinacija"),
						className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
						children: "Liječi · 8"
					}),
					imaTravara && /* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: zlato < 5,
						onClick: () => lijeci("travar"),
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: travaOstalo > 0 ? `Travar ${travaOstalo}s` : "Zovi travara · 5"
					}),
					imaBanju && /* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: zlato < 6,
						onClick: () => lijeci("banja"),
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: "Operi · 6"
					})
				]
			})
		]
	});
}
function VodaKartica() {
	const lv = useGameStore((s) => s.gradevine.cisterna || 0);
	const gori = useGameStore((s) => s.ostecenja.cisterna);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const kisaDo = useGameStore((s) => s.kisaDo);
	const prestige = useGameStore((s) => s.prestigeRazina);
	const skupi = useGameStore((s) => s.skupiKisu);
	const sad = useSekunda(kisaDo > Date.now());
	if (lv < 1 || gori) return null;
	const ostalo = Math.max(0, Math.ceil((kisaDo - sad) / 1e3));
	const kisaZl = cijenaUzKrunu(5, prestige);
	return /* @__PURE__ */ jsxs("article", {
		className: "potreba-stalak",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "potreba-stalak-znak",
				"aria-hidden": true,
				children: /* @__PURE__ */ jsx(CloudRain, { className: "size-4" })
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "potreba-stalak-ime",
				children: "Kišnica"
			}), /* @__PURE__ */ jsx("p", {
				className: "potreba-stalak-rec",
				children: ostalo > 0 ? `Krov hvata kišu. Još ${ostalo}s.` : `Skupi kišnicu s krova. ${kisaZl} zlata.`
			})] }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				disabled: zlato < kisaZl,
				onClick: skupi,
				className: "mt-2 min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
				children: ostalo > 0 ? `Kiša ${ostalo}s` : `Skupi kišu · ${kisaZl}g`
			})
		]
	});
}
function GovedaKartica() {
	const gradevine = useGameStore((s) => s.gradevine);
	const ostecenja = useGameStore((s) => s.ostecenja);
	const govedaBroj = useGameStore((s) => s.govedaBroj);
	const duznost = useGameStore((s) => s.govedaDuznost);
	const jahanje = useGameStore((s) => s.konjiDuznost.jahanje);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const drvo = useGameStore((s) => Math.floor(s.resursi.drvo));
	const prestige = useGameStore((s) => s.prestigeRazina);
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
	const govedoZl = cijenaUzKrunu(12, prestige);
	const govedoDr = cijenaUzKrunu(3, prestige);
	const rec = govedaBroj < 1 ? "Tor prazan. Firma stoji." : tijesno >= 1 ? "Tor pun. Gazda hoće još. Referent šuti." : tijesno > 0 ? "Koža je tijesna. Gazda viče. Referent broji." : "Gazda kaže. Goniči tjeraju.";
	const puno = kap > 0 ? Math.min(100, Math.round(govedaBroj / kap * 100)) : 0;
	const tockice = Math.min(govedaBroj, 12);
	return /* @__PURE__ */ jsxs("article", {
		className: cn("mb-2 overflow-hidden rounded-2xl border bg-panel", tijesno > 0 ? "border-ruby/70" : "border-line"),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative h-24 overflow-hidden",
			"aria-hidden": true,
			children: [
				/* @__PURE__ */ jsx("img", {
					src: ZGRADA_ART.tor,
					alt: "",
					className: "size-full object-cover object-[center_42%]",
					draggable: false
				}),
				/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-panel via-panel/50 to-transparent" }),
				/* @__PURE__ */ jsxs("div", {
					className: "absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-2",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-[10px] font-bold tracking-[0.22em] text-gold uppercase",
						children: "Firma"
					}), /* @__PURE__ */ jsxs("p", {
						className: "font-display text-2xl leading-none text-ink",
						children: [govedaBroj, /* @__PURE__ */ jsxs("span", {
							className: "text-sm text-dim",
							children: ["/", kap]
						})]
					})]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "px-3 pb-3",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "h-1.5 overflow-hidden rounded-full bg-void",
					"aria-hidden": true,
					children: /* @__PURE__ */ jsx("div", {
						className: cn("h-full rounded-full", tijesno > 0 ? "bg-ruby" : "bg-gold"),
						style: { width: `${puno}%` }
					})
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-2 flex min-h-4 flex-wrap items-center gap-1",
					children: govedaBroj < 1 ? /* @__PURE__ */ jsx("span", {
						className: "text-[10px] font-bold tracking-wide text-dim uppercase",
						children: "Tor prazan"
					}) : /* @__PURE__ */ jsxs(Fragment, { children: [Array.from({ length: tockice }, (_, i) => /* @__PURE__ */ jsx("span", { className: "size-2 rounded-full bg-gold" }, i)), govedaBroj > tockice && /* @__PURE__ */ jsxs("span", {
						className: "text-[10px] font-bold text-dim",
						children: ["+", govedaBroj - tockice]
					})] })
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1.5 text-[12px] font-bold leading-snug text-ink/80",
					children: rec
				}),
				(gazda || referent) && /* @__PURE__ */ jsx("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: [gazda, referent].filter(Boolean).map((p) => /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1 rounded-full border border-line bg-void/40 py-0.5 pr-2 pl-0.5 text-[11px] font-bold text-ink",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "size-7 overflow-hidden rounded-full",
								children: /* @__PURE__ */ jsx(LikAvatar, {
									p,
									mood: "mir"
								})
							}),
							p.ime,
							/* @__PURE__ */ jsx("span", {
								className: "text-dim",
								children: p.posao
							})
						]
					}, p.id))
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-2 grid grid-cols-3 gap-1.5",
					children: GOVEDO_DUZNOSTI.map((d) => /* @__PURE__ */ jsxs("div", {
						className: "rounded-xl border border-line bg-void/40 px-2 py-1.5 text-center",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-[10px] font-bold tracking-wide text-gold uppercase",
							children: d.naziv
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-1 flex items-center justify-center gap-1",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: duznost[d.id] < 1,
									onClick: () => pomakniGovedo(d.id, d.id === "pasa" ? izvor : "pasa"),
									className: "size-7 rounded-full border border-line bg-panel-2 text-sm font-bold text-ink disabled:text-dim",
									children: "−"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "min-w-5 text-sm font-bold tabular-nums text-ink",
									children: duznost[d.id]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: (d.id === "pasa" ? izvor === "pasa" : duznost.pasa < 1) || govedaBroj < 1,
									onClick: () => pomakniGovedo(d.id === "pasa" ? izvor : "pasa", d.id),
									className: "size-7 rounded-full bg-gold text-sm font-bold text-void disabled:bg-panel-2 disabled:text-dim",
									children: "+"
								})
							]
						})]
					}, d.id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: zlato < govedoZl || drvo < govedoDr || govedaBroj >= kap,
							onClick: () => kupiGovedo(1),
							className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
							children: ["Uzmi · ", govedoZl]
						}),
						kap - govedaBroj >= 5 && /* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: zlato < govedoZl * 5 || drvo < govedoDr * 5,
							onClick: () => kupiGovedo(5),
							className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
							children: "Pet"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							disabled: govedaBroj < 1,
							onClick: prodajGovedo,
							className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
							children: "Prodaj"
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: govedaBroj < 1 || jahanje < 1,
							onClick: tjerajGovedo,
							className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
							children: [
								"Tjeraj · ",
								10 * tjerajN,
								"g"
							]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: govedaBroj < 1,
							onClick: koljiGovedo,
							className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
							children: [
								"Kolji · ",
								7,
								"g"
							]
						})
					]
				})
			]
		})]
	});
}
function ZatvorKartica() {
	const ured = useGameStore((s) => s.gradevine.ured || 0);
	const gori = useGameStore((s) => s.ostecenja.ured);
	const n = useGameStore((s) => s.celijaBroj);
	const strpaj = useGameStore((s) => s.strpajCeliju);
	const pusti = useGameStore((s) => s.pustiCeliju);
	if (ured < 1 || gori) return null;
	return /* @__PURE__ */ jsxs("article", {
		className: "mb-2 rounded-2xl border border-line bg-panel p-3",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[10px] font-bold tracking-[0.22em] text-gold uppercase",
				children: "Ćelija"
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-[12px] font-bold text-ink/80",
				children: [
					n,
					"/3 iza rešetaka. ",
					n < 1 ? "Prazna. Zakon čeka." : "Zakon diše."
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					disabled: n >= 3,
					onClick: strpaj,
					className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
					children: "Strpaj"
				}), /* @__PURE__ */ jsxs("button", {
					type: "button",
					disabled: n < 1,
					onClick: pusti,
					className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
					children: [
						"Pusti · ",
						n * 8,
						"g"
					]
				})]
			})
		]
	});
}
function MetciKartica() {
	const metci = useGameStore((s) => s.metci);
	const gradevine = useGameStore((s) => s.gradevine);
	const ostecenja = useGameStore((s) => s.ostecenja);
	const zadnji = useGameStore((s) => s.zadnjiMetakTick);
	const gain = metciPoObnovi(gradevine, ostecenja);
	const potkoveGain = potkovePoObnovi(gradevine, ostecenja);
	const sad = useSekunda(gain >= 1 || potkoveGain >= 1);
	const ostalo = gain < 1 ? 0 : Math.max(0, Math.ceil((zadnji + METAK_OBNOVA_MS - sad) / 1e3));
	const min = Math.floor(ostalo / 60);
	const sek = ostalo % 60;
	const zajednicka = Math.min(ostecenja.kovacnica ? 0 : gradevine.kovacnica || 0, ostecenja.barutana ? 0 : gradevine.barutana || 0);
	return /* @__PURE__ */ jsxs("article", {
		className: "potreba-stalak",
		"data-testid": "metci-kartica",
		children: [/* @__PURE__ */ jsx("span", {
			className: "potreba-stalak-znak",
			"aria-hidden": true,
			children: /* @__PURE__ */ jsx(Crosshair, { className: "size-4" })
		}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
			className: "potreba-stalak-ime",
			children: ["Metci · ", metci]
		}), /* @__PURE__ */ jsx("p", {
			className: "potreba-stalak-rec",
			children: gain < 1 ? potkoveGain > 0 ? `Kovačnica kuje ${potkoveGain === 1 ? "1 potkovu" : `${potkoveGain} potkove`} na 6 min. Metci čekaju barutanu.` : "Kovačnica i barutana ne prodaju. Kad obje stoje, metak se sam vrati." : `Zajednička razina ${zajednicka}. Svakih 6 min +${gain} metak i +${potkoveGain} potkova. Još ${min}:${String(sek).padStart(2, "0")}.`
		})] })]
	});
}
function TrgovinaKartica() {
	const lv = useGameStore((s) => s.gradevine.trgovina || 0);
	const gori = useGameStore((s) => s.ostecenja.trgovina);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const kupi = useGameStore((s) => s.trgovinaKupi);
	if (lv < 1 || gori) return null;
	const kolicina = 4 + lv;
	return /* @__PURE__ */ jsxs("article", {
		className: "potreba-stalak",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "potreba-stalak-znak",
				"aria-hidden": true,
				children: /* @__PURE__ */ jsx(Store, { className: "size-4" })
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "potreba-stalak-ime",
				children: "Trgovina"
			}), /* @__PURE__ */ jsxs("p", {
				className: "potreba-stalak-rec",
				children: [
					"Tezga. 8 zlata, +",
					kolicina,
					" zalihe."
				]
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [[
					"drvo",
					"kamen",
					"zeljezo"
				].map((res) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					disabled: zlato < 8,
					onClick: () => kupi(res),
					className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
					children: [res, " · 8"]
				}, res)), /* @__PURE__ */ jsx("button", {
					type: "button",
					disabled: zlato < 12,
					onClick: () => useGameStore.getState().kupiMetke(),
					className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
					children: "metci · 12"
				})]
			})
		]
	});
}
function BankaKartica() {
	const lv = useGameStore((s) => s.gradevine.banka || 0);
	const gori = useGameStore((s) => s.ostecenja.banka);
	const seif = useGameStore((s) => s.bankaZlato);
	const zlato = useGameStore((s) => Math.floor(s.zlato));
	const spremi = useGameStore((s) => s.bankaSpremi);
	const uzmi = useGameStore((s) => s.bankaUzmi);
	if (lv < 1 || gori) return null;
	return /* @__PURE__ */ jsxs("article", {
		className: "mb-2 rounded-2xl border border-line bg-panel p-3",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "text-[10px] font-bold tracking-[0.2em] text-gold uppercase",
				children: "Banka"
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "mt-1 text-[12px] font-bold text-ink/80",
				children: [
					"Sef ",
					Math.floor(seif),
					" zlata. Pohod ne dira. Kamata spava unutra."
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: [
					[
						100,
						500,
						2e3
					].map((n) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: zlato < n,
						onClick: () => spremi(n),
						className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
						children: ["Spremi ", n]
					}, `s${n}`)),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: zlato < 1,
						onClick: () => spremi(zlato),
						className: "min-h-10 rounded-full bg-gold px-3 text-[11px] font-bold tracking-wide text-void uppercase disabled:bg-panel-2 disabled:text-dim",
						children: "Spremi sve"
					}),
					[
						100,
						500,
						2e3
					].map((n) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: seif < n,
						onClick: () => uzmi(n),
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: ["Uzmi ", n]
					}, `u${n}`)),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						disabled: seif < 1,
						onClick: () => uzmi(Math.floor(seif)),
						className: "min-h-10 rounded-full border border-line bg-panel-2 px-3 text-[11px] font-bold text-ink disabled:text-dim",
						children: "Uzmi sve"
					})
				]
			})
		]
	});
}
