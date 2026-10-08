/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: studies/night-07-signal-translations.html — transcode()
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 *
 * Muted palette adaptation for robcazin.com
 */

import { IWR_PRELUDE, STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "transcode-window" as const;
export const name = "Transcode Window";
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

  float decoded(float index) {
    return encode(index) / 15.5 - 1.0;
  }

  void main() {
    vec2 p = px();
    float mid = DW * 0.5;
    float pitch = max(10.0, min(15.0, (DW * 0.5 - 16.0) / 5.0));
    float tick = stepped(1.0 / 0.24, 2.0);
    float phase = mix(fract(songSeconds() / 0.24), beatPhase, known());
    float room = DW * 0.5 - 13.0;
    float slots = max(3.0, floor(room / pitch));
    vec3 color = vec3(0.0);

    color += paper * (1.0 - smoothstep(0.2, 0.85, abs(p.x - mid))) * step(4.0, p.y) * step(p.y, 40.0) * 0.45;
    color += paper * fillRect(p, vec2(mid - 3.0, 4.0), vec2(6.0, 1.0)) * 0.7;
    color += paper * fillRect(p, vec2(mid - 3.0, 40.0), vec2(6.0, 1.0)) * 0.7;

    for (int slot = 0; slot < 8; slot++) {
      float fs = float(slot);
      float live = step(fs, slots - 0.5);
      float x = mid - 8.0 - (fs - phase) * pitch;
      float onStrip = step(3.0, x) * step(x, mid - 3.0);
      float value = encode(tick + fs);
      float near = 1.0 - step(pitch * 1.3, abs(x - mid));
      for (int bit = 0; bit < 5; bit++) {
        float fb = float(bit);
        float on = mod(floor(value * exp2(-fb)), 2.0);
        float bitOn = step(0.5, on);
        float w = mix(1.0, 4.0, bitOn);
        vec3 ink = mix(paper, accent, bitOn * near);
        float alpha = mix(0.16, mix(0.72, 1.0, 1.0 - step(0.5, fs)), bitOn);
        color += ink * fillRect(p, vec2(x - w * 0.5, 10.0 + fb * 5.0), vec2(w, 2.0)) * alpha * live * onStrip;
      }
    }

    vec2 prev = vec2(mid + 7.0, 22.0 - decoded(tick) * 12.0);
    for (int slot = 0; slot < 8; slot++) {
      float fs = float(slot);
      float live = step(fs, slots - 0.5);
      float x = mid + 7.0 + fs * pitch;
      float y = 22.0 - decoded(tick - fs) * 12.0;
      float first = 1.0 - step(0.5, fs);
      color += paper * strokeSeg(p, prev, vec2(x, prev.y)) * (1.0 - first) * live * 0.95;
      color += paper * strokeSeg(p, vec2(x, prev.y), vec2(x, y)) * (1.0 - first) * live * 0.95;
      float nextX = min(DW - 3.0, x + pitch);
      color += paper * strokeSeg(p, vec2(x, y), vec2(nextX, y)) * live * 0.95;
      float lead = 1.0 - step(0.5, fs);
      vec3 ink = mix(paper, accent, lead);
      float alpha = mix(0.45, 1.0, lead);
      color += ink * fillRect(p, vec2(x - 1.0, y - 1.0), vec2(2.0)) * alpha * live;
      prev = vec2(nextX, y);
    }
    float headY = 22.0 - decoded(tick) * 12.0;
    color += accent * fillRect(p, vec2(mid + 6.0, headY - 1.5), vec2(3.0)) ;

    gl_FragColor = vec4(color, 1.0);
  }
`;
