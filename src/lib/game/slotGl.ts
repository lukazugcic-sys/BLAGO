import { SYMBOL_ART } from "./art";
import { SIMBOLI_GL, type HodStupca } from "./slotHod";
import { upisiStupce } from "./slotMreza";
import type { SimbolId } from "./types";
import vert from "./sjaj.vert.glsl?raw";
import frag from "./sjaj.frag.glsl?raw";

function shader(gl: WebGLRenderingContext, tip: number, src: string) {
  const s = gl.createShader(tip);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function ucitaj(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export type SlotGl = {
  crtaj: (
    hod: HodStupca[],
    ghosts: SimbolId[][],
    ids: SimbolId[][],
    w: number,
    h: number,
  ) => void;
  ugasi: () => void;
};

export async function napraviAtlas() {
  const slike = await Promise.all(SIMBOLI_GL.map((id) => ucitaj(SYMBOL_ART[id])));
  const atlas = document.createElement("canvas");
  const celija = 64;
  atlas.width = celija * SIMBOLI_GL.length;
  atlas.height = celija;
  const ctx = atlas.getContext("2d");
  if (!ctx) return null;
  slike.forEach((img, i) => ctx.drawImage(img, i * celija, 0, celija, celija));
  return atlas;
}

export async function pokreniSlotGl(canvas: HTMLCanvasElement): Promise<SlotGl | null> {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const vs = shader(gl, gl.VERTEX_SHADER, vert);
  const fs = shader(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a_xy");
  gl.bindAttribLocation(prog, 1, "a_uv");
  gl.bindAttribLocation(prog, 2, "a_fx");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

  const atlas = await napraviAtlas();
  if (!atlas) return null;

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const buf = gl.createBuffer();
  const podaci = new Float32Array(5 * 4 * 6 * 7);
  const uRes = gl.getUniformLocation(prog, "u_res");
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
    gl.viewport(0, 0, bw, bh);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(uRes, bw, bh);
    const p = upisiStupce(podaci, hod, ghosts, ids, bw, bh);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, podaci.subarray(0, p), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 8);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 16);
    gl.drawArrays(gl.TRIANGLES, 0, p / 7);
  };

  const ugasi = () => {
    if (!ziv) return;
    ziv = false;
    gl.deleteBuffer(buf);
    gl.deleteTexture(tex);
    gl.deleteProgram(prog);
  };

  return { crtaj, ugasi };
}
