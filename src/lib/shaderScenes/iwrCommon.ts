/** Phone activity strip the archive studies draw into. */
export const STRIP_FRAME_ASPECT = 226 / 44;

/**
 * Shared prelude for iwrzwr strip ports.
 * Apple/ANGLE: highp precision, no bools, cached mods, step/mix instead of branches.
 */
export const IWR_PRELUDE = `
precision highp float;

uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
uniform vec3 accent;
uniform float tempoKnown;
uniform float beat;
uniform float beatPhase;
uniform float bpm;
varying vec2 vUv;

const vec3 paper = vec3(0.90, 0.91, 0.88);
const float DW = 226.0;
const float DH = 44.0;

float hash11(float n) {
  return fract(sin(n * 127.1 + 43.7) * 43758.5453123);
}

float known() {
  return step(0.5, tempoKnown);
}

float audioMix() {
  return clamp(audioLow * 0.5 + audioMid * 0.32 + audioHigh * 0.18, 0.0, 1.0);
}

float stepped(float rate, float subdiv) {
  return mix(floor(time * rate), floor(beat * subdiv), known());
}

float songSeconds() {
  return mix(time, beat * 60.0 / max(bpm, 1.0), known());
}

vec2 px() {
  return vec2(vUv.x * DW, (1.0 - vUv.y) * DH);
}

float fillRect(vec2 p, vec2 origin, vec2 size) {
  vec2 d = p - origin;
  return step(0.0, d.x) * step(d.x, size.x) * step(0.0, d.y) * step(d.y, size.y);
}

float strokeSeg(vec2 p, vec2 a, vec2 b) {
  vec2 ba = b - a;
  float len2 = dot(ba, ba);
  float alive = step(0.2, len2);
  vec2 pa = p - a;
  float h = clamp(dot(pa, ba) / max(len2, 0.0001), 0.0, 1.0);
  float dist = length(pa - ba * h);
  return alive * (1.0 - smoothstep(0.35, 0.95, dist));
}
`;
