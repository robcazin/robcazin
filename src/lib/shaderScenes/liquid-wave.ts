/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/soundwave-directions.html — liquid()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * One filled organic wave with a bright top edge. Song time, not a beat grid.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "liquid-wave" as const;
export const name = "Liquid Wave";
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

  void main() {
    vec2 p = px();
    float motion = songSeconds();
    float gain = gainAt(motion);
    float x = clamp(p.x / DW, 0.0, 1.0);
    float env = envelope(x);
    float thickness = env * (3.0 + gain * 12.0) * (0.72 + 0.2 * sin(x * 12.0 - motion * 1.8) + 0.08 * sin(x * 21.0 + motion));
    float axis = 22.0 + env * sin(x * 7.0 + motion) * gain * 3.0;
    float fill = 1.0 - smoothstep(thickness, thickness + 0.45, abs(p.y - axis));
    float top = 1.0 - smoothstep(0.15, 0.65, abs(p.y - (axis - thickness)));

    vec3 cool = mix(vec3(0.52, 0.70, 0.74), accent, 0.42);
    vec3 warm = mix(vec3(0.48, 0.46, 0.56), accent, 0.5);
    vec3 grad = mix(cool, vec3(0.96, 0.96, 0.94), smoothstep(0.0, 0.45, x));
    grad = mix(grad, warm, smoothstep(0.45, 1.0, x));

    vec3 color = grad * fill * 0.85;
    color = mix(color, paper, top * 0.85);
    gl_FragColor = vec4(color, 1.0);
  }
`;
