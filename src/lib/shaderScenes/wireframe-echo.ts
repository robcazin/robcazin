/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/geek-soundwaves.html — wireframe()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Perspective terrain that swells with level. Song time, not a beat grid.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "wireframe-echo" as const;
export const name = "Wireframe Echo";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.15 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float gainAt(float t) {
    float live = 0.13 + 0.87 * audioMix();
    return mix(signal(t), live, clamp(audioMix() * 6.0, 0.0, 1.0));
  }

  vec2 terrain(float u, float v, float time, float gain) {
    float perspective = 0.60 + v * 0.40;
    float x = DW * 0.5 + (u - 0.5) * (DW - 4.0) * perspective;
    float swell = 0.6 + 0.4 * sin(time * 1.8 - v * 4.5);
    float shape = pow(max(sin(3.14159265 * clamp(u, 0.0, 1.0)), 0.0), 1.1)
      * (0.45 * sin(u * 14.0 + v * 3.4 - time * 1.6) + 0.55 * sin(u * 8.0 - time * 1.1 - v * 1.7));
    float baseline = 7.0 + 30.0 * v;
    float height = min(min(3.0 + gain * 9.0, baseline - 2.0), 42.0 - baseline);
    return vec2(x, baseline + shape * height * swell);
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float gain = gainAt(clockT);
    vec3 color = vec3(0.0);

    for (int r = 0; r < 7; r++) {
      float v = float(r) / 6.0;
      float alpha = 0.16 + v * 0.64;
      vec3 ink = mix(paper, accent, v * 0.7);
      for (int c = 0; c < 22; c++) {
        vec2 a = terrain(float(c) / 22.0, v, clockT, gain);
        vec2 b = terrain(float(c + 1) / 22.0, v, clockT, gain);
        color += ink * strokeSeg(p, a, b) * alpha;
      }
    }

    for (int c = 0; c < 9; c++) {
      float u = float(c) / 8.0;
      for (int r = 0; r < 12; r++) {
        vec2 a = terrain(u, float(r) / 12.0, clockT, gain);
        vec2 b = terrain(u, float(r + 1) / 12.0, clockT, gain);
        color += paper * strokeSeg(p, a, b) * 0.30;
      }
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
