#pragma once

#include <cstddef>
#include <cstdint>
#include <vector>

// Cestovna mreža kao Struct of Arrays.
// Učitavanje smije alocirati. clearLoad / addLoad / bakeCosts ne alociraju.
class RoadNetwork {
 public:
  static constexpr int kMaxNodes = 200000;
  static constexpr int kMaxEdges = 1000000;

  int nodeCount = 0;
  int edgeCount = 0;
  int inputCount = 0;

  std::vector<float> nodeX;
  std::vector<float> nodeY;

  // CSR: izlazni bridovi čvora i su [edgeOffset[i], edgeOffset[i + 1]).
  std::vector<int> edgeOffset;
  std::vector<int> edgeTo;
  std::vector<float> edgeLen;
  std::vector<float> edgeCost;
  std::vector<float> edgeLoad;
  // Ulazni brid i -> usmjereni slotovi. addLoad prima ulazni indeks.
  std::vector<int> inputFwd;
  std::vector<int> inputRev;

  // min(duljina / euklid) po otvorenim bridovima u load(). Prazna mreža ostaje 1.
  // Gužva ne mijenja geometriju, pa bakeCosts ne dira heurScale.
  // Novi ili obrisani brid u hodu traži novi load().
  float heurScale = 1.f;
  // Raste samo kad se neka cijena stvarno promijeni. Budi zapela vozila.
  int costGeneration = 0;

  // xy ima 2 * nodes brojeva. len smije biti null (tada je duljina euklidska).
  // Negativan len ostavlja brid u mreži, ali zatvoren (load < 0).
  bool load(const float* xy, int nodes,
            const int* from, const int* to, const float* len, int edges,
            bool undirected);

  void clearLoad();
  void addLoad(int edge, float amount);
  void addLoads(const int* edges, const float* amounts, int count);
  // True ako je ijedna cijena promijenjena. Tada raste costGeneration.
  bool bakeCosts();
  // True ako iz from u to nema nijednog otvorenog brida.
  // Gleda load i cost. Paralelni brid je otvoren čim je jedan od njih otvoren.
  bool hopClosed(int from, int to) const;

  int outBegin(int node) const { return edgeOffset[static_cast<size_t>(node)]; }
  int outEnd(int node) const { return edgeOffset[static_cast<size_t>(node) + 1]; }
};
