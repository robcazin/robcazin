/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/geek-soundwaves.html — spectral()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Columns scroll left at the archive rate (0.075 of song time) and hold at 10 Hz.
 * The right edge follows the analyser. A beat grid would coarsen the tape.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "spectral-tape" as const;
export const name = "Spectral Tape";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float signal(float t) {
    return 0.15 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  float amp(float t) {
    float live = 0.13 + 0.87 * audioMix();
    float age = max(songSeconds() - t, 0.0);
    float follow = exp(-age * 4.0) * clamp(audioMix() * 6.0, 0.0, 1.0);
    return mix(signal(t), live, follow);
  }

  float liveBand(float freq) {
    float highW = smoothstep(0.45, 1.0, freq);
    float midW = smoothstep(0.12, 0.4, freq) * (1.0 - smoothstep(0.55, 0.9, freq));
    float lowW = 1.0 - smoothstep(0.0, 0.5, freq);
    return clamp(audioHigh * highW + audioMid * midW + audioLow * lowW, 0.0, 1.0);
  }

  float spectrum(float t, float freq, float age) {
    float f1 = 0.24 + 0.1 * sin(t * 0.7);
    float f2 = 0.6 + 0.18 * sin(t * 1.3);
    float da = (freq - f1) / 0.14;
    float db = (freq - f2) / 0.095;
    float a = exp(-(da * da));
    float b = exp(-(db * db));
    float noise = 0.5 + 0.5 * sin(t * 9.0 + freq * 22.0) * cos(t * 4.0 - freq * 34.0);
    float synth = clamp((a + b * 0.78) * signal(t) * 1.22 + noise * 0.08, 0.0, 1.0);
    float follow = exp(-age * 4.0) * clamp(audioMix() * 6.0, 0.0, 1.0);
    return mix(synth, liveBand(freq) * amp(t), follow);
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float tick = floor(clockT * 10.0) / 10.0;
    float cols = max(10.0, floor(DW / 3.0));
    float rows = 11.0;
    float pitch = DW / cols;
    float c = clamp(floor(p.x / pitch), 0.0, cols - 1.0);
    float r = clamp(floor(p.y / 4.0), 0.0, rows - 1.0);
    float age = (cols - 1.0 - c) * 0.075;
    float freq = 1.0 - r / (rows - 1.0);
    float sample = spectrum(tick - age, freq, age);
    float show = step(0.10, sample);
    vec2 origin = vec2(floor(c * pitch), r * 4.0);
    vec2 size = vec2(max(1.0, floor(pitch) - 0.75), 3.0);
    float cell = fillRect(p, origin, size) * show;
    float quant = floor(clamp(sample, 0.0, 1.0) * 5.0 + 0.5) / 5.0;
    float alpha = quant * 0.88 + 0.08;
    vec3 ink = mix(paper, accent, smoothstep(0.35, 1.0, sample));
    vec3 color = ink * cell * alpha;
    color += accent * strokeSeg(p, vec2(DW - 0.5, 1.0), vec2(DW - 0.5, 43.0)) * 0.64;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
