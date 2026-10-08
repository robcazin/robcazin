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

export const id = "spectrum-ribbon" as const;

export const name = 'Spectrum Ribbon';

export const frameAspect = STRIP_FRAME_ASPECT;

export const fragmentShader = `
  precision highp float;
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  // Softened palette - muted blues and purples
  const vec3 color1 = vec3(0.45, 0.52, 0.58); // soft blue-gray
  const vec3 color2 = vec3(0.50, 0.48, 0.62); // muted lavender
  const vec3 color3 = vec3(0.55, 0.46, 0.60); // dusty purple
  const vec3 color4 = vec3(0.48, 0.50, 0.64); // soft periwinkle
  
  float envelope(float x) {
    float clamped = clamp(x, 0.0, 1.0);
    return pow(sin(3.14159 * clamped), 1.25);
  }
  
  float wave(float x, float t, float layer) {
    return sin(x * 3.14159 * (3.1 + layer * 0.11) - t + layer * 0.6) * 0.72 
         + sin(x * 3.14159 * 5.3 + t * 0.5 - layer * 0.4) * 0.28;
  }
  
  void main() {
    vec2 uv = vUv;
    float x = uv.x;
    float y = uv.y;
    
    // Calmer motion - reduced from 1.5 to 0.6
    float motion = time * 0.6;
    
    // Audio-reactive amplitude (calmer response)
    float audioLevel = (audioLow * 0.5 + audioMid * 0.3 + audioHigh * 0.2);
    float amp = 0.15 + audioLevel * 0.25; // Much more subdued
    
    vec3 finalColor = vec3(0.0);
    
    // Four ribbon layers with additive blending
    for(int layer = 0; layer < 4; layer++) {
      float layerF = float(layer);
      vec3 layerColor;
      
      if(layer == 0) layerColor = color1;
      else if(layer == 1) layerColor = color2;
      else if(layer == 2) layerColor = color3;
      else layerColor = color4;
      
      // Calculate wave position
      float mid = 0.5 + envelope(x) * amp * wave(x, motion, layerF);
      
      // Calculate thickness with gentle variation
      float thick = envelope(x) * (0.04 + amp * 0.06) * 
                   (0.65 + 0.35 * sin(x * 9.0 + motion + layerF));
      
      // Create ribbon with soft edges
      float dist = abs(y - mid);
      float ribbon = smoothstep(thick + 0.01, thick, dist);
      
      // Reduced opacity for calmer look
      finalColor += layerColor * ribbon * 0.22;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
