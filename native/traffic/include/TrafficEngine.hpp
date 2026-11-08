#pragma once

#include "Pathfinder.hpp"
#include "RoadNetwork.hpp"
#include "RouteWalk.hpp"

// Jedan vlasnik mreže i pretrage. JNI drži pokazivač, Kotlin ga zatvara.
// Nije siguran za dva threada. Svi pozivi idu s istog threada.
class TrafficEngine {
 public:
  RoadNetwork net;
  Pathfinder finder;

  bool load(const float* xy, int nodes,
            const int* from, const int* to, const float* len, int edges,
            bool undirected);

  void clearLoad();
  void addLoads(const int* edges, const float* amounts, int count);
  bool bakeCosts();
  int findPath(int start, int goal, int* out, int cap);
  int advance(const int* route, RouteCursor& cursor);
};
