attribute vec2 a_xy;
attribute vec2 a_uv;
attribute vec3 a_fx;
uniform vec2 u_res;
varying vec2 v_uv;
varying float v_ny;
varying float v_blur;
varying float v_flash;
void main() {
  vec2 clip = vec2(a_xy.x / u_res.x * 2.0 - 1.0, 1.0 - a_xy.y / u_res.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = a_uv;
  v_ny = a_fx.x;
  v_blur = a_fx.y;
  v_flash = a_fx.z;
}
