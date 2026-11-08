#include "TrafficEngine.hpp"

#include <cstdio>
#include <cstdlib>

static int gFails = 0;

static void expect(bool ok, const char* msg) {
  if (ok) return;
  std::fprintf(stderr, "FAIL %s\n", msg);
  gFails += 1;
}

static void testPrazno() {
  TrafficEngine engine;
  const float xy[] = {0.f, 0.f, 1.f, 0.f};
  expect(!engine.load(nullptr, 0, nullptr, nullptr, nullptr, 0, false), "zero nodes");
  expect(engine.load(xy, 2, nullptr, nullptr, nullptr, 0, false), "no edges");
  expect(engine.net.heurScale == 1.f, "empty scale");
  int out[4] = {7, 7, 7, 7};
  expect(engine.findPath(-1, 0, out, 4) == 0 && out[0] == 7, "start oob");
  expect(engine.findPath(0, 9, out, 4) == 0 && out[0] == 7, "goal oob");
  expect(engine.findPath(0, 1, out, 4) == 0 && out[0] == 7, "no road");
  expect(engine.findPath(0, 0, out, 4) == 1 && out[0] == 0, "same empty");
  expect(!engine.bakeCosts() && engine.net.costGeneration == 0, "empty bake");
}

static void testLanac() {
  constexpr int kNodes = 50;
  float xy[kNodes * 2];
  int from[kNodes - 1];
  int to[kNodes - 1];
  float len[kNodes - 1];
  for (int i = 0; i < kNodes; ++i) {
    xy[i * 2] = static_cast<float>(i);
    xy[i * 2 + 1] = 0.f;
  }
  for (int i = 0; i < kNodes - 1; ++i) {
    from[i] = i;
    to[i] = i + 1;
    len[i] = 1.f;
  }
  TrafficEngine engine;
  expect(engine.load(xy, kNodes, from, to, len, kNodes - 1, false), "chain load");
  int out[kNodes];
  for (int i = 0; i < kNodes; ++i) out[i] = -1;
  const int n = engine.findPath(0, kNodes - 1, out, 10);
  expect(n == -kNodes, "chain length");
  bool prefix = true;
  for (int i = 0; i < 10; ++i) {
    if (out[i] != i) prefix = false;
  }
  expect(prefix && out[10] == -1, "chain prefix untouched");
  const std::size_t scratch = engine.finder.scratchBytes();
  for (int i = 0; i < 20; ++i) engine.findPath(0, kNodes - 1, out, 10);
  expect(engine.finder.scratchBytes() == scratch, "chain scratch");
}

