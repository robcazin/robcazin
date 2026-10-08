/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/vector-soundwave-studies.html — braid()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Two strands and the rungs between them, in the 226×44 strip.
 * Rotation follows song time.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "phase-braid" as const;
export const name = "Phase Braid";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  vec3 strand(float u, float spin, float gain, float side) {
    float a = u * 12.5663706 - spin + side * 3.14159265;
    float taper = 0.38 + 0.62 * pow(max(sin(3.14159265 * u), 0.0), 0.65);
    float radius = (4.0 + gain * 13.0) * taper;
    return vec3(2.0 + u * (DW - 4.0), 22.0 + sin(a) * radius, cos(a));
  }

  void main() {
    vec2 p = px();
    float spin = songSeconds();
    float gain = clamp(0.34 + audioMix() * 0.62, 0.0, 1.0);
    vec3 color = vec3(0.0);

    for (int i = 0; i < 41; i++) {
      float u = float(i) / 40.0;
      vec3 a = strand(u, spin, gain, 0.0);
      vec3 b = strand(u, spin, gain, 1.0);
      float alpha = 0.13 + 0.22 * abs(a.z);
      color += paper * strokeSeg(p, a.xy, b.xy) * alpha;
    }

    for (int side = 0; side < 2; side++) {
      float sideF = float(side);
      for (int i = 0; i < 96; i++) {
        float u0 = float(i) / 96.0;
        float u1 = float(i + 1) / 96.0;
        vec3 a = strand(u0, spin, gain, sideF);
        vec3 b = strand(u1, spin, gain, sideF);
        float depth = (a.z + 1.0) * 0.5;
        float alpha = 0.28 + 0.68 * depth;
        vec3 ink = mix(paper, accent, depth);
        color += ink * strokeSeg(p, a.xy, b.xy) * alpha;
      }
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
