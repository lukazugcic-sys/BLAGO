#include "TrafficEngine.hpp"

bool TrafficEngine::load(const float* xy, int nodes,
                         const int* from, const int* to, const float* len, int edges,
                         bool undirected) {
  if (!net.load(xy, nodes, from, to, len, edges, undirected)) return false;
  finder.bind(&net);
  return true;
}

void TrafficEngine::clearLoad() { net.clearLoad(); }

void TrafficEngine::addLoads(const int* edges, const float* amounts, int count) {
  net.addLoads(edges, amounts, count);
}

bool TrafficEngine::bakeCosts() { return net.bakeCosts(); }

int TrafficEngine::findPath(int start, int goal, int* out, int cap) {
  return finder.find(start, goal, out, cap);
}

int TrafficEngine::advance(const int* route, RouteCursor& cursor) {
  return tryAdvance(net, route, cursor);
}