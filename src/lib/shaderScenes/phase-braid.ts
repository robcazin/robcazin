/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: https://github.com/kaganin/iwrzwr-visual-archive
 * 
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 * 
 * Muted palette adaptation for robcazin.com
 */

import { STRIP_FRAME_ASPECT } from "./iwrCommon";

export const id = "phase-braid" as const;

export const name = 'Phase Braid';

export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = `
  precision highp float;
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  // Soft monochrome palette
  const vec3 baseColor = vec3(0.88, 0.89, 0.86);
  const vec3 accentColor = vec3(0.72, 0.76, 0.82);
  
  vec3 braidPoint(float u, float t, float gain, float side) {
    float a = u * 12.566 - t; // 4*PI for complete cycles
    float taper = 0.38 + 0.62 * pow(sin(3.14159 * u), 0.65);
    float radius = (0.08 + gain * 0.20) * taper; // Much smaller radius
    
    float x = u;
    float y = 0.5 + sin(a + side * 3.14159) * radius;
    float depth = cos(a + side * 3.14159);
    
    return vec3(x, y, depth);
  }
  
  float lineDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Calmer time scaling
    float t = time * 0.4;
    
    // Audio reactivity - gentle
    float audioLevel = (audioLow * 0.5 + audioMid * 0.3 + audioHigh * 0.2);
    float gain = 0.3 + audioLevel * 0.4;
    
    float minDist = 1.0;
    float bestDepth = 0.0;
    
    // Sample along the braid
    int segments = 60;
    for(int i = 0; i < segments; i++) {
      float u1 = float(i) / float(segments);
      float u2 = float(i + 1) / float(segments);
      
      // Both sides of the braid
      for(int side = 0; side < 2; side++) {
        float sideF = float(side);
        vec3 p1 = braidPoint(u1, t, gain, sideF);
        vec3 p2 = braidPoint(u2, t, gain, sideF);
        
        float d = lineDist(uv, p1.xy, p2.xy);
        if(d < minDist) {
          minDist = d;
          bestDepth = (p1.z + 1.0) / 2.0; // Normalize depth to 0-1
        }
      }
    }
    
    // Soft line with depth-based brightness
    float line = smoothstep(0.008, 0.003, minDist);
    float brightness = 0.35 + bestDepth * 0.50;
    
    vec3 color = mix(baseColor, accentColor, bestDepth) * line * brightness;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
