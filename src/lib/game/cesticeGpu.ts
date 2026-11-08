import {
  CESTICE_BYTES,
  CESTICE_EMIT_MAX,
  CESTICE_GRAV,
  CESTICE_MAX,
  CESTICE_WG,
  pakirajCestice,
  pakirajPending,
} from "./cestice";
import { gpuNemaAdaptera, gpuSmijeSe } from "./gpuUlaz";

const WGSL_STRUCT = `
struct Particle {
  pos: vec2f,
  vel: vec2f,
  life: f32,
  size: f32,
  max: f32,
  vuci: f32,
  color: vec4f,
  target: vec2f,
  pad1: vec2f,
}
struct Uni {
  res: vec2f,
  dt: f32,
  grav: f32,
  head: u32,
  emitCount: u32,
  pad0: u32,
  pad1: u32,
}
`;

const WGSL_VS = `
${WGSL_STRUCT}
@group(0) @binding(0) var<uniform> u: Uni;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) col: vec4f,
  @location(1) uv: vec2f,
}

const QUAD = array<vec2f, 6>(
  vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
  vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
);

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VSOut {
  var o: VSOut;
  o.uv = vec2f(0.0);
  o.col = vec4f(0.0);
  o.pos = vec4f(0.0, 0.0, 2.0, 1.0);
  if (ii >= arrayLength(&particles)) { return o; }
  let p = particles[ii];
  if (p.life <= 0.001) { return o; }
  let k = p.life / max(p.max, 0.001);
  let q = QUAD[vi];
  let px = (p.pos.x / u.res.x) * 2.0 - 1.0;
  let py = 1.0 - (p.pos.y / u.res.y) * 2.0;
  let sx = (p.size * (0.6 + 0.6 * k)) / u.res.x;
  let sy = (p.size * (0.6 + 0.6 * k)) / u.res.y;
  o.pos = vec4f(px + q.x * sx * 2.0, py + q.y * sy * 2.0, 0.0, 1.0);
  let a = p.color.a * k * k;
  o.col = vec4f(p.color.rgb * a, a);
  o.uv = q * 0.5 + vec2f(0.5);
  return o;
}

@fragment
fn fs(i: VSOut) -> @location(0) vec4f {
  let d = length(i.uv * 2.0 - 1.0);
  if (d > 1.0) { discard; }
  let a = i.col.a * (1.0 - d * d);
  return vec4f(i.col.rgb * (1.0 - d * 0.35), a);
}
`;

const WGSL_CS = `
${WGSL_STRUCT}
@group(0) @binding(0) var<uniform> u: Uni;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> emit: array<Particle>;
const MAX: u32 = ${CESTICE_MAX}u;

@compute @workgroup_size(${CESTICE_WG})
fn cs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= MAX) { return; }
  var p = particles[i];
  let dt = u.dt;
  if (p.life > 0.0 && dt > 0.0) {
    p.life -= dt;
    if (p.life <= 0.0) {
      p.life = 0.0;
    } else {
      if (p.vuci > 0.0) {
        p.vel += (p.target - p.pos) * p.vuci * dt;
      }
      p.vel.y += u.grav * dt;
      p.vel *= 0.98;
      p.pos += p.vel * dt;
    }
  }
  let k = (i + MAX - (u.head % MAX)) % MAX;
  if (k < u.emitCount && k < arrayLength(&emit)) {
    p = emit[k];
  }
  particlesOut[i] = p;
}
`;

const VERTEX = 0x1;
const COMPUTE = 0x4;
const COPY_DST = 0x08;
const UNIFORM = 0x40;
const STORAGE = 0x80;
const BUF_UNI = UNIFORM | COPY_DST;
const BUF_STOR = STORAGE | COPY_DST;

