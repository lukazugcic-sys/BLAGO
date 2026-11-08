#include "RoadNetwork.hpp"

#include <cmath>
#include <utility>

namespace {

float dist(float ax, float ay, float bx, float by) {
  const float dx = bx - ax;
  const float dy = by - ay;
  return std::sqrt(dx * dx + dy * dy);
}

}  // namespace

bool RoadNetwork::load(const float* xy, int nodes,
                       const int* from, const int* to, const float* len, int edges,
                       bool undirected) {
  if (!xy || nodes <= 0 || nodes > kMaxNodes || edges < 0 || edges > kMaxEdges) return false;
  if (edges > 0 && (!from || !to)) return false;
  for (int i = 0; i < edges; ++i) {
    if (from[i] < 0 || to[i] < 0 || from[i] >= nodes || to[i] >= nodes) return false;
  }

  const int directedCap = undirected ? edges * 2 : edges;
  std::vector<int> deg(static_cast<size_t>(nodes), 0);
  int directed = 0;
  for (int i = 0; i < edges; ++i) {
    if (from[i] == to[i]) continue;
    deg[static_cast<size_t>(from[i])] += 1;
    directed += 1;
    if (undirected) {
      deg[static_cast<size_t>(to[i])] += 1;
      directed += 1;
    }
  }
  if (directed > kMaxEdges || directed > directedCap) return false;

  std::vector<float> x(static_cast<size_t>(nodes));
  std::vector<float> y(static_cast<size_t>(nodes));
  for (int i = 0; i < nodes; ++i) {
    x[static_cast<size_t>(i)] = xy[i * 2];
    y[static_cast<size_t>(i)] = xy[i * 2 + 1];
  }

  std::vector<int> offset(static_cast<size_t>(nodes) + 1, 0);
  for (int i = 0; i < nodes; ++i) offset[static_cast<size_t>(i) + 1] = offset[static_cast<size_t>(i)] + deg[static_cast<size_t>(i)];

  std::vector<int> dest(static_cast<size_t>(directed));
  std::vector<float> base(static_cast<size_t>(directed));
  std::vector<float> cost(static_cast<size_t>(directed));
  std::vector<float> load(static_cast<size_t>(directed), 0.f);
  std::vector<int> cursor = offset;
  std::vector<int> fwd(static_cast<size_t>(edges), -1);
  std::vector<int> rev(static_cast<size_t>(edges), -1);

  float minRatio = 0.f;
  bool haveRatio = false;
  auto place = [&](int src, int dst, float span, bool blocked) -> int {
    const int slot = cursor[static_cast<size_t>(src)]++;
    dest[static_cast<size_t>(slot)] = dst;
    base[static_cast<size_t>(slot)] = span;
    if (blocked) {
      load[static_cast<size_t>(slot)] = -1.f;
      cost[static_cast<size_t>(slot)] = -1.f;
    } else {
      cost[static_cast<size_t>(slot)] = span;
    }
    const float air = dist(x[static_cast<size_t>(src)], y[static_cast<size_t>(src)],
                           x[static_cast<size_t>(dst)], y[static_cast<size_t>(dst)]);
    if (!blocked && air > 1e-4f) {
      const float ratio = span / air;
      if (!haveRatio || ratio < minRatio) {
        minRatio = ratio;
        haveRatio = true;
      }
    }
    return slot;
  };

  for (int i = 0; i < edges; ++i) {
    const int a = from[i];
    const int b = to[i];
    if (a == b) continue;
    const float air = dist(x[static_cast<size_t>(a)], y[static_cast<size_t>(a)],
                           x[static_cast<size_t>(b)], y[static_cast<size_t>(b)]);
    const float span = len ? std::fabs(len[i]) : air;
    const bool blocked = len && len[i] < 0.f;
    fwd[static_cast<size_t>(i)] = place(a, b, span, blocked);
    if (undirected) rev[static_cast<size_t>(i)] = place(b, a, span, blocked);
  }

  nodeCount = nodes;
  edgeCount = directed;
  inputCount = edges;
  nodeX = std::move(x);
  nodeY = std::move(y);
  edgeOffset = std::move(offset);
  edgeTo = std::move(dest);
  edgeLen = std::move(base);
  edgeCost = std::move(cost);
  edgeLoad = std::move(load);
  inputFwd = std::move(fwd);
  inputRev = std::move(rev);
  heurScale = haveRatio ? minRatio : 1.f;
  return true;
}

void RoadNetwork::clearLoad() {
  for (int i = 0; i < edgeCount; ++i) edgeLoad[static_cast<size_t>(i)] = 0.f;
}

void RoadNetwork::addLoad(int edge, float amount) {
  if (edge < 0 || edge >= inputCount) return;
  auto apply = [&](int directed) {
    if (directed < 0) return;
    if (amount < 0.f) {
      edgeLoad[static_cast<size_t>(directed)] = -1.f;
      return;
    }
    if (edgeLoad[static_cast<size_t>(directed)] < 0.f) return;
    edgeLoad[static_cast<size_t>(directed)] += amount;
  };
  apply(inputFwd[static_cast<size_t>(edge)]);
  apply(inputRev[static_cast<size_t>(edge)]);
}

void RoadNetwork::addLoads(const int* edges, const float* amounts, int count) {
  if (!edges || !amounts || count <= 0) return;
  for (int i = 0; i < count; ++i) addLoad(edges[i], amounts[i]);
}

bool RoadNetwork::bakeCosts() {
  // Cijena = duljina * (1 + gužva). load < 0 zatvara brid prije množenja.
  // Sljedeći A* vidi nove težine jer se otvoreni skup gradi iznova po upitu.
  bool changed = false;
  for (int i = 0; i < edgeCount; ++i) {
    const float load = edgeLoad[static_cast<size_t>(i)];
    const float next = load < 0.f ? -1.f : edgeLen[static_cast<size_t>(i)] * (1.f + load);
    if (next != edgeCost[static_cast<size_t>(i)]) {
      edgeCost[static_cast<size_t>(i)] = next;
      changed = true;
    }
  }
  if (changed) ++costGeneration;
  return changed;
}

bool RoadNetwork::hopClosed(int from, int to) const {
  if (from < 0 || to < 0 || from >= nodeCount || to >= nodeCount) return true;
  const int begin = outBegin(from);
  const int end = outEnd(from);
  for (int edge = begin; edge < end; ++edge) {
    if (edgeTo[static_cast<size_t>(edge)] != to) continue;
    if (edgeLoad[static_cast<size_t>(edge)] < 0.f) continue;
    if (edgeCost[static_cast<size_t>(edge)] < 0.f) continue;
    return false;
  }
  return true;
}
