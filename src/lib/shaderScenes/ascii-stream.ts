/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/geek-soundwaves.html — ascii()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Density glyphs . : + * # @ drawn without a font.
 * Holds at the archive's 7 Hz of song time. A beat grid would coarsen the stream.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "ascii-stream" as const;
export const name = "ASCII Stream";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.15 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float amp(float t) {
    float live = 0.13 + 0.87 * audioMix();
    float age = max(songSeconds() - t, 0.0);
    float follow = exp(-age * 3.0) * clamp(audioMix() * 6.0, 0.0, 1.0);
    return mix(signal(t), live, follow);
  }

  float glyph(vec2 q, float index) {
    float dotMid = 1.0 - smoothstep(0.35, 0.9, length(q));
    float dotHi = 1.0 - smoothstep(0.3, 0.85, length(q - vec2(0.0, -2.1)));
    float dotLo = 1.0 - smoothstep(0.3, 0.85, length(q - vec2(0.0, 2.1)));
    float hbar = fillRect(q, vec2(-2.2, -0.4), vec2(4.4, 0.8));
    float vbar = fillRect(q, vec2(-0.4, -3.1), vec2(0.8, 6.2));
    float h1 = fillRect(q, vec2(-2.3, -2.15), vec2(4.6, 0.65));
    float h2 = fillRect(q, vec2(-2.3, 1.45), vec2(4.6, 0.65));
    float v1 = fillRect(q, vec2(-1.55, -3.3), vec2(0.65, 6.6));
    float v2 = fillRect(q, vec2(0.9, -3.3), vec2(0.65, 6.6));
    float ring = (1.0 - smoothstep(2.15, 2.7, length(q))) * smoothstep(1.15, 1.6, length(q));
    float d1 = strokeSeg(q, vec2(-2.0, -2.0), vec2(2.0, 2.0));
    float d2 = strokeSeg(q, vec2(-2.0, 2.0), vec2(2.0, -2.0));
    float is0 = 1.0 - step(0.5, abs(index));
    float is1 = 1.0 - step(0.5, abs(index - 1.0));
    float is2 = 1.0 - step(0.5, abs(index - 2.0));
    float is3 = 1.0 - step(0.5, abs(index - 3.0));
    float is4 = 1.0 - step(0.5, abs(index - 4.0));
    float is5 = 1.0 - step(0.5, abs(index - 5.0));
    float g = dotMid * is0;
    g = max(g, max(dotHi, dotLo) * is1);
    g = max(g, max(hbar, vbar) * is2);
    g = max(g, max(max(hbar, vbar), max(d1, d2)) * is3);
    g = max(g, max(max(h1, h2), max(v1, v2)) * is4);
    g = max(g, max(ring, dotMid * 0.85) * is5);
    return clamp(g, 0.0, 1.0);
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float tick = floor(clockT * 7.0) / 7.0;
    float cols = max(4.0, floor(DW / 7.0));
    float pitch = DW / cols;
    float c = clamp(floor(p.x / pitch), 0.0, cols - 1.0);
    float r = clamp(floor((p.y - 2.0) / 13.0), 0.0, 2.0);
    float x = c / max(cols - 1.0, 1.0);
    float sample = amp(tick - (1.0 - x) * 1.6);
    float modv = 0.62 + 0.38 * sin(c * 0.6 + tick * 4.0 - r * 2.0);
    float midRow = 1.0 - step(0.5, abs(r - 1.0));
    float density = clamp(sample * modv + mix(-0.05, 0.19, midRow), 0.0, 1.0);
    float index = min(5.0, floor(density * 6.0));
    vec2 center = vec2(c * pitch + pitch * 0.5, 9.0 + r * 13.0);
    float mark = glyph(p - center, index);
    float alpha = 0.19 + 0.80 * density;
    vec3 ink = mix(paper, accent, smoothstep(0.55, 1.0, density));
    gl_FragColor = vec4(ink * mark * alpha, 1.0);
  }
`;