type GpuDevice = {
  createShaderModule: (d: { label: string; code: string }) => unknown;
  createBindGroupLayout: (d: object) => unknown;
  createPipelineLayout: (d: object) => unknown;
  createComputePipeline: (d: object) => { set?: unknown };
  createRenderPipeline: (d: object) => unknown;
  createBuffer: (d: { label: string; size: number; usage: number }) => unknown;
  createBindGroup: (d: object) => unknown;
  createCommandEncoder: () => {
    beginComputePass: () => {
      setPipeline: (p: unknown) => void;
      setBindGroup: (i: number, g: unknown) => void;
      dispatchWorkgroups: (n: number) => void;
      end: () => void;
    };
    beginRenderPass: (d: object) => {
      setPipeline: (p: unknown) => void;
      setBindGroup: (i: number, g: unknown) => void;
      draw: (v: number, i: number) => void;
      end: () => void;
    };
    finish: () => unknown;
  };
  queue: { writeBuffer: (b: unknown, o: number, d: BufferSource) => void; submit: (c: unknown[]) => void };
  destroy: () => void;
};

export type GpuSok = {
  nacin: "compute" | "crtaj";
  kreni: (dt: number, w: number, h: number) => void;
  ugasi: () => void;
};

export async function pokreniCesticeGpu(canvas: HTMLCanvasElement): Promise<GpuSok | null> {
  const gpu = (navigator as Navigator & { gpu?: {
    requestAdapter: (o?: object) => Promise<{ requestDevice: () => Promise<GpuDevice> } | null>;
    getPreferredCanvasFormat: () => string;
  } }).gpu;
  if (!gpu || !gpuSmijeSe()) return null;
  try {
    const adapter = await gpu.requestAdapter({ featureLevel: "compatibility" });
    if (!adapter) {
      gpuNemaAdaptera();
      return null;
    }
    const device = await adapter.requestDevice();
    const ctx = canvas.getContext("webgpu") as {
      configure: (d: object) => void;
      getCurrentTexture: () => { createView: () => unknown };
    } | null;
    if (!ctx) return null;
    const format = gpu.getPreferredCanvasFormat();
    const configure = () => ctx.configure({ device, format, alphaMode: "premultiplied" });
    configure();

    const vsMod = device.createShaderModule({ label: "cestice-vs", code: WGSL_VS });
    const csMod = device.createShaderModule({ label: "cestice-cs", code: WGSL_CS });
    const uniSize = 32;
    const partBytes = CESTICE_BYTES * CESTICE_MAX;
    const emitBytes = CESTICE_BYTES * CESTICE_EMIT_MAX;

    const computeBgl = device.createBindGroupLayout({
      label: "cestice-cs-bgl",
      entries: [
        { binding: 0, visibility: COMPUTE, buffer: { type: "uniform", minBindingSize: uniSize } },
        { binding: 1, visibility: COMPUTE, buffer: { type: "read-only-storage", minBindingSize: partBytes } },
        { binding: 2, visibility: COMPUTE, buffer: { type: "storage", minBindingSize: partBytes } },
        { binding: 3, visibility: COMPUTE, buffer: { type: "read-only-storage", minBindingSize: emitBytes } },
      ],
    });
    const drawBgl = device.createBindGroupLayout({
      label: "cestice-vs-bgl",
      entries: [
        { binding: 0, visibility: VERTEX, buffer: { type: "uniform", minBindingSize: uniSize } },
        { binding: 1, visibility: VERTEX, buffer: { type: "read-only-storage", minBindingSize: partBytes } },
      ],
    });
    let sim: ReturnType<GpuDevice["createComputePipeline"]> | null = null;
    try {
      sim = device.createComputePipeline({
        label: "cestice-sim",
        layout: device.createPipelineLayout({ label: "cestice-cs-layout", bindGroupLayouts: [computeBgl] }),
        compute: { module: csMod, entryPoint: "cs" },
      });
    } catch {
      sim = null;
    }
    const crtaj = device.createRenderPipeline({
      label: "cestice-crtaj",
      layout: device.createPipelineLayout({ label: "cestice-vs-layout", bindGroupLayouts: [drawBgl] }),
      vertex: { module: vsMod, entryPoint: "vs" },
      primitive: { topology: "triangle-list", cullMode: "none" },
      fragment: {
        module: vsMod,
        entryPoint: "fs",
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            },
            writeMask: 0xf,
          },
        ],
      },
      multisample: { count: 1 },
    });
    const uni = device.createBuffer({ label: "cestice-uni", size: uniSize, usage: BUF_UNI });
    const bufA = device.createBuffer({ label: "cestice-a", size: partBytes, usage: BUF_STOR });
    const bufB = device.createBuffer({ label: "cestice-b", size: partBytes, usage: BUF_STOR });
    const emit = device.createBuffer({ label: "cestice-emit", size: emitBytes, usage: BUF_STOR });
    const grupaAB = device.createBindGroup({
      layout: computeBgl,
      entries: [
        { binding: 0, resource: { buffer: uni } },
        { binding: 1, resource: { buffer: bufA } },
        { binding: 2, resource: { buffer: bufB } },
        { binding: 3, resource: { buffer: emit } },
      ],
    });
    const grupaBA = device.createBindGroup({
      layout: computeBgl,
      entries: [
        { binding: 0, resource: { buffer: uni } },
        { binding: 1, resource: { buffer: bufB } },
        { binding: 2, resource: { buffer: bufA } },
        { binding: 3, resource: { buffer: emit } },
      ],
    });
    const crtaA = device.createBindGroup({
      layout: drawBgl,
      entries: [
        { binding: 0, resource: { buffer: uni } },
        { binding: 1, resource: { buffer: bufA } },
      ],
    });
    const crtaB = device.createBindGroup({
      layout: drawBgl,
      entries: [
        { binding: 0, resource: { buffer: uni } },
        { binding: 1, resource: { buffer: bufB } },
      ],
    });
    const stanje = new Float32Array(CESTICE_MAX * 16);
    const ceka = new Float32Array(CESTICE_EMIT_MAX * 16);
    const uniRaw = new ArrayBuffer(uniSize);
    const uniF = new Float32Array(uniRaw);
    const uniU = new Uint32Array(uniRaw);
    let head = 0;
    let flip = false;
    let zadnjiW = canvas.width;
    let zadnjiH = canvas.height;
    const nacin: GpuSok["nacin"] = sim ? "compute" : "crtaj";

    const upisiUni = (w: number, h: number, dt: number, emitCount: number) => {
      uniF[0] = w;
      uniF[1] = h;
      uniF[2] = dt;
      uniF[3] = CESTICE_GRAV;
      uniU[4] = head >>> 0;
      uniU[5] = emitCount >>> 0;
      uniU[6] = 0;
      uniU[7] = 0;
      device.queue.writeBuffer(uni, 0, uniRaw);
    };

    const nacrtaj = (enc: ReturnType<GpuDevice["createCommandEncoder"]>, grupa: unknown) => {
      const view = ctx.getCurrentTexture().createView();
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
          },
        ],
      });
      pass.setPipeline(crtaj);
      pass.setBindGroup(0, grupa);
      pass.draw(6, CESTICE_MAX);
      pass.end();
    };

    return {
      nacin,
      kreni(dt, w, h) {
        if (canvas.width !== zadnjiW || canvas.height !== zadnjiH) {
          configure();
          zadnjiW = canvas.width;
          zadnjiH = canvas.height;
        }
        const korak = Math.min(0.05, Math.max(0, dt));
        if (nacin === "compute" && sim) {
          const n = pakirajPending(ceka);
          if (n > 0) device.queue.writeBuffer(emit, 0, ceka.subarray(0, n * 16));
          upisiUni(w, h, korak, n);
          const enc = device.createCommandEncoder();
          const pass = enc.beginComputePass();
          pass.setPipeline(sim);
          pass.setBindGroup(0, flip ? grupaBA : grupaAB);
          pass.dispatchWorkgroups(Math.ceil(CESTICE_MAX / CESTICE_WG));
          pass.end();
          flip = !flip;
          head = (head + n) % CESTICE_MAX;
          nacrtaj(enc, flip ? crtaB : crtaA);
          device.queue.submit([enc.finish()]);
          return;
        }
        pakirajCestice(stanje);
        upisiUni(w, h, 0, 0);
        device.queue.writeBuffer(bufA, 0, stanje);
        const enc = device.createCommandEncoder();
        nacrtaj(enc, crtaA);
        device.queue.submit([enc.finish()]);
      },
      ugasi() {
        try {
          device.destroy();
        } catch {
          /* već ugašen */
        }
      },
    };
  } catch {
    return null;
  }
}
