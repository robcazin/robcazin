/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-07-signal-translations.html — perforation()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "perforation-logic" as const;
export const name = "Perforation Logic";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float rawSample(float index) {
    float tone = sin(index * 0.69) + sin(index * 1.37) * 0.28;
    float env = 0.22 + audioMix() * 0.78;
    return clamp(tone * env, -1.0, 1.0);
  }

  float encode(float index) {
    return floor((rawSample(index) + 1.0) * 15.5 + 0.5);
  }

  void main() {
    vec2 p = px();
    float columns = 16.0;
    float pitch = (DW - 12.0) / columns;
    float stepN = stepped(2.2, 1.0);
    float read = mod(stepN, columns);
    float hole = max(2.0, min(4.0, pitch - 3.0));
    vec3 color = vec3(0.0);

    color += paper * strokeSeg(p, vec2(2.0, 8.0), vec2(2.0, 4.0)) * 0.3;
    color += paper * strokeSeg(p, vec2(2.0, 4.0), vec2(DW - 6.0, 4.0)) * 0.3;
    color += paper * strokeSeg(p, vec2(DW - 6.0, 4.0), vec2(DW - 2.0, 8.0)) * 0.3;
    color += paper * strokeSeg(p, vec2(DW - 2.0, 8.0), vec2(DW - 2.0, 40.0)) * 0.3;
    color += paper * strokeSeg(p, vec2(DW - 2.0, 40.0), vec2(2.0, 40.0)) * 0.3;
    color += paper * strokeSeg(p, vec2(2.0, 40.0), vec2(2.0, 8.0)) * 0.3;

    for (int col = 0; col < 16; col++) {
      float fc = float(col);
      float x = 6.0 + (fc + 0.5) * pitch;
      float selected = 1.0 - step(0.5, abs(fc - read));
      color += paper * fillRect(p, vec2(x - 1.0, 6.0), vec2(2.0)) * 0.3;
      color += paper * fillRect(p, vec2(x - 1.0, 36.0), vec2(2.0)) * 0.3;
      float value = encode(2.0 * columns + fc);
      float longBit = mod(value, 2.0);
      float upper = mod(floor(value * 0.5), 4.0);
      float lower = mod(floor(value / 8.0), 4.0);
      vec3 ink = mix(paper, accent, selected);
      float alpha = mix(0.67, 1.0, selected);
      float upperOn = step(0.5, upper);
      float upperH = mix(2.0, 5.0, step(0.5, longBit));
      color += ink * fillRect(p, vec2(x - hole * 0.5, 11.0 + upper * 2.0), vec2(hole, upperH)) * alpha * upperOn;
      float lowerOn = step(0.5, lower);
      float lowerH = mix(4.0, 2.0, step(0.5, longBit));
      color += ink * fillRect(p, vec2(x - hole * 0.5, 24.0 + lower), vec2(hole, lowerH)) * alpha * lowerOn;
      color += ink * fillRect(p, vec2(x - pitch * 0.4, 2.0), vec2(pitch * 0.8, 1.0)) * selected;
      color += accent * (1.0 - smoothstep(0.2, 0.8, abs(p.x - x))) * step(9.0, p.y) * step(p.y, 34.0) * 0.25 * selected;
      color += accent * fillRect(p, vec2(x - 1.0, 41.0), vec2(2.0)) * selected;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
