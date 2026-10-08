/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/vector-soundwave-studies.html — sweep()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * The head writes the archive wave and the trail fades like phosphor.
 * With a tempo, one sweep is one bar.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "phosphor-sweep" as const;
export const name = "Phosphor Sweep";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float wave(float t) {
    return sin(t * 12.0) * 0.60 + sin(t * 21.5 + 0.8) * 0.25 + sin(t * 32.6) * 0.15;
  }

  float synthAmp(float t) {
    return 0.16 + 0.52 * pow(abs(sin(t * 1.65)), 4.0) + 0.26 * pow(abs(sin(t * 3.15 + 0.7)), 8.0);
  }

  void main() {
    vec2 p = px();
    float clockT = songSeconds();
    float barSeconds = 4.0 * 60.0 / max(bpm, 1.0);
    float duration = mix(2.2, barSeconds, known());
    float freeHead = mod(time, 2.2) / 2.2;
    float head = mix(freeHead, fract(beat * 0.25), known());
    float span = DW - 4.0;
    vec3 color = vec3(0.0);

    color += paper * strokeSeg(p, vec2(1.0, 22.0), vec2(DW - 1.0, 22.0)) * 0.11;
    for (int i = 0; i < 16; i++) {
      float x = 10.0 + float(i) * 14.0;
      float live = step(x, DW - 1.0);
      color += paper * strokeSeg(p, vec2(x, 20.5), vec2(x, 23.5)) * 0.22 * live;
    }

    for (int i = 0; i < 72; i++) {
      float u0 = float(i) / 72.0;
      float u1 = float(i + 1) / 72.0;
      float age0 = mod(head - u0, 1.0) * duration;
      float age1 = mod(head - u1, 1.0) * duration;
      float joined = step(abs(age0 - age1), duration * 0.5);
      float sampled = clockT - age0;
      float follow = exp(-age0 * 1.5);
      float amp = mix(synthAmp(sampled), 0.13 + 0.87 * audioMix(), follow);
      float y0 = 22.0 + wave(sampled) * min(18.0, 3.0 + amp * 16.0);
      float sampled1 = clockT - age1;
      float follow1 = exp(-age1 * 1.5);
      float amp1 = mix(synthAmp(sampled1), 0.13 + 0.87 * audioMix(), follow1);
      float y1 = 22.0 + wave(sampled1) * min(18.0, 3.0 + amp1 * 16.0);
      float alpha = 0.12 + 0.80 * exp(-age0 / 0.65);
      color += paper * strokeSeg(p, vec2(2.0 + u0 * span, y0), vec2(2.0 + u1 * span, y1)) * alpha * joined;
    }

    float tipAmp = mix(synthAmp(clockT), 0.13 + 0.87 * audioMix(), 1.0);
    float tipY = 22.0 + wave(clockT) * min(18.0, 3.0 + tipAmp * 16.0);
    float tipX = 2.0 + head * span;
    color += accent * fillRect(p, vec2(tipX - 1.0, tipY - 1.0), vec2(2.0, 2.0));

    gl_FragColor = vec4(color, 1.0);
  }
`;
