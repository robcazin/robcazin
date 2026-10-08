/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/geek-soundwaves.html — teletext()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Center-out mosaic on a 7px pitch. Holds at the archive's 9 Hz of song time.
 * Folding that onto quarter notes would coarsen the grid, so it is not beat-snapped.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "teletext-pulse" as const;
export const name = "Teletext Pulse";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.15 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float gainAt(float t) {
    float live = 0.13 + 0.87 * audioMix();
    return mix(signal(t), live, clamp(audioMix() * 6.0, 0.0, 1.0));
  }

  float audio(float t) {
    return sin(t * 15.0) * 0.55 + sin(t * 24.3 + 0.8) * 0.28 + sin(t * 37.7) * 0.17;
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float tick = floor(clockT * 9.0) / 9.0;
    float gain = gainAt(clockT);
    float cols = max(8.0, floor(DW / 7.0));
    float pitch = DW / cols;
    float c = clamp(floor(p.x / pitch), 0.0, cols - 1.0);
    float r = clamp(floor((p.y - 3.0) / 4.75), 0.0, 7.0);
    float x = c / max(cols - 1.0, 1.0);
    float local = gain * (0.4 + 0.6 * abs(audio(tick + x * 0.6)));
    float extent = max(1.0, floor(local * 4.0 + 0.5));
    float d = abs(r - 3.5);
    float lit = 1.0 - step(extent, d);
    float frontier = step(extent - 1.0, d);
    float alpha = mix(0.43 + 0.22 * local, 0.9, frontier);
    vec2 origin = vec2(floor(c * pitch) + 1.0, 3.0 + r * 4.75);
    vec2 size = vec2(max(2.0, floor(pitch) - 1.5), 4.0);
    float cell = fillRect(p, origin, size) * lit;
    vec3 ink = mix(paper, accent, frontier);
    gl_FragColor = vec4(ink * cell * alpha, 1.0);
  }
`;
