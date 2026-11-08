#include "RouteWalk.hpp"

void acceptPath(RouteCursor& cursor, int findResult, int keptCap, int generation) {
  if (findResult == 0) {
    cursor.pos = 0;
    cursor.routeLen = 0;
    cursor.state = 2;
    cursor.seenGen = generation;
    return;
  }
  const int full = findResult < 0 ? -findResult : findResult;
  int keep = full;
  if (keep > keptCap) keep = keptCap;
  if (keep < 0) keep = 0;
  cursor.pos = 0;
  cursor.state = 0;
  cursor.routeLen = (findResult < 0 || full > keptCap) ? -keep : keep;
}

int tryAdvance(const RoadNetwork& net, const int* route, RouteCursor& cursor) {
  if (cursor.state == 2) {
    if (net.costGeneration != cursor.seenGen) cursor.state = 1;
    return 0;
  }
  if (cursor.state != 0) return 0;

  const int len = cursor.routeLen < 0 ? -cursor.routeLen : cursor.routeLen;
  if (len <= 0 || cursor.pos < 0) return 0;
  if (cursor.pos >= len - 1) {
    if (cursor.routeLen < 0) cursor.state = 1;
    return 0;
  }
  if (!route) {
    cursor.state = 1;
    return 0;
  }

  const int from = route[cursor.pos];
  const int to = route[cursor.pos + 1];
  if (net.hopClosed(from, to)) {
    cursor.state = 1;
    return 0;
  }
  cursor.pos += 1;
  return 1;
}
