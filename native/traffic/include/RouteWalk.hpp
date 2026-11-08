#pragma once

#include "RoadNetwork.hpp"

// Jedan agent na već izračunatoj ruti.
// routeLen > 0: cijeli put, toliko čvorova.
// routeLen < 0: krnji prefiks, hodaj -routeLen čvorova pa traži nastavak.
// state: 0 hoda ili je stigao, 1 treba novi put, 2 zapelo (find nije našao put).
struct RouteCursor {
  int pos = 0;
  int routeLen = 0;
  int state = 0;
  int seenGen = 0;
};

// findResult je povrat iz Pathfinder::find. keptCap je koliko je čvorova stvarno upisano.
void acceptPath(RouteCursor& cursor, int findResult, int keptCap, int generation);

// 1 ako je agent prešao na sljedeći čvor. Ne kroči na zatvoren brid.
// Na kraju cijelog puta ostaje u stanju 0. Na kraju krnjeg prefiksa ide u 1.
// Stanje 2 se budi u 1 tek kad se costGeneration promijeni.
int tryAdvance(const RoadNetwork& net, const int* route, RouteCursor& cursor);
