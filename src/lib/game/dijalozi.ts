import type { DanDoba, Stanovnik } from "./ljudi";

/** Hommage: kratke ploče, šerifov glas. Ne prepisujemo scenarij. */

const TESNA = [
  "Koža je tijesna. Plaća još tjesnija.",
  "Gazda viče. Referent broji. Nitko ne diše.",
  "Hoćeš da te pregazi kola? Skoči.",
  "Sve ću da ih otjeram s ulice.",
  "Nema veze. Važno je da se radi.",
  "Stan je mali. Firma još manja.",
  "Plaća tanka. Kruh tvrđi.",
  "Ti si mi kao sin. Zato radi.",
  "Sine, firma nije cirkus. Ti si klaun.",
  "Račun je točan. Život nije.",
  "Referent, piši. Gazda, šuti.",
  "Džep prazan. Usta puna savjeta.",
];

const SELA_GORE = [
  "Lijepa sela lijepo gore.",
  "Kad je suho, i lijepo selo gori.",
  "U tunelu je mir. Van prašina.",
  "Veliki požar. Mali ljudi.",
  "Zalij kaubu dok je lijepa.",
  "Dim ide uzbrdo. Mi nizbrdo.",
  "Lijepo gori kad nitko ne čuva bunar.",
  "Selo gori. Trg stoji.",
  "Tunel ne bira. Vatra bira suho.",
  "Lijepo je bilo. Sad je dim.",
  "Brat bratu. Onda vatra.",
  "Ne gori selo. Gori dogovor.",
];

const MARATON = [
  "Nema smrti dok šerif drži kaubu.",
  "Maratonci trče počasni krug. Mi stojimo.",
  "Bilo jednom jedno selo. Još trči.",
  "Topola se njiše. Mi ne.",
  "Živi li tko ovdje? Živi. I plaća.",
  "Počasni krug. Onda mir.",
  "Smrt čeka. Mi brojimo zlato.",
  "Trče u krug. Kauba ide naprijed.",
  "Pokojni trče. Živi sjede.",
  "Nasljedstvo čeka. Mi ne damo ključ.",
  "Četiri brata. Jedna kuća. Nula mira.",
  "Smrt je sporija od maratona.",
];

const VALTER = [
  "Valter. To je ovaj grad.",
  "Grad se ne predaje. Ni kauba.",
  "Čuju se koraci. Nisu naši.",
  "Valter je svuda. I nigdje.",
  "Most stoji. Mi držimo most.",
  "Ime je lozinka. Lozinka je zakon.",
  "Noćas ne spavaju. Ni mi.",
  "Grad diše. Mi čuvamo dah.",
  "Das ist Walter. To je ulica.",
  "Čekam te u pet. Ne kasni.",
  "Valter nije čovjek. Valter je kauba.",
  "Grad je junak. Mi smo statisti.",
];

const PEVA = [
  "Mi nismo stigli. Autobus jeste.",
  "Rat je blizu. Vozač vozi.",
  "Tko pjeva, zlo ne misli. Tko šuti, broji.",
  "Jedno mjesto. Nema mjesta.",
  "Dva palca. Jedna prašina. Nula vode.",
  "Pjevaju. Put se ne skraćuje.",
  "Stigli bismo. Da nas nisu stigli.",
  "Veselo je. Zato je opasno.",
];

const SPIJUN = [
  "Svi su sumnjivi. I ti.",
  "Slušam. Zid ima uši.",
  "Nije špijun. Još.",
  "Susjed kopa. Ja brojim korake.",
  "Prozor zatvoren. Uho otvoreno.",
  "Ilija čuva zemlju. Zemlja ne čuva Iliju.",
  "Špijun spava. Šerif ne.",
  "Prijava je hrabrost. I bolest.",
];

const WINNETOU = [
  "Moj brat. Moja puška. Moj zakon.",
  "Veliki duh vidi prašinu.",
  "Winnetou ne laže. Ni šerif.",
  "Srebrno jezero čeka. Mi kopamo.",
  "Apache i kauboj. Isti prah.",
  "Old Shatterhand mjeri. Onda puca.",
  "Neretva je daleko. Paklenica bliža.",
  "Poglavica je pao. Zakon stoji.",
  "Paklenica je Arizona. Mi smo kući.",
  "Plitvice nisu jezero. Jesu blago.",
  "Jadran drži konje. Šerif drži zakon.",
  "Shatterhand mjeri pesnicom. Mi metkom.",
  "Zlato kvari. Bratstvo drži.",
  "Kanjon ne laže. Željeznica laže.",
];

const MOST = [
  "Most se ruši. Mi prelazimo.",
  "Tigar vodi. Most ne pita.",
  "Jedan prolaz. Nula izlaza.",
  "Mina ispod daske. Zakon iznad.",
  "Ne čuvaj most. Sruši ga na vrijeme.",
  "Voda ispod. Vatra iznad.",
  "Posljednji prelazi. Prvi pali fitilj.",
  "Most drži kraj. Mi držimo most.",
];

