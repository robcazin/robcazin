/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-01-raster-protocol.html — Gate Register
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "gate-register" as const;
export const name = "Gate Register";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  void main() {
    vec2 p = px();
    float n = min(14.0, max(6.0, floor(DW / 14.0)));
    float pitch = (DW - 4.0) / n;
    float cell = max(3.0, pitch - 4.0);
    float stepN = stepped(3.6, 2.0);
    float cursor = mod(stepN, n);
    float level = audioMix();
    vec3 color = vec3(0.0);

    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      float live = step(fi, n - 0.5);
      float x = 2.0 + fi * pitch;
      float bits = floor(hash11(fi + 8.0) * (48.0 + level * 79.0));
      for (int row = 0; row < 7; row++) {
        float fr = float(row);
        float bit = mod(floor(bits * exp2(-fr)), 2.0);
        float on = step(0.5, bit);
        float alpha = mix(0.09, 0.85, on);
        color += paper * fillRect(p, vec2(x, 8.0 + fr * 4.0), vec2(cell, 2.0)) * alpha * live;
      }
      float marked = 1.0 - step(0.5, abs(fi - cursor));
      vec3 mark = mix(paper, accent, marked);
      float markAlpha = mix(0.13, 1.0, marked);
      color += mark * fillRect(p, vec2(x, 39.0), vec2(cell, 1.0)) * markAlpha * live;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
