/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: https://github.com/kaganin/iwrzwr-visual-archive
 * 
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 * 
 * Muted palette adaptation for robcazin.com
 */

export const id = "teletext-pulse" as const;

export const name = 'Teletext Pulse';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  // Soft monochrome palette
  const vec3 cellColor = vec3(0.88, 0.89, 0.87);
  const vec3 brightCell = vec3(0.94, 0.95, 0.93);
  
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Grid dimensions
    float cols = 24.0;
    float rows = 8.0;
    
    // Cell coordinates
    vec2 cellId = floor(uv * vec2(cols, rows));
    vec2 cellUv = fract(uv * vec2(cols, rows));
    
    // Horizontal position for wave propagation
    float x = cellId.x / cols;
    
    // Time with calmer tick rate
    float tick = floor(time * 4.0) / 4.0;
    
    // Audio sampling with spatial offset
    float audioSample;
    float columnPhase = x * 0.5;
    
    // Assign frequency bands across width
    if(x < 0.33) {
      audioSample = audioLow;
    } else if(x < 0.66) {
      audioSample = audioMid;
    } else {
      audioSample = audioHigh;
    }
    
    // Calmer audio response
    float level = 0.2 + audioSample * 0.5;
    
    // Center-out wave pattern
    float centerDist = abs(cellId.y - 3.5);
    float extent = level * 4.0;
    
    // Cell is lit if within extent
    bool lit = centerDist < extent;
    
    // Edge cells are brighter
    bool isFrontier = abs(centerDist - extent) < 1.0;
    
    // Cell rectangle with small gaps
    vec2 cellSize = vec2(0.85, 0.75);
    vec2 cellCenter = vec2(0.5);
    vec2 d = abs(cellUv - cellCenter);
    bool inCell = all(lessThan(d, cellSize * 0.5));
    
    vec3 color = vec3(0.0);
    
    if(lit && inCell) {
      if(isFrontier) {
        // Bright edge with subtle pulse
        float pulse = 0.5 + 0.5 * sin(time * 2.0);
        color = mix(brightCell, cellColor, pulse * 0.3);
      } else {
        // Dimmer interior cells
        float fade = 0.45 + level * 0.25;
        color = cellColor * fade;
      }
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
