import { napraviAtlas } from "./slotGl";
import { upisiStupce } from "./slotMreza";
import type { HodStupca } from "./slotHod";
import type { SimbolId } from "./types";
import type { SlotGl } from "./slotGl";
import { gpuNemaAdaptera, gpuSmijeSe } from "./gpuUlaz";
import wgsl from "./sjaj.wgsl?raw";

const TEX = 0x02 | 0x04 | 0x10;
const BUF_UNI = 0x40 | 0x08;
const BUF_VBO = 0x20 | 0x08;

export async function pokreniSlotGpu(canvas: HTMLCanvasElement): Promise<SlotGl | null> {
  const gpu = (navigator as Navigator & { gpu?: any }).gpu;
  if (!gpu || !gpuSmijeSe()) return null;
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      gpuNemaAdaptera();
      return null;
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu") as any;
    if (!context) return null;
    const format = gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "premultiplied" });
    const atlas = await napraviAtlas();
    if (!atlas) return null;
    const texture = device.createTexture({
      size: [atlas.width, atlas.height, 1],
      format: "rgba8unorm",
      usage: TEX,
    });
    device.queue.copyExternalImageToTexture({ source: atlas }, { texture }, [atlas.width, atlas.height]);
    const sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    const layout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: 0x1, buffer: { type: "uniform" } },
        { binding: 1, visibility: 0x2, texture: { sampleType: "float" } },
        { binding: 2, visibility: 0x2, sampler: { type: "filtering" } },
      ],
    });
    const uni = device.createBuffer({ size: 8, usage: BUF_UNI });
    const bind = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: uni } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: sampler },
      ],
    });
    const module = device.createShaderModule({ code: wgsl });
    const pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 28,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x2" },
              { shaderLocation: 1, offset: 8, format: "float32x2" },
              { shaderLocation: 2, offset: 16, format: "float32x3" },
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
    const vbo = device.createBuffer({
      size: 5 * 4 * 6 * 7 * 4,
      usage: BUF_VBO,
    });
    const podaci = new Float32Array(5 * 4 * 6 * 7);
    let ziv = true;
    const crtaj = (hod: HodStupca[], ghosts: SimbolId[][], ids: SimbolId[][], w: number, h: number) => {
      if (!ziv || w < 2 || h < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const n = upisiStupce(podaci, hod, ghosts, ids, bw, bh);
      device.queue.writeBuffer(uni, 0, new Float32Array([bw, bh]));
      device.queue.writeBuffer(vbo, 0, podaci.subarray(0, n));
      const view = context.getCurrentTexture().createView();
      const enc = device.createCommandEncoder();
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view,
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bind);
      pass.setVertexBuffer(0, vbo);
      pass.draw(n / 7);
      pass.end();
      device.queue.submit([enc.finish()]);
    };
    const ugasi = () => {
      ziv = false;
      texture.destroy();
      uni.destroy();
      vbo.destroy();
    };
    return { crtaj, ugasi };
  } catch {
    return null;
  }
}
