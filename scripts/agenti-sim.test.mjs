import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

test("hod na 10 Hz prati stazu i ne mijenja nizove", async () => {
  const jiti = createJiti(import.meta.url);
  const a = await jiti.import("../src/lib/game/agentiSim.ts");
  const k = await jiti.import("../src/lib/game/kartaPogled.ts");

  const tocke = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 80 },
    { x: 20, y: 40 },
  ];
  const flat = a.spljostiRutu(tocke);
  const ox = new Float32Array(1);
  const oy = new Float32Array(1);
  for (const u of [0, 0.01, 0.25, 0.5, 0.73, 0.999, 1, 1.2, -0.3, 4.7]) {
    const p = k.tockaNaPutu(tocke, u);
    a.uzorakRute(flat, u, ox, oy, 0);
    const d = Math.hypot(p.x - ox[0], p.y - oy[0]);
    assert.ok(d < 0.05, `${u} ${d}`);
  }

  const sim = new a.AgentSim();
  const istiX = sim.x;
  const istiIx = sim.ix;
  const istiRuta = sim.ruta;
  sim.postavi(
    [flat],
    [
      { ruta: 0, brzina: 32, faza: 0.17, tip: 0 },
      { ruta: 0, brzina: 22, faza: 0.34, tip: 1 },
    ],
  );
  assert.equal(sim.x, istiX);
  assert.equal(sim.count, 2);

  let now = 1000;
  sim.frame(now);
  for (let i = 0; i < 120; i++) {
    now += 16;
    sim.frame(now);
  }
  assert.equal(sim.x, istiX);
  assert.equal(sim.ix, istiIx);
  assert.equal(sim.ruta, istiRuta);
  assert.equal(sim.x.byteLength, istiX.byteLength);

  let vidio = false;
  for (let i = 0; i < 40 && !vidio; i++) {
    now += 16;
    sim.frame(now);
    if (sim.alpha > 0 && (sim.prevX[0] !== sim.x[0] || sim.prevY[0] !== sim.y[0])) {
      const e = sim.prevX[0] * (1 - sim.alpha) + sim.x[0] * sim.alpha;
      assert.ok(Math.abs(sim.ix[0] - e) < 1e-4);
      vidio = true;
    }
  }
  assert.equal(vidio, true);

  const tocno = new a.AgentSim();
  tocno.postavi([flat], [{ ruta: 0, brzina: 32, faza: 0.2, tip: 0 }]);
  tocno.frame(0);
  let t = 0;
  for (let n = 1; n <= 8; n++) {
    t += 100;
    tocno.frame(t);
    assert.equal(tocno.alpha, 0);
    assert.equal(tocno.teret, 1);
    const u = (tocno.simT * 32) / (flat.ukupno || 1) + 0.2;
    const p = k.tockaNaPutu(tocke, u);
    assert.ok(Math.hypot(tocno.x[0] - p.x, tocno.y[0] - p.y) < 0.05, String(n));
  }

  const rupa = new a.AgentSim();
  rupa.postavi([flat], [{ ruta: 0, brzina: 32, faza: 0, tip: 0 }]);
  rupa.frame(5000);
  const prije = rupa.simT;
  rupa.frame(6000);
  const koraka = Math.round((rupa.simT - prije) / 0.1);
  assert.ok(koraka <= 3, String(koraka));
  assert.ok(koraka >= 1);
  assert.equal(rupa.teret, 1);

  const lagan = new a.AgentSim();
  lagan.postavi([flat], [{ ruta: 0, brzina: 32, faza: 0, tip: 0 }]);
  lagan.frame(1000);
  lagan.frame(1016);
  assert.equal(lagan.teret, 0);

  const devet = new a.AgentSim();
  devet.postavi(
    [flat],
    Array.from({ length: 9 }, (_, i) => ({ ruta: 0, brzina: 10, faza: i * 0.1, tip: 0 })),
  );
  assert.equal(devet.count, a.AGENT_CAP);
});
