/**
 * Ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * Original: https://github.com/kaganin/iwrzwr-visual-archive
 * 
 * MIT License
 * Copyright (c) 2026 Kagan Yaldizkaya
 * 
 * Muted palette adaptation for robcazin.com
 */

export const id = "contour-memory" as const;

export const name = 'Contour Memory';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  // Soft topographic colors
  const vec3 nearColor = vec3(0.82, 0.84, 0.86);
  const vec3 farColor = vec3(0.45, 0.48, 0.52);
  
  float contourLine(float u, float v, float t, float audioLevel) {
    float taper = pow(sin(3.14159 * u), 1.8);
    float ridge = abs(sin((u * 0.65 - t * 0.18) * 6.28)) * taper;
    
    // Gentler height variation
    float height = 0.15 + audioLevel * 0.25;
    
    return ridge * height;
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Calmer time progression
    float t = time * 0.35;
    
    // Audio reactivity
    float audioLevel = (audioLow * 0.5 + audioMid * 0.3 + audioHigh * 0.2);
    
    vec3 finalColor = vec3(0.0);
    float totalAlpha = 0.0;
    
    // Draw 8 contour layers receding into distance
    for(int layer = 0; layer < 8; layer++) {
      float layerF = float(layer);
      float v = layerF / 7.0;
      
      // Time offset for memory effect
      float layerTime = t - (7.0 - layerF) * 0.15;
      
      // Reduce audio response for older layers
      float layerAudio = audioLevel * (0.3 + v * 0.7);
      
      // Sample contour at this y position
      float u = uv.x;
      float contour = contourLine(u, v, layerTime, layerAudio);
      
      // Perspective effect
      float perspective = 0.60 + v * 0.40;
      float xOffset = (u - 0.5) * perspective;
      float x = 0.5 + xOffset;
      
      // Base line position
      float baseline = 0.15 + v * 0.70;
      float y = baseline - contour;
      
      // Distance from this contour line
      float dist = abs(uv.y - y);
      float line = smoothstep(0.010, 0.003, dist);
      
      // Depth-based color and opacity
      float depth = 0.25 + v * 0.60;
      vec3 layerColor = mix(nearColor, farColor, v);
      
      // Accumulate with soft blending
      finalColor += layerColor * line * depth;
      totalAlpha += line * depth * 0.5;
    }
    
    // Subtle background
    finalColor = mix(vec3(0.0), finalColor, clamp(totalAlpha, 0.0, 1.0));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
