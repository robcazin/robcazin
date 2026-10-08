/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-01-raster-protocol.html — packets()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * The raster follows the archive: dashed envelopes under a fixed read head,
 * contained in the 226×44 phone strip.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "packet-stitch" as const;
export const name = "Packet Stitch";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  void main() {
    vec2 p = px();
    float spacing = 35.0;
    float head = DW * 0.35;
    float travel = mix(songSeconds() * 27.0, floor(beat * 2.0) * 0.5 * spacing, known());
    float travelMod = mod(travel, spacing);
    float base = floor(travel / spacing);
    vec3 color = vec3(0.0);

    color += paper * (1.0 - smoothstep(0.2, 0.9, abs(p.y - 22.0))) * 0.13;

    for (int i = -2; i < 10; i++) {
      float fi = float(i);
      float index = fi + base;
      float x = fi * spacing - travelMod;
      float band = mix(audioLow, audioHigh, step(0.5, mod(index, 2.0)));
      float v = mix(hash11(index + 23.0), clamp(band, 0.0, 1.0), 0.72);
      float size = 12.0 + v * 17.0;
      float height = 6.0 + floor(v * 6.0 + 0.001) * 2.0;
      float active = step(x, head) * step(head, x + size);
      vec3 ink = mix(paper, accent, active);
      float alpha = mix(0.55, 1.0, active);
      vec2 origin = vec2(x, 22.0 - height * 0.5);
      float box = fillRect(p, origin, vec2(size, height));
      float inner = fillRect(p, origin + vec2(0.8), vec2(size - 1.6, height - 1.6));
      color += ink * (box * (1.0 - inner)) * alpha;

      float localX = p.x - x;
      float tickGate = step(3.0, localX) * step(localX, size - 2.0);
      float tickMod = mod(localX - 3.0, 4.0);
      float tick = step(tickMod, 1.0);
      float tickY = fillRect(p, vec2(x, 20.0), vec2(size, 4.0));
      color += paper * tickGate * tick * tickY * (0.3 + hash11(index + floor(localX)) * 0.6);

      color += paper * fillRect(p, vec2(x + size + 3.0, 22.0), vec2(2.0, 1.0)) * 0.35;
    }

    float headLine = step(3.0, p.y) * step(p.y, 41.0) * (1.0 - smoothstep(0.15, 0.85, abs(p.x - head)));
    color += accent * headLine * 0.9;
    color += accent * fillRect(p, vec2(head - 2.0, 2.0), vec2(5.0, 2.0));

    gl_FragColor = vec4(color, 1.0);
  }
`;
