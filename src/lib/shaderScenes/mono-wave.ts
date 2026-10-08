/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/soundwave-directions.html — mono()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * One bright wave and three fading echoes. Song time, not a beat grid.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "mono-wave" as const;
export const name = "Mono Wave";
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
    float amp = 3.0 + gain * 15.0;
    float x = clamp((p.x - 1.0) / (DW - 2.0), 0.0, 1.0);
    float env = envelope(x);
    vec3 color = vec3(0.0);

    for (int k = 0; k < 4; k++) {
      float lf = 3.0 - float(k);
      float y = 22.0 + env * amp * wave(x, motion - lf * 0.09) * (1.0 - lf * 0.18);
      float cover = 1.0 - smoothstep(0.25, 0.85, abs(p.y - y));
      float lead = 1.0 - step(0.5, lf);
      float alpha = mix(0.26 - lf * 0.04, 0.95, lead);
      vec3 ink = mix(paper, accent, lead);
      color = mix(color, ink, cover * alpha);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
