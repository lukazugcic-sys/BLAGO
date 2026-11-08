#include "Pathfinder.hpp"

#include <cmath>
#include <utility>

namespace {
constexpr float kInf = 1.0e30f;
}

void Pathfinder::bind(const RoadNetwork* net) {
  net_ = net;
  if (!net) {
    boundNodes_ = 0;
    boundEdges_ = 0;
    g_.clear();
    came_.clear();
    closed_.clear();
    heapNode_.clear();
    heapKey_.clear();
    rev_.clear();
    heapN_ = 0;
    return;
  }
  boundNodes_ = net->nodeCount;
  boundEdges_ = net->edgeCount;
  g_.assign(static_cast<size_t>(boundNodes_), 0.f);
  came_.assign(static_cast<size_t>(boundNodes_), -1);
  closed_.assign(static_cast<size_t>(boundNodes_), 0);
  // Svaki brid gurne čvor najviše jednom, plus početni čvor.
  heapNode_.assign(static_cast<size_t>(boundEdges_) + 1, 0);
  heapKey_.assign(static_cast<size_t>(boundEdges_) + 1, 0.f);
  rev_.assign(static_cast<size_t>(boundNodes_ > 0 ? boundNodes_ : 1), 0);
  heapN_ = 0;
}

std::size_t Pathfinder::scratchBytes() const {
  return g_.capacity() * sizeof(float) + came_.capacity() * sizeof(int) +
         closed_.capacity() * sizeof(std::uint8_t) + heapNode_.capacity() * sizeof(int) +
         heapKey_.capacity() * sizeof(float) + rev_.capacity() * sizeof(int);
}

float Pathfinder::heuristic(int a, int b) const {
  // h = zračna udaljenost * heurScale.
  // heurScale = min(duljina/zrak) po otvorenim bridovima u trenutku učitavanja.
  // Gužva množi duljinu s (1+load), load >= 0, pa h i dalje ne precjenjuje.
  // Zato je prvi izlazak čvora iz hrpe konačan i zatvorene čvorove ne otvaramo.
  const float dx = net_->nodeX[static_cast<size_t>(a)] - net_->nodeX[static_cast<size_t>(b)];
  const float dy = net_->nodeY[static_cast<size_t>(a)] - net_->nodeY[static_cast<size_t>(b)];
  return std::sqrt(dx * dx + dy * dy) * net_->heurScale;
}

void Pathfinder::heapPush(int node, float key) {
  if (heapN_ >= static_cast<int>(heapNode_.size())) return;
  int i = heapN_++;
  heapNode_[static_cast<size_t>(i)] = node;
  heapKey_[static_cast<size_t>(i)] = key;
  while (i > 0) {
    const int parent = (i - 1) >> 1;
    if (heapKey_[static_cast<size_t>(parent)] <= heapKey_[static_cast<size_t>(i)]) break;
    std::swap(heapNode_[static_cast<size_t>(parent)], heapNode_[static_cast<size_t>(i)]);
    std::swap(heapKey_[static_cast<size_t>(parent)], heapKey_[static_cast<size_t>(i)]);
    i = parent;
  }
}

int Pathfinder::heapPop() {
  const int top = heapNode_[0];
  --heapN_;
  if (heapN_ > 0) {
    heapNode_[0] = heapNode_[static_cast<size_t>(heapN_)];
    heapKey_[0] = heapKey_[static_cast<size_t>(heapN_)];
    int i = 0;
    for (;;) {
      const int left = i * 2 + 1;
      if (left >= heapN_) break;
      int best = left;
      const int right = left + 1;
      if (right < heapN_ && heapKey_[static_cast<size_t>(right)] < heapKey_[static_cast<size_t>(left)]) best = right;
      if (heapKey_[static_cast<size_t>(best)] >= heapKey_[static_cast<size_t>(i)]) break;
      std::swap(heapNode_[static_cast<size_t>(i)], heapNode_[static_cast<size_t>(best)]);
      std::swap(heapKey_[static_cast<size_t>(i)], heapKey_[static_cast<size_t>(best)]);
      i = best;
    }
  }
  return top;
}

int Pathfinder::find(int start, int goal, int* out, int cap) {
  if (!net_ || !out || cap <= 0) return 0;
  if (net_->nodeCount != boundNodes_ || net_->edgeCount != boundEdges_) return 0;
  if (start < 0 || goal < 0 || start >= boundNodes_ || goal >= boundNodes_) return 0;
  if (start == goal) {
    out[0] = start;
    return 1;
  }

  for (int i = 0; i < boundNodes_; ++i) {
    g_[static_cast<size_t>(i)] = kInf;
    came_[static_cast<size_t>(i)] = -1;
    closed_[static_cast<size_t>(i)] = 0;
  }
  heapN_ = 0;
  g_[static_cast<size_t>(start)] = 0.f;
  heapPush(start, heuristic(start, goal));

  while (heapN_ > 0) {
    const int node = heapPop();
    if (closed_[static_cast<size_t>(node)]) continue;
    closed_[static_cast<size_t>(node)] = 1;
    if (node == goal) break;
    const int begin = net_->outBegin(node);
    const int end = net_->outEnd(node);
    for (int edge = begin; edge < end; ++edge) {
      const float step = net_->edgeCost[static_cast<size_t>(edge)];
      if (step < 0.f) continue;
      const int next = net_->edgeTo[static_cast<size_t>(edge)];
      if (closed_[static_cast<size_t>(next)]) continue;
      const float nextG = g_[static_cast<size_t>(node)] + step;
      if (nextG >= g_[static_cast<size_t>(next)]) continue;
      g_[static_cast<size_t>(next)] = nextG;
      came_[static_cast<size_t>(next)] = node;
      heapPush(next, nextG + heuristic(next, goal));
    }
  }

  if (!(g_[static_cast<size_t>(goal)] < kInf)) return 0;

  int length = 0;
  for (int node = goal; node >= 0 && length < boundNodes_; node = came_[static_cast<size_t>(node)]) {
    rev_[static_cast<size_t>(length++)] = node;
    if (node == start) break;
  }
  if (length == 0 || rev_[static_cast<size_t>(length - 1)] != start) return 0;

  const int write = length < cap ? length : cap;
  for (int i = 0; i < write; ++i) out[i] = rev_[static_cast<size_t>(length - 1 - i)];
  return length > cap ? -length : length;
}