const LESI = [
  "Kapetan na granici. Zakon na sedlu.",
  "Leši jaše. Kauba plaća trag.",
  "Nema posade. Ima čovjeka.",
  "Granica je kratka. Pravda duža.",
  "Jedan kapetan. Sto koraka prašine.",
  "Puška za leđima. Zvijezda na prsima.",
  "Tko jaše sam, jaše točno.",
  "Trag u prašini. Ime na plakatu.",
];

const NERETVA = [
  "Neretva nosi. Mi ne damo most.",
  "Ranjenik prvi. Top drugi.",
  "Kozara šuti. Šuma ne.",
  "Pet ofenziva. Jedna kauba.",
  "Burton na Sutjesci. Mi na trgu.",
  "Bratstvo u blatu. Jedinstvo u prašini.",
  "Spektakl je rat. Rat je posao.",
  "Rijeka bira. Mi biramo stranu.",
];

const DIVERZANTI = [
  "Prljavi tucet. Čista naredba.",
  "Diverzant ne čeka. Pali.",
  "Eskadrila u zraku. Mi u blatu.",
  "Tigar. Most. Fitilj.",
  "Nema imena. Ima zadatak.",
  "Jedan most. Sedam ljudi. Nula povratka.",
  "Akcija, ne govor.",
  "Šiba reže kadar. Mi režemo most.",
];

const LEONE = [
  "Dobar, loš, ružan. Svi plaćaju.",
  "Kad pištolj zapjeva, ulica šuti.",
  "Nema imena. Ima račun.",
  "Harmonika. Onda prašina.",
  "Tri križa. Jedan blago.",
  "Za šaku dolara. Za šaku kaube.",
  "Jednom na zapadu. Svaki dan ovdje.",
  "Grobar čeka. Mi kasnimo namjerno.",
];

const PODNE = [
  "Podne. Nema pomoći.",
  "Sat kuca. Mi stojimo.",
  "Otišli su. Zvijezda ostaje.",
  "Jedan čovjek. Jedna ulica. Jedno podne.",
  "Vlak stiže. Zakon ne odlazi.",
  "Oprosti. Ne opraštam. Stojim.",
  "Žena na kolodvoru. Šerif na trgu.",
  "Tri metka. Dva svjedoka. Nula prijatelja.",
];

const SEDAM = [
  "Sedam. Kauba plaća koliko može.",
  "Došli smo za zlato. Ostajemo za ljude.",
  "Sela se brane. I kad ne umiju.",
  "Pištolj je alat. Ne igračka.",
  "Shane se ne vraća. Mi ostajemo.",
  "Huckleberry. Grob. Izbor.",
  "Reci kad. Ja već stojim.",
  "Hoćeš li me ubiti. Pokušaj.",
];

const KNJIGA = [
  "Na Drini ćuprija. Kod nas brod.",
  "Most traje. Ljudi prelaze.",
  "Vrijeme jede kamen. Mi jedemo kruh.",
  "Derviš i smrt. Šerif i zakon.",
  "Šutnja je teža od kazne.",
  "Tko sam. I kome služim.",
  "Čojstvo i junaštvo. Onda porez.",
  "Gorski vijenac. Ravna prašina.",
  "Tko je čovjek. Tko je vuk.",
  "Prašina si. U prašinu ideš. Umeđu zlato.",
  "Oko za oko. Šerif za ulicu.",
  "Kuća na Drini. Zakon na trgu.",
];