static void testHod() {
  const float xy[] = {0.f, 0.f, 1.f, 0.f, 2.f, 0.f, 3.f, 0.f, 4.f, 0.f};
  const int from[] = {0, 1, 2, 3};
  const int to[] = {1, 2, 3, 4};
  const float len[] = {1.f, 1.f, 1.f, 1.f};
  TrafficEngine engine;
  expect(engine.load(xy, 5, from, to, len, 4, false), "walk load");
  const std::size_t scratch = engine.finder.scratchBytes();

  int route[5] = {0, 1, 2, 3, 4};
  const int found = engine.findPath(0, 4, route, 5);
  expect(found == 5, "walk path");
  RouteCursor cursor;
  acceptPath(cursor, found, 5, engine.net.costGeneration);
  expect(cursor.state == 0 && cursor.routeLen == 5 && cursor.pos == 0, "full assign");
  expect(engine.advance(route, cursor) == 1 && cursor.pos == 1 && cursor.state == 0, "first hop");

  cursor.pos = 1;
  const int shut[] = {0};
  const float block[] = {-1.f};
  engine.addLoads(shut, block, 1);
  expect(engine.bakeCosts(), "close changed");
  const int gen = engine.net.costGeneration;
  expect(engine.advance(route, cursor) == 1 && cursor.pos == 2 && cursor.state == 0, "finished edge stays");

  cursor.pos = 0;
  cursor.state = 0;
  cursor.routeLen = 5;
  expect(engine.advance(route, cursor) == 0 && cursor.pos == 0 && cursor.state == 1, "refuses closed");

  int prefix[2] = {0, 1};
  acceptPath(cursor, -5, 2, gen);
  expect(cursor.routeLen == -2 && cursor.state == 0 && cursor.pos == 0, "trunc sign");
  engine.clearLoad();
  engine.bakeCosts();
  expect(engine.advance(prefix, cursor) == 1 && cursor.pos == 1 && cursor.state == 0, "walks prefix");
  expect(engine.advance(prefix, cursor) == 0 && cursor.pos == 1 && cursor.state == 1, "prefix ends");

  acceptPath(cursor, 0, 0, engine.net.costGeneration);
  expect(cursor.state == 2, "stuck");
  expect(engine.advance(route, cursor) == 0 && cursor.state == 2, "stuck holds");
  expect(!engine.bakeCosts(), "same costs");
  expect(engine.advance(route, cursor) == 0 && cursor.state == 2, "stuck until change");
  const int openJam[] = {1};
  const float jam[] = {2.f};
  engine.addLoads(openJam, jam, 1);
  expect(engine.bakeCosts(), "wake bake");
  expect(engine.advance(route, cursor) == 0 && cursor.state == 1, "stuck wakes");

  acceptPath(cursor, 5, 5, engine.net.costGeneration);
  cursor.pos = 4;
  expect(engine.advance(route, cursor) == 0 && cursor.state == 0 && cursor.pos == 4, "arrived stays");

  expect(engine.finder.scratchBytes() == scratch, "walk scratch");
}

int main() {
  const float xy[] = {
      0.f, 0.f,
      1.f, 0.f,
      2.f, 0.f,
      1.f, 1.f,
  };
  const int from[] = {0, 1, 0, 3};
  const int to[] = {1, 2, 3, 2};
  const float len[] = {1.f, 1.f, 1.f, 1.f};

  TrafficEngine engine;
  expect(engine.load(xy, 4, from, to, len, 4, false), "load");
  const std::size_t scratch = engine.finder.scratchBytes();

  int out[8];
  int n = engine.findPath(0, 2, out, 8);
  expect(n == 3, "len");
  expect(out[0] == 0 && out[2] == 2, "ends");
  expect(out[1] == 1 || out[1] == 3, "via");

  engine.addLoads(nullptr, nullptr, 0);
  const int jamEdge[] = {0};
  const float jamAmt[] = {10.f};
  engine.addLoads(jamEdge, jamAmt, 1);
  engine.bakeCosts();
  n = engine.findPath(0, 2, out, 8);
  expect(n == 3 && out[0] == 0 && out[1] == 3 && out[2] == 2, "jam detour");

  // Ulazni bridovi 0 (0→1) i 2 (0→3). Isti indeksi kao u from/to.
  const int block[] = {0, 2};
  const float shut[] = {-1.f, -1.f};
  engine.addLoads(block, shut, 2);
  engine.bakeCosts();
  n = engine.findPath(0, 2, out, 8);
  expect(n == 0, "blocked");

  engine.clearLoad();
  engine.bakeCosts();
  n = engine.findPath(0, 2, out, 1);
  expect(n == -3 && out[0] == 0, "truncated prefix");

  n = engine.findPath(1, 1, out, 8);
  expect(n == 1 && out[0] == 1, "same");

  for (int i = 0; i < 100; ++i) engine.findPath(0, 2, out, 8);
  expect(engine.finder.scratchBytes() == scratch, "no scratch growth");

  const int edgesBefore = engine.net.edgeCount;
  const float load0 = engine.net.edgeLoad[0];
  engine.net.addLoad(99, 3.f);
  engine.net.addLoad(-1, -1.f);
  expect(engine.net.edgeCount == edgesBefore && engine.net.edgeLoad[0] == load0, "bad load ignored");

  testPrazno();
  testLanac();
  testHod();

  if (gFails) {
    std::fprintf(stderr, "%d failed\n", gFails);
    return 1;
  }
  std::puts("ok");
  return 0;
}
