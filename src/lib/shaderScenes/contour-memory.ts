/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/vector-soundwave-studies.html — contour()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Eight delayed silhouettes. Each layer fills black down to the baseline
 * so older contours stay behind it, matching the archive.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "contour-memory" as const;
export const name = "Contour Memory";
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
    float clockT = songSeconds() * 0.72;
    vec3 color = vec3(0.0);

    for (int layer = 0; layer < 8; layer++) {
      float z = float(layer);
      float age = (7.0 - z) * 0.32;
      float stamp = clockT - age;
      float heard = mix(synthAmp(stamp), 0.13 + 0.87 * audioMix(), exp(-age * 1.4));
      float span = (DW - 4.0) * (0.61 + z * 0.055);
      float uRaw = (p.x - DW * 0.5) / span + 0.5;
      float u = clamp(uRaw, 0.0, 1.0);
      float inside = step(0.0, uRaw) * step(uRaw, 1.0);
      float taper = pow(max(sin(3.14159265 * u), 0.0), 1.8);
      float ridge = abs(wave(u * 0.65 - stamp * 0.35)) * taper;
      float base = 11.0 + z * 3.9;
      float rise = (4.0 + 11.0 * heard) * (0.60 + z * 0.06);
      float yLine = base - ridge * min(rise, max(base - 2.0, 0.0));
      float cover = inside * step(yLine, p.y);
      color *= (1.0 - cover);
      float front = step(6.5, z);
      float width = mix(0.85, 1.15, front);
      float stroke = inside * (1.0 - smoothstep(width * 0.45, width, abs(p.y - yLine)));
      vec3 ink = mix(paper, accent, front);
      float alpha = (0.18 + z * 0.11) * mix(1.0, 1.35, front);
      color += ink * stroke * alpha;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
