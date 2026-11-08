precision mediump float;
varying vec2 v_uv;
varying float v_ny;
varying float v_blur;
varying float v_flash;
uniform sampler2D u_atlas;
void main() {
  float b = clamp(v_blur, 0.0, 0.045);
  vec2 uv = v_uv;
  vec4 c = texture2D(u_atlas, uv) * 0.5;
  c += texture2D(u_atlas, vec2(uv.x, clamp(uv.y + b, 0.0, 1.0))) * 0.25;
  c += texture2D(u_atlas, vec2(uv.x, clamp(uv.y - b, 0.0, 1.0))) * 0.25;
  if (c.a < 0.04) discard;
  float y = clamp(v_ny, 0.0, 1.0);
  float rub = smoothstep(0.0, 0.18, y) * smoothstep(1.0, 0.82, y);
  c.rgb *= mix(0.42, 1.0, rub);
  c.rgb += vec3(1.0, 0.84, 0.42) * clamp(v_flash, 0.0, 1.0) * 0.38;
  if (b > 0.006) {
    float jacina = clamp(b * 26.0, 0.0, 1.0);
    float trak = abs(fract(uv.y * 14.0) - 0.5);
    float zica = (1.0 - smoothstep(0.02, 0.2, trak)) * jacina;
    float zrno = fract(sin(dot(floor(uv * vec2(40.0, 72.0)), vec2(12.9898, 78.233))) * 43758.5453);
    float prasina = step(0.93, zrno) * jacina;
    c.rgb += vec3(1.0, 0.9, 0.62) * (zica * 0.16 + prasina * 0.28);
  }
  gl_FragColor = c;
}
