/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/geek-soundwaves.html — scope()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Lissajous trail. The phase follows song time. Quantizing it to beats
 * would freeze the orbit between steps, so it is not beat-snapped.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "vector-scope" as const;
export const name = "Vector Scope";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.15 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float gainAt(float t) {
    float live = 0.13 + 0.87 * audioMix();
    return mix(signal(t), live, clamp(audioMix() * 6.0, 0.0, 1.0));
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float gain = gainAt(clockT);
    float cy = 22.0;
    float cx = DW * 0.5;
    vec3 color = vec3(0.0);
    color += paper * strokeSeg(p, vec2(1.0, cy), vec2(DW - 1.0, cy)) * 0.13;
    color += paper * strokeSeg(p, vec2(cx, 2.0), vec2(cx, 42.0)) * 0.13;
    for (int i = 0; i < 18; i++) {
      float x = 10.0 + float(i) * 12.0;
      float live = step(x, DW - 2.0);
      color += paper * strokeSeg(p, vec2(x, cy - 1.5), vec2(x, cy + 1.5)) * 0.2 * live;
    }

    float sx = (DW * 0.5 - 5.0) * (0.55 + gain * 0.4);
    float sy = 5.0 + gain * 14.0;
    for (int k = 0; k < 4; k++) {
      float trail = 3.0 - float(k);
      float phase = clockT - trail * 0.045;
      float lead = 1.0 - step(0.5, trail);
      float alpha = mix(0.07 + (3.0 - trail) * 0.035, 0.95, lead);
      vec3 ink = mix(paper, accent, lead);
      for (int i = 0; i < 48; i++) {
        float a0 = float(i) / 48.0 * 6.2831853;
        float a1 = float(i + 1) / 48.0 * 6.2831853;
        vec2 a = vec2(
          cx + sx * sin(a0 * 2.0 + sin(phase * 0.6) * 0.48),
          cy + sy * sin(a0 * 3.0 + phase * 0.38)
        );
        vec2 b = vec2(
          cx + sx * sin(a1 * 2.0 + sin(phase * 0.6) * 0.48),
          cy + sy * sin(a1 * 3.0 + phase * 0.38)
        );
        color += ink * strokeSeg(p, a, b) * alpha;
      }
    }

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