const SVE = [
  ...TESNA, ...SELA_GORE, ...MARATON, ...VALTER, ...PEVA, ...SPIJUN,
  ...WINNETOU, ...MOST, ...LESI, ...NERETVA, ...DIVERZANTI,
  ...LEONE, ...PODNE, ...SEDAM, ...KNJIGA,
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function iz(lista: readonly string[], kljuc: string) {
  return lista[hash(kljuc) % lista.length]!;
}

export function recTesna(kljuc: string) {
  return iz(TESNA, kljuc);
}

export function recSelaGore(kljuc: string) {
  return iz(SELA_GORE, kljuc);
}

export function recMaraton(kljuc: string) {
  return iz(MARATON, kljuc);
}

export function recValter(kljuc: string) {
  return iz(VALTER, kljuc);
}

export function recPeva(kljuc: string) {
  return iz(PEVA, kljuc);
}

export function recSpijun(kljuc: string) {
  return iz(SPIJUN, kljuc);
}

export function recWinnetou(kljuc: string) {
  return iz(WINNETOU, kljuc);
}

export function recMost(kljuc: string) {
  return iz(MOST, kljuc);
}

export function recLesi(kljuc: string) {
  return iz(LESI, kljuc);
}

export function recNeretva(kljuc: string) {
  return iz(NERETVA, kljuc);
}

export function recDiverzanti(kljuc: string) {
  return iz(DIVERZANTI, kljuc);
}

export function recLeone(kljuc: string) {
  return iz(LEONE, kljuc);
}

export function recPodne(kljuc: string) {
  return iz(PODNE, kljuc);
}

export function recSedam(kljuc: string) {
  return iz(SEDAM, kljuc);
}

export function recKnjiga(kljuc: string) {
  return iz(KNJIGA, kljuc);
}

export function recFilma(p: Pick<Stanovnik, "id" | "ime" | "posao" | "hub">, mood: string) {
  const k = `${p.id}:${mood}:${p.hub}`;
  if (mood === "nered" || p.posao === "Šerif" || p.posao === "Zamjenik") return recLesi(k);
  if (mood === "glad" || p.posao === "Gazda" || p.posao === "Referent") return recTesna(k);
  if (mood === "susa" || mood === "krov") return recMost(k);
  if (p.hub === "jelo") return recTesna(k);
  if (p.hub === "red") return recDiverzanti(k);
  if (p.hub === "zabava") return recTesna(`${k}:salun`);
  if (p.hub === "voda" || p.hub === "zdravlje") return recNeretva(k);
  if (p.hub === "konji") return recLesi(`${k}:konj`);
  return iz(SVE, k);
}

export function recTrga(doba: DanDoba, mood: string) {
  if (mood === "nered") return recDiverzanti(`trg:${doba}:red`);
  if (mood === "glad") return recTesna(`trg:${doba}:glad`);
  if (mood === "susa") return recMost(`trg:${doba}:voda`);
  if (doba === "jutro") return recValter(`trg:${doba}:jutro`);
  if (doba === "dan") return recWinnetou(`trg:${doba}:dan`);
  if (doba === "suton") return recLesi(`trg:${doba}:suton`);
  return recNeretva(`trg:${doba}:noc`);
}

export function recUlicaFilma(doba: DanDoba) {
  if (doba === "jutro") return recLesi(`ulica:${doba}`);
  if (doba === "dan") return recWinnetou(`ulica:${doba}`);
  if (doba === "suton") return recMost(`ulica:${doba}`);
  return recValter(`ulica:${doba}`);
}

export type SerifPlakat = { id: string; stem: string; rec: string; alarm?: boolean };

const KORPUS: { id: string; stem: string; uzmi: (dan: string) => string }[] = [
  { id: "sela", stem: "OPREZ", uzmi: (d) => recSelaGore(`${d}:sela`) },
  { id: "tesna", stem: "FIRMA", uzmi: (d) => recTesna(`${d}:firma`) },
  { id: "maraton", stem: "TRG", uzmi: (d) => recMaraton(`${d}:trg`) },
  { id: "valter", stem: "STRAŽA", uzmi: (d) => recValter(`${d}:valter`) },
  { id: "peva", stem: "PUT", uzmi: (d) => recPeva(`${d}:peva`) },
  { id: "spijun", stem: "UHO", uzmi: (d) => recSpijun(`${d}:uho`) },
  { id: "winnetou", stem: "ZAKON", uzmi: (d) => recWinnetou(`${d}:win`) },
  { id: "most", stem: "MOST", uzmi: (d) => recMost(`${d}:most`) },
  { id: "lesi", stem: "GRANICA", uzmi: (d) => recLesi(`${d}:lesi`) },
  { id: "neretva", stem: "RIJEKA", uzmi: (d) => recNeretva(`${d}:neretva`) },
  { id: "diverzanti", stem: "AKCIJA", uzmi: (d) => recDiverzanti(`${d}:div`) },
  { id: "leone", stem: "PRAŠINA", uzmi: (d) => recLeone(`${d}:leone`) },
  { id: "podne", stem: "PODNE", uzmi: (d) => recPodne(`${d}:podne`) },
  { id: "sedam", stem: "SELO", uzmi: (d) => recSedam(`${d}:sedam`) },
  { id: "rijec", stem: "RIJEČ", uzmi: (d) => recKnjiga(`${d}:rijec`) },
];

export function serifPlakati(opts: {
  poruka?: string;
  serifova?: boolean;
  mood: string;
  usko: string | null;
  danKey?: string;
}): SerifPlakat[] {
  const dan = opts.danKey ?? "dan";
  const out: SerifPlakat[] = [];
  if (opts.serifova && opts.poruka) {
    out.push({ id: "zivo", stem: "ŠERIF", rec: opts.poruka, alarm: true });
  }
  if (opts.mood === "nered" || opts.usko === "red") {
    out.push({ id: "red", stem: "RED", rec: recMaraton(`${dan}:red`), alarm: true });
  } else if (opts.mood === "glad" || opts.usko === "jelo") {
    out.push({ id: "glad", stem: "FIRMA", rec: recTesna(`${dan}:glad`) });
  } else if (opts.usko === "voda" || opts.mood === "susa") {
    out.push({ id: "susa", stem: "VODA", rec: recSelaGore(`${dan}:voda`), alarm: true });
  }
  const start = hash(dan) % KORPUS.length;
  for (let i = 0; i < KORPUS.length && out.length < 6; i++) {
    const k = KORPUS[(start + i) % KORPUS.length]!;
    out.push({ id: k.id, stem: k.stem, rec: k.uzmi(dan) });
  }
  const vidjeno = new Set<string>();
  return out.filter((p) => {
    if (vidjeno.has(p.rec)) return false;
    vidjeno.add(p.rec);
    return true;
  }).slice(0, 6);
}
