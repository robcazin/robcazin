/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/soundwave-directions.html — spectrum()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Centered 1px bars. Live bands replace the archive spectrum when audio is present.
 * The underlying wave follows song time. Bars are continuous, not beat-stepped.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "fine-spectrum" as const;
export const name = "Fine Spectrum";
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

  float wave(float x, float t) {
    float drift = t * 1.5;
    return sin(x * 3.14159265 * 3.1 - drift) * 0.72 + sin(x * 3.14159265 * 5.3 + t * 0.9) * 0.28;
  }

  void main() {
    vec2 p = px();
    float motion = songSeconds();
    float gain = gainAt(motion);
    float count = floor(DW / 4.0);
    float n = count - 1.0;
    float u = clamp((p.x - 1.0) / (DW - 2.0), 0.0, 1.0);
    float col = floor(u * n + 0.5);
    float barU = col / n;
    float barX = 1.0 + barU * (DW - 2.0);
    float onX = 1.0 - smoothstep(0.35, 0.8, abs(p.x - barX));

    float lowW = 1.0 - smoothstep(0.0, 0.55, barU);
    float midW = smoothstep(0.15, 0.4, barU) * (1.0 - smoothstep(0.55, 0.85, barU));
    float highW = smoothstep(0.45, 1.0, barU);
    float liveSpec = clamp(audioLow * lowW + audioMid * midW + audioHigh * highW, 0.0, 1.0);
    float synthSample = gain * (0.3 + 0.7 * abs(wave(barU, motion)));
    float sample = mix(synthSample, liveSpec, clamp(audioMix() * 6.0, 0.0, 1.0));
    sample *= 0.72 + 0.28 * hash11(col + 3.0);

    float size = 1.0 + min(18.0, sample * 18.0) * (0.28 + 0.72 * envelope(barU));
    float onY = step(22.0 - size, p.y) * step(p.y, 22.0 + size);
    vec3 ink = mix(paper, accent, clamp(sample, 0.0, 1.0));
    gl_FragColor = vec4(ink * onX * onY * 0.9, 1.0);
  }
`;
