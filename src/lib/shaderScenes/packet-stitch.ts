/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: https://github.com/kaganin/iwrzwr-visual-archive
 * 
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 * 
 * Muted palette adaptation for robcazin.com
 */

export const id = "packet-stitch" as const;

export const name = 'Packet Stitch';

export const fragmentShader = `
  precision highp float;
  
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  // Muted amber/white palette
  const vec3 baseColor = vec3(0.88, 0.89, 0.87);
  const vec3 accentColor = vec3(0.92, 0.74, 0.52);
  
  float hash(float n) {
    return fract(sin(n * 127.1 + 43.7) * 43758.5453);
  }
  
  float boxDist(vec2 p, vec2 center, vec2 size) {
    vec2 d = abs(p - center) - size;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Horizontal scanline
    float scanline = abs(uv.y - 0.5);
    float horizon = smoothstep(0.003, 0.0, scanline);
    
    // Moving packets with calmer speed
    float speed = time * 0.15;
    float spacing = 0.22;
    
    // Read head position
    float headX = 0.45;
    
    vec3 color = vec3(0.0);
    
    // Horizon line
    color += baseColor * horizon * 0.25;
    
    // Draw packets
    for(int i = -4; i < 8; i++) {
      float iF = float(i);
      float index = iF + floor(speed / spacing);
      float x = mod(iF * spacing - mod(speed, spacing), 1.0);
      
      // Audio-reactive packet size
      float sizeVariant = hash(index + 23.0);
      
      // Assign different frequency bands to different packets
      // Cache mod result to avoid recomputation
      float indexMod3 = mod(index, 3.0);
      float audioInfluence;
      if(indexMod3 < 1.0) {
        audioInfluence = audioLow;
      } else if(indexMod3 < 2.0) {
        audioInfluence = audioMid;
      } else {
        audioInfluence = audioHigh;
      }
      
      float width = 0.04 + (sizeVariant * 0.03 + audioInfluence * 0.03);
      float height = 0.08 + (sizeVariant * 0.05 + audioInfluence * 0.06);
      
      // Box distance
      float boxD = boxDist(uv, vec2(x, 0.5), vec2(width, height));
      float box = smoothstep(0.003, 0.0, boxD);
      float boxEdge = smoothstep(0.003, 0.0, boxD) - smoothstep(0.001, 0.0, boxD - 0.001);
      
      // Active when passing under read head
      float isActive = step(abs(x - headX), width * 1.5);
      vec3 boxColor = mix(baseColor, accentColor, isActive);
      float boxAlpha = mix(0.45, 0.85, isActive);
      
      color += boxColor * box * boxAlpha;
      color += boxColor * boxEdge * 0.3;
      
      // Internal pattern - only draw if inside the box
      float xDist = abs(uv.x - x);
      float yDist = abs(uv.y - 0.5);
      if(xDist < width && yDist < height) {
        float patternDist = mod(abs(uv.x - x) * 40.0, 4.0);
        if(patternDist < 1.0) {
          color += baseColor * 0.15 * (0.3 + hash(index + patternDist) * 0.6);
        }
      }
    }
    
    // Read head indicator
    float headLine = smoothstep(0.002, 0.0, abs(uv.x - headX));
    color += accentColor * headLine * 0.6;
    
    // Read head dot
    float headDot = smoothstep(0.008, 0.004, length(uv - vec2(headX, 0.35)));
    color += accentColor * headDot;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
