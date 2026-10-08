/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/vector-soundwave-studies.html — terminal()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com.
 * Box-drawing steps (the archive's ┌ ┐ └ ┘ ─ │ grid) without a font.
 * Holds update on sixteenth notes when a tempo is known.
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "terminal-trace" as const;
export const name = "Terminal Trace";
export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = IWR_PRELUDE + `
  float wave(float t) {
    return sin(t * 12.0) * 0.60 + sin(t * 21.5 + 0.8) * 0.25 + sin(t * 32.6) * 0.15;
  }

  float rowOf(float value) {
    float top = step(0.19, value);
    float bot = step(0.19, -value);
    float mid = (1.0 - top) * (1.0 - bot);
    return mid + bot * 2.0;
  }

  float sampleAt(float xNorm, float tick) {
    float stamp = tick - (1.0 - xNorm) * 1.9;
    float synth = 0.16 + 0.52 * pow(abs(sin(stamp * 1.65)), 4.0);
    float amp = 0.3 + mix(synth, audioMix(), exp(-(1.0 - xNorm) * 1.1));
    return wave(stamp) * amp;
  }

  float glyph(vec2 p, vec2 c, float kind) {
    float hL = strokeSeg(p, vec2(c.x - 3.3, c.y), vec2(c.x, c.y));
    float hR = strokeSeg(p, vec2(c.x, c.y), vec2(c.x + 3.3, c.y));
    float hFull = strokeSeg(p, vec2(c.x - 3.3, c.y), vec2(c.x + 3.3, c.y));
    float vD = strokeSeg(p, vec2(c.x, c.y), vec2(c.x, c.y + 6.0));
    float vU = strokeSeg(p, vec2(c.x, c.y - 6.0), vec2(c.x, c.y));
    float bar = hFull * step(0.5, kind) * step(kind, 1.5);
    float down = (hL + vD) * step(1.5, kind) * step(kind, 2.5);
    float up = (hL + vU) * step(2.5, kind) * step(kind, 3.5);
    float elbowDown = (vU + hR) * step(3.5, kind) * step(kind, 4.5);
    float elbowUp = (vD + hR) * step(4.5, kind) * step(kind, 5.5);
    return clamp(bar + down + up + elbowDown + elbowUp, 0.0, 1.0);
  }

  void main() {
    vec2 p = px();
    float secPerBeat = 60.0 / max(bpm, 1.0);
    float freeTick = floor(time * 8.0) / 8.0;
    float held = floor(beat * 4.0) * 0.25 * secPerBeat;
    float tick = mix(freeTick, held, known());
    float columns = floor(DW / 7.22);
    float left = (DW - columns * 7.22) * 0.5;
    vec3 color = vec3(0.0);

    for (int i = 0; i < 32; i++) {
      float fi = float(i);
      float live = step(fi, columns - 0.5);
      float xNorm = fi / max(columns, 1.0);
      float y = rowOf(sampleAt(xNorm, tick));
      float nxt = rowOf(sampleAt((fi + 1.0) / max(columns, 1.0), tick));
      float same = step(abs(y - nxt), 0.25);
      float down = step(y + 0.5, nxt) * (1.0 - same);
      float up = step(nxt + 0.5, y) * (1.0 - same);
      float cx = left + (fi + 0.5) * 7.22;
      float alpha = 0.34 + xNorm * 0.6;
      float lead = step(columns - 1.5, fi);
      vec3 ink = mix(paper, accent, lead);
      vec2 at = vec2(cx, 8.0 + y * 12.0);
      float kind = same * 1.0 + down * 2.0 + up * 3.0;
      color += ink * glyph(p, at, kind) * alpha * live;
      vec2 to = vec2(cx, 8.0 + nxt * 12.0);
      float other = down * 4.0 + up * 5.0;
      color += ink * glyph(p, to, other) * alpha * live;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
