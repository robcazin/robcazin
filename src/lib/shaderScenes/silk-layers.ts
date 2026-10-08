/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/soundwave-directions.html — silk()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Eight thin parallel strokes that open with level. Song time, not a beat grid.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "silk-layers" as const;
export const name = "Silk Layers";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.13 + 0.5 * pow(abs(sin(t * 1.65)), 4.0) + 0.28 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float gainAt(float t) {
    float live = 0.13 + 0.87 * audioMix();
    return mix(signal(t), live, clamp(audioMix() * 6.0, 0.0, 1.0));
  }

  float envelope(float x) {
    return pow(max(sin(3.14159265 * clamp(x, 0.0, 1.0)), 0.0), 1.25);
  }

  float wave(float x, float t, float layer) {
    float drift = t * 1.5;
    return sin(x * 3.14159265 * (3.1 + layer * 0.11) - drift + layer * 0.6) * 0.72
      + sin(x * 3.14159265 * 5.3 + t * 0.9 - layer * 0.4) * 0.28;
  }

  void main() {
    vec2 p = px();
    float motion = songSeconds();
    float gain = gainAt(motion);
    float amp = 3.0 + gain * 15.0;
    float x = clamp((p.x - 1.0) / (DW - 2.0), 0.0, 1.0);
    float env = envelope(x);
    vec3 color = vec3(0.0);

    for (int layer = 0; layer < 8; layer++) {
      float lf = float(layer);
      float offset = (lf - 3.5) * 0.9;
      float y = 22.0 + env * (amp * 0.72 * wave(x, motion, lf * 0.33) + offset * (0.6 + gain * 1.8));
      float cover = 1.0 - smoothstep(0.15, 0.55, abs(p.y - y));
      float alpha = 0.25 + 0.45 * (1.0 - abs(lf - 3.5) / 4.0);
      float center = 1.0 - smoothstep(0.0, 2.0, abs(lf - 3.5));
      vec3 ink = mix(paper, accent, center * 0.55);
      color = mix(color, ink, cover * alpha);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
