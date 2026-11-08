#pragma once

#include "RoadNetwork.hpp"

#include <cstddef>
#include <cstdint>
#include <vector>

// A* preko RoadNetwork. find() ne alocira: spremnici se slože u bind().
class Pathfinder {
 public:
  void bind(const RoadNetwork* net);

  // Piše čvorove od starta prema cilju u out. Vraća broj upisanih.
  // 0 znači da puta nema ili da spremnik nije spojen na trenutnu mrežu.
  // Ako je put dulji od cap, upiše prvih cap čvorova i vrati -punaDuljina.
  int find(int start, int goal, int* out, int cap);

  std::size_t scratchBytes() const;

 private:
  const RoadNetwork* net_ = nullptr;
  int boundNodes_ = 0;
  int boundEdges_ = 0;

  std::vector<float> g_;
  std::vector<int> came_;
  std::vector<std::uint8_t> closed_;
  std::vector<int> heapNode_;
  std::vector<float> heapKey_;
  int heapN_ = 0;
  std::vector<int> rev_;

  void heapPush(int node, float key);
  int heapPop();
  float heuristic(int a, int b) const;
};
