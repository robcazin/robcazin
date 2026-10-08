/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/vector-soundwave-studies.html — dust()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Golden-angle phase cloud. The twist follows song time so pause and seek hold.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "xy-dust" as const;
export const name = "XY Dust";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float phase = clockT * 0.23;
    float gain = clamp(0.28 + audioMix() * 0.72, 0.0, 1.0);
    float sx = (DW * 0.5 - 3.0) * (0.50 + gain * 0.44);
    float sy = 6.0 + gain * 13.0;
    float twist = sin(phase) * 0.22;
    float ct = cos(twist);
    float st = sin(twist);
    vec3 color = vec3(0.0);

    color += paper * strokeSeg(p, vec2(DW * 0.5 - 2.0, 22.0), vec2(DW * 0.5 + 2.0, 22.0)) * 0.22;
    color += paper * strokeSeg(p, vec2(DW * 0.5, 20.0), vec2(DW * 0.5, 24.0)) * 0.22;

    for (int i = 0; i < 640; i++) {
      float fi = float(i);
      float q = fi * 2.39996323;
      float radius = 0.52 + 0.48 * (mod(fi * 37.0, 101.0) / 100.0);
      float a = sin(q * 2.0 + phase) * radius;
      float b = (sin(q * 3.0 + phase * 1.8) * 0.78 + sin(q * 7.0 - phase) * 0.22) * radius;
      float x = DW * 0.5 + sx * (a * ct - b * st) * 0.83;
      float y = 22.0 + sy * (a * st + b * ct) * 0.83;
      float bright = 0.22 + 0.55 * (0.5 + 0.5 * cos(q * 0.6 + clockT * 1.4));
      float big = 1.0 - step(0.5, mod(fi, 13.0));
      float reach = mix(0.42, 0.72, big);
      float dist = length(p - vec2(x, y));
      float speck = 1.0 - smoothstep(0.05, reach, dist);
      vec3 ink = mix(paper, accent, big * 0.65);
      color += ink * speck * bright;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
