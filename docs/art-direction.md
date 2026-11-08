# Kauba — umjetnički smjer

Izometrija 2:1. Jedan izvor svjetla, gore-lijevo. Sve sjene idu dolje-desno. Rasvjeta je topla i zlatna, kao kasno poslijepodne. Obrub je tanki tamnosmeđi, crtež je ručno slikan crtani stil.

## Paleta

- Zemlja: `#8A5A32`, `#A9744A`, `#C79A5E`
- Drvo: `#6B4226`, `#8B5A2B`
- Krovovi: crvenkasta glina `#A0452E`, zeleni lim `#5E7A5A`
- Akcenti: `#E0B84D`, `#E07A3D`
- Tama: `#2B1814`
- Bez plave podloge. Noć je tamnija topla zemlja i toplo svjetlo prozora.

## Hijerarhija

Zgrade su najkontrastnije. Ceste su srednje. Tlo je najmirnije. Dekor (trava, kamenčić, prašina) nikad nije jači od zgrade.

Siluete su čiste. Blagi ambijentalni sjena (`sjena.webp`) sjedi uz dno zida. Sprite je sidren na sredinu ćelije (`object-position: center`).

## Što je na karti

Naselje nije rešetka. Jedan grad (trg) i četiri naselja (ranč, selo, farma, rudnik) stoje u grozdovima. Cesta je vijugava, šira od prilaza, s tamnijim tragom po sredini. Potok, lokva i gaz spajaju ranč, farmu i rudnik. Njive, livada i kamen imaju vlastitu teksturu. Sitni rekviziti (sijeno, lampa, ograda, strašilo) stoje izvan kuće i tiši su od spritea.

Zgrade, dodir, natpisi i izbornik ostaju u DOM-u jer se na njih tapka. Geometrija terena živi u `src/lib/game/teren.ts` i crta se jednim statičnim SVG-om, bez crtanja po frameu. Dubina je `z-index` po y.

Stari obzor (kanjon, suho korito, pruga, vlak, daleki ranč) se ne crta. Paleta ostaje topla zemlja. Voda je tamnozelena, ne plava podloga.

Sprite-ovi zgrada su prozirni WebP u `public/art/zgrade/izo/`, predmemorija `v=56`. a je razina 1–2, b je 3–5, c je 6+. Svaka zgrada ima barem a i b. c imaju kuća, salun, farma, ured, kamenolom, rudnik, konak, lovački dom, cisterna, ispust, staza, tor i travar.

Mjehurić iznad pilane, kamenoloma i rudnika samo pokazuje robu koja već kaplje u HUD. Dodir je animacija, ne drugi izvor. Bačva, ograda i kola su u samom crtežu zgrade, ne kao drugi sloj. Gradilište ne mijenja kutiju ni cijenu.

Dan je toplo svijetao, sumrak zlatan, noć tamna zemlja. Oblak i tumbleweed staju kad je smanjen pokret ili kad kauba nije na ekranu.
