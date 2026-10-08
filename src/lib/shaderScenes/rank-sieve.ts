/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-06-selective-memory.html — sieve()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "rank-sieve" as const;
export const name = "Rank Sieve";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float rankOf(float id) {
    float r = 0.0;
    r = mix(r, 1.0, step(abs(id - 0.0), 0.25));
    r = mix(r, 5.0, step(abs(id - 1.0), 0.25));
    r = mix(r, 3.0, step(abs(id - 2.0), 0.25));
    r = mix(r, 0.0, step(abs(id - 3.0), 0.25));
    r = mix(r, 6.0, step(abs(id - 4.0), 0.25));
    r = mix(r, 2.0, step(abs(id - 5.0), 0.25));
    r = mix(r, 4.0, step(abs(id - 6.0), 0.25));
    return r;
  }

  float orderAt(float rank) {
    float id = 3.0;
    id = mix(id, 3.0, step(abs(rank - 0.0), 0.25));
    id = mix(id, 0.0, step(abs(rank - 1.0), 0.25));
    id = mix(id, 5.0, step(abs(rank - 2.0), 0.25));
    id = mix(id, 2.0, step(abs(rank - 3.0), 0.25));
    id = mix(id, 6.0, step(abs(rank - 4.0), 0.25));
    id = mix(id, 1.0, step(abs(rank - 5.0), 0.25));
    id = mix(id, 4.0, step(abs(rank - 6.0), 0.25));
    return id;
  }

  vec2 pat(float id, float k) {
    vec2 p0 = vec2(0.0);
    vec2 p = p0;
    float m = step(abs(id - 0.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, -8.0), vec2(0.0, 8.0), step(0.5, k)), vec2(9.0, 8.0), step(1.5, k)), vec2(9.0, 8.0), step(2.5, k)), m);
    m = step(abs(id - 1.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, -8.0), vec2(9.0, -8.0), step(0.5, k)), vec2(9.0, 8.0), step(1.5, k)), vec2(9.0, 8.0), step(2.5, k)), m);
    m = step(abs(id - 2.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, -8.0), vec2(9.0, 0.0), step(0.5, k)), vec2(0.0, 8.0), step(1.5, k)), vec2(0.0, 8.0), step(2.5, k)), m);
    m = step(abs(id - 3.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, -8.0), vec2(9.0, -8.0), step(0.5, k)), vec2(0.0, 8.0), step(1.5, k)), vec2(9.0, 8.0), step(2.5, k)), m);
    m = step(abs(id - 4.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, 0.0), vec2(9.0, -8.0), step(0.5, k)), vec2(9.0, 8.0), step(1.5, k)), vec2(0.0, 0.0), step(2.5, k)), m);
    m = step(abs(id - 5.0), 0.25);
    p = mix(p, mix(mix(mix(vec2(0.0, -8.0), vec2(4.0, 0.0), step(0.5, k)), vec2(9.0, -8.0), step(1.5, k)), vec2(9.0, 8.0), step(2.5, k)), m);
    m = step(abs(id - 6.0), 0.25);
    p = mix(p, mix(mix(mix(mix(vec2(0.0, -8.0), vec2(9.0, -8.0), step(0.5, k)), vec2(9.0, 0.0), step(1.5, k)), vec2(0.0, 0.0), step(2.5, k)), vec2(0.0, 8.0), step(3.5, k)), m);
    return p;
  }

  void main() {
    vec2 p = px();
    float n = 7.0;
    float pitch = (DW - 12.0) / n;
    float stepN = stepped(1.0 / 0.7, 1.0);
    float cycle = mod(stepN, 9.0);
    float level = audioMix();
    float keep = mix(max(2.0, 7.0 - cycle), max(2.0, ceil(level * 7.0)), step(0.06, level));
    float selected = orderAt(5.0 + mod(stepped(3.0, 2.0), 2.0));
    vec3 color = vec3(0.0);

    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float rank = rankOf(fi);
      float on = step(7.0 - keep, rank);
      float x = 6.0 + pitch * (fi + 0.5);
      float alpha = mix(0.16, 0.92, on);
      vec2 c = vec2(x, 21.0);
      for (int s = 0; s < 4; s++) {
        vec2 a = c + pat(fi, float(s)) - vec2(4.5, 0.0);
        vec2 b = c + pat(fi, float(s) + 1.0) - vec2(4.5, 0.0);
        color += paper * strokeSeg(p, a, b) * alpha;
      }
      color += paper * fillRect(p, vec2(x - 5.0, 32.0), vec2(2.0, 1.0)) * alpha * 0.7;
      color += paper * fillRect(p, vec2(x + 3.0, 32.0), vec2(2.0, 1.0)) * alpha * 0.7;
      color += paper * fillRect(p, vec2(x - 3.0, 4.0), vec2(6.0, 1.0)) * 0.5 * on;
      float chosen = 1.0 - step(0.5, abs(fi - selected));
      color += accent * strokeSeg(p, vec2(x - 4.0, 39.0), vec2(x, 35.0)) * chosen;
      color += accent * strokeSeg(p, vec2(x, 35.0), vec2(x + 4.0, 39.0)) * chosen;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
