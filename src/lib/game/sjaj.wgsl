struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) ny: f32,
  @location(2) blur: f32,
  @location(3) flash: f32,
}

struct Res {
  xy: vec2f,
}

@group(0) @binding(0) var<uniform> u_res: Res;
@group(0) @binding(1) var u_atlas: texture_2d<f32>;
@group(0) @binding(2) var u_samp: sampler;

@vertex
fn vs(@location(0) xy: vec2f, @location(1) uv: vec2f, @location(2) fx: vec3f) -> VsOut {
  var o: VsOut;
  let clip = vec2f(xy.x / u_res.xy.x * 2.0 - 1.0, 1.0 - xy.y / u_res.xy.y * 2.0);
  o.pos = vec4f(clip, 0.0, 1.0);
  o.uv = uv;
  o.ny = fx.x;
  o.blur = fx.y;
  o.flash = fx.z;
  return o;
}

@fragment
fn fs(i: VsOut) -> @location(0) vec4f {
  let b = clamp(i.blur, 0.0, 0.045);
  let uv = vec2f(i.uv.x, 1.0 - i.uv.y);
  var c = textureSample(u_atlas, u_samp, uv) * 0.5;
  c += textureSample(u_atlas, u_samp, vec2f(uv.x, clamp(uv.y + b, 0.0, 1.0))) * 0.25;
  c += textureSample(u_atlas, u_samp, vec2f(uv.x, clamp(uv.y - b, 0.0, 1.0))) * 0.25;
  if (c.a < 0.04) {
    discard;
  }
  let y = clamp(i.ny, 0.0, 1.0);
  let rub = smoothstep(0.0, 0.18, y) * smoothstep(1.0, 0.82, y);
  c = vec4f(c.rgb * mix(0.42, 1.0, rub), c.a);
  c = vec4f(c.rgb + vec3f(1.0, 0.84, 0.42) * clamp(i.flash, 0.0, 1.0) * 0.38, c.a);
  if (b > 0.006) {
    let jacina = clamp(b * 26.0, 0.0, 1.0);
    let trak = abs(fract(uv.y * 14.0) - 0.5);
    let zica = (1.0 - smoothstep(0.02, 0.2, trak)) * jacina;
    let zrno = fract(sin(dot(floor(uv * vec2f(40.0, 72.0)), vec2f(12.9898, 78.233))) * 43758.5453);
    let prasina = step(0.93, zrno) * jacina;
    c = vec4f(c.rgb + vec3f(1.0, 0.9, 0.62) * (zica * 0.16 + prasina * 0.28), c.a);
  }
  return c;
}
