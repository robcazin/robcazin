/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/soundwave-directions.html — ribbon()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Four filled ribbons plus a center stroke, screen-blended.
 * The sweep follows song time. A beat grid would freeze the wave, so it is not stepped.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "spectrum-ribbon" as const;
export const name = "Spectrum Ribbon";
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

  vec3 layerColor(float layer) {
    vec3 ink = vec3(0.36, 0.62, 0.72);
    ink = mix(ink, vec3(0.48, 0.50, 0.74), step(0.5, layer));
    ink = mix(ink, vec3(0.66, 0.46, 0.74), step(1.5, layer));
    ink = mix(ink, vec3(0.78, 0.52, 0.60), step(2.5, layer));
    return mix(ink, accent, 0.34);
  }

  void main() {
    vec2 p = px();
    float motion = songSeconds();
    float gain = gainAt(motion);
    float amp = 3.0 + gain * 15.0;
    float x = clamp(p.x / DW, 0.0, 1.0);
    float env = envelope(x);
    vec3 color = vec3(0.0);

    for (int layer = 0; layer < 4; layer++) {
      float lf = float(layer);
      float mid = 22.0 + env * amp * wave(x, motion, lf);
      float thick = env * (1.2 + gain * 2.8) * (0.65 + 0.35 * sin(x * 9.0 + motion + lf));
      float dy = abs(p.y - mid);
      float fill = 1.0 - smoothstep(thick, thick + 0.55, dy);
      float spine = 1.0 - smoothstep(0.15, 0.7, dy);
      vec3 ink = layerColor(lf) * clamp(fill * 0.32 + spine * 0.78, 0.0, 1.0);
      color = 1.0 - (1.0 - color) * (1.0 - ink);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
