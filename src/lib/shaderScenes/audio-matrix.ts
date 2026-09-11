/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "audio-matrix" as const;

export const name = 'Matrix Rain';

export const fragmentShader = `
uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
varying vec2 vUv;

// Random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  // Number of columns
  float cols = 60.0;
  
  // Which column are we in?
  float col = floor(uv.x * cols);
  
  // Cell position within column
  float cellY = uv.y * 40.0; // 40 rows
  float cellIndex = floor(cellY);
  
  // Rain parameters per column
  float speed = 0.3 + random(vec2(col, 0.0)) * 0.7;
  speed *= (1.0 + audioMid * 0.5);
  
  float offset = random(vec2(col, 1.0)) * 100.0;
  
  // Position of rain head (0 to 1)
  float headPos = fract((time * speed * 0.15 + offset));
  
  // Convert to screen Y coordinate
  float headY = headPos * 1.3 - 0.15;
  
  // Distance from head
  float dist = headY - uv.y;
  
  // Trail length
  float trailLen = 0.25 + random(vec2(col, 2.0)) * 0.3;
  
  // Initialize color
  vec3 col3 = vec3(0.0);
  
  // Check if we're in the rain trail
  if (dist > 0.0 && dist < trailLen) {
    // Character seed changes over time
    float charSeed = random(vec2(col * 10.0 + cellIndex, floor(time * speed * 8.0)));
    
    // Only draw character 70% of the time
    if (charSeed > 0.3) {
      // Cell UV (0-1 within the cell)
      vec2 cellUv = fract(vec2(uv.x * cols, cellY));
      
      // Simple character block
      float charMask = step(0.1, cellUv.x) * step(cellUv.x, 0.9) * 
                       step(0.1, cellUv.y) * step(cellUv.y, 0.9);
      
      // Add some detail to the character
      float detail = step(0.4, random(vec2(charSeed * 50.0, cellUv.x * 5.0)));
      charMask *= detail;
      
      // Calculate brightness based on distance from head
      float brightness = 0.0;
      
      if (dist < 0.025) {
        // Head character - bright white
        brightness = 1.8 + audioHigh * 1.0;
        col3 = vec3(0.95, 1.0, 0.95) * charMask * brightness;
      } else {
        // Trail - green with exponential falloff
        brightness = exp(-dist * 5.0) * (0.7 + audioLow * 0.5);
        col3 = vec3(0.2, 1.0, 0.35) * charMask * brightness;
      }
      
      // Add glow
      col3 += col3 * 0.5;
    }
  }
  
  // Scanlines
  float scanline = 0.5 + 0.5 * sin(uv.y * 300.0 - time * 5.0);
  col3 *= 0.9 + scanline * 0.1;
  
  // CRT flicker
  col3 *= 0.95 + 0.05 * sin(time * 50.0);
  
  // Vignette
  vec2 vigUv = uv * (1.0 - uv);
  float vignette = vigUv.x * vigUv.y * 15.0;
  vignette = pow(vignette, 0.25);
  col3 *= vignette;
  
  // Background
  col3 += vec3(0.0, 0.03, 0.0);
  
  // Audio flash on high frequencies
  if (audioHigh > 0.65) {
    float flash = (audioHigh - 0.65) * 2.0;
    flash *= step(0.8, random(vec2(time * 30.0, col)));
    col3 += vec3(0.4, 0.8, 0.4) * flash;
  }
  
  gl_FragColor = vec4(col3, 1.0);
}
`;
