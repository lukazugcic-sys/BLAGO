const SOFT =
  /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|virtualbox|vmware svga/i;

let preskoci = false;

/**
 * Chromium ispiše "No available adapters." kad requestAdapter vrati null.
 * Ne zovemo ga bez GPU-a, na softverskom WebGL-u, ni nakon prvog promašaja.
 */
export function gpuSmijeSe(): boolean {
  if (preskoci || typeof navigator === "undefined" || typeof document === "undefined") return false;
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: unknown } }).gpu;
  if (!gpu || typeof gpu.requestAdapter !== "function") return false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "") : "";
    const vendor = ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || "") : "";
    if (!renderer.trim() || SOFT.test(`${vendor} ${renderer}`)) return false;
  } catch {
    return false;
  }
  return true;
}

export function gpuNemaAdaptera() {
  preskoci = true;
}
