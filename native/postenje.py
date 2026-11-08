#!/usr/bin/env python3
"""Ispit žive vrtnje. Zbraja uzorak. Ne mijenja isplatu."""

import json
import sys
from pathlib import Path

PUT = Path(__file__).with_name("vrtnje.json")


def main() -> int:
    if not PUT.exists():
        print("Nema uzorka.")
        return 1
    redovi = json.loads(PUT.read_text())
    if not isinstance(redovi, list) or len(redovi) < 1000:
        print("Uzorak je prekratak.")
        return 1
    ulog = zlato = linije = jackpot = pogodaka = 0
    drvo = kamen = zeljezo = dijamanti = 0
    for r in redovi:
        u = int(r["ulog"])
        z = int(r["zlato"])
        n = int(r["linije"])
        j = bool(r["jackpot"])
        if u < 1 or z < 0 or n < 0 or int(r["drvo"]) < 0:
            print("Red nije valjan.")
            return 1
        if j and n < 1:
            print("Jackpot bez linije.")
            return 1
        ulog += u
        zlato += z
        linije += n
        jackpot += 1 if j else 0
        pogodaka += 1 if n else 0
        drvo += int(r["drvo"])
        kamen += int(r["kamen"])
        zeljezo += int(r["zeljezo"])
        dijamanti += int(r["dijamanti"])
    print("ziva pravila")
    print(f"vrtnji {len(redovi)}")
    print(f"pogodaka {pogodaka} ({pogodaka / len(redovi):.3f})")
    print(f"zlato {zlato} povrat {zlato / ulog:.4f}")
    print(f"drvo {drvo} kamen {kamen} zeljezo {zeljezo} dijamanti {dijamanti}")
    print(f"jackpot {jackpot}")
    print("prolaz")
    return 0


if __name__ == "__main__":
    sys.exit(main())
