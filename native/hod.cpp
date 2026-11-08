// Isti hod kao src/lib/game/pokret.ts. Ne dira isplatu.
// Preglednik učitava public/hod.wasm. Ako se brojevi ne poklope, ostaje TypeScript.

#include <cmath>

static double polinom(double t, double a, double b) {
  const double c = 3.0 * a;
  const double d = 3.0 * (b - a) - c;
  const double e = 1.0 - c - d;
  return ((e * t + d) * t + c) * t;
}

static double nagib(double t, double a, double b) {
  const double c = 3.0 * a;
  const double d = 3.0 * (b - a) - c;
  const double e = 1.0 - c - d;
  return (3.0 * e * t + 2.0 * d) * t + c;
}

static double krivulja(double x, double x1, double y1, double x2, double y2) {
  if (x <= 0.0) return 0.0;
  if (x >= 1.0) return 1.0;
  double t = x;
  for (int i = 0; i < 8; i++) {
    const double dx = nagib(t, x1, x2);
    if (std::fabs(dx) < 1e-6) break;
    const double sljedeci = t - (polinom(t, x1, x2) - x) / dx;
    t = sljedeci < 0.0 ? 0.0 : (sljedeci > 1.0 ? 1.0 : sljedeci);
  }
  return polinom(t, y1, y2);
}

extern "C" double slijetanje(double t, int skoro) {
  if (skoro) return krivulja(t, 0.18, 1.72, 0.46, 1.0);
  return krivulja(t, 0.34, 1.36, 0.64, 1.0);
}
