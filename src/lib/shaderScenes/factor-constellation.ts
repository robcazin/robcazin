/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-05-plotter-logic.html — factors()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "factor-constellation" as const;
export const name = "Factor Constellation";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  vec2 pairAt(float idx) {
    float i = mod(idx, 6.0);
    float a = 2.0;
    a = mix(a, 2.0, step(abs(i - 0.0), 0.25));
    a = mix(a, 2.0, step(abs(i - 1.0), 0.25));
    a = mix(a, 3.0, step(abs(i - 2.0), 0.25));
    a = mix(a, 3.0, step(abs(i - 3.0), 0.25));
    a = mix(a, 3.0, step(abs(i - 4.0), 0.25));
    a = mix(a, 2.0, step(abs(i - 5.0), 0.25));
    float b = 3.0;
    b = mix(b, 3.0, step(abs(i - 0.0), 0.25));
    b = mix(b, 4.0, step(abs(i - 1.0), 0.25));
    b = mix(b, 3.0, step(abs(i - 2.0), 0.25));
    b = mix(b, 4.0, step(abs(i - 3.0), 0.25));
    b = mix(b, 5.0, step(abs(i - 4.0), 0.25));
    b = mix(b, 6.0, step(abs(i - 5.0), 0.25));
    return vec2(a, b);
  }

  void main() {
    vec2 p = px();
    float groups = 3.0;
    float pitch = DW / groups;
    float stepN = stepped(1.6, 1.0);
    float active = mod(stepN, 3.0);
    float spin = songSeconds() * 0.22;
    vec3 color = vec3(0.0);

    for (int g = 0; g < 3; g++) {
      float fg = float(g);
      float tick = stepN + fg * 2.0;
      float pairIndex = mod(tick, 6.0);
      float lowGate = 1.0 - step(0.5, fg);
      float midGate = step(0.5, fg) * (1.0 - step(1.5, fg));
      float highGate = step(1.5, fg);
      float band = audioLow * lowGate + audioMid * midGate + audioHigh * highGate;
      pairIndex = mix(pairIndex, floor(clamp(band, 0.0, 0.999) * 6.0), step(0.12, band));
      vec2 pair = pairAt(pairIndex);
      float cx = pitch * (fg + 0.5);
      float isActive = 1.0 - step(0.5, abs(fg - active));
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float iLive = step(fi, pair.x - 0.5);
        float theta = fi / max(pair.x, 1.0) * 6.2831853 - 1.5707963 + spin;
        vec2 center = vec2(cx + cos(theta) * 11.0, 22.0 + sin(theta) * 11.0);
        for (int j = 0; j < 6; j++) {
          float fj = float(j);
          float jLive = step(fj, pair.y - 0.5);
          float phi = fj / max(pair.y, 1.0) * 6.2831853 - 1.5707963;
          vec2 dotp = center + vec2(cos(phi), sin(phi)) * 4.5;
          float lead = isActive * (1.0 - step(0.5, abs(fi)));
          vec3 ink = mix(paper, accent, lead);
          float alpha = mix(0.65, 0.95, isActive);
          color += ink * fillRect(p, dotp - vec2(1.0), vec2(2.0)) * alpha * iLive * jLive;
        }
      }
      float total = pair.x * pair.y;
      for (int mark = 0; mark < 18; mark++) {
        float fm = float(mark);
        float live = step(fm, total - 0.5);
        vec3 ink = mix(paper, accent, isActive);
        color += ink * fillRect(p, vec2(cx - total + fm * 2.0, 42.0), vec2(1.0)) * 0.25 * live;
      }
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
