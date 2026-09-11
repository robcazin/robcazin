/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "neon-grid" as const;

export const name = 'Neon Grid';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float gridSize = 10.0 + audioMid * 5.0;
    
    vec2 grid = fract(uv * gridSize);
    vec2 gridId = floor(uv * gridSize);
    
    float dist = min(min(grid.x, 1.0 - grid.x), min(grid.y, 1.0 - grid.y));
    float pulse = 0.05 + 0.1 * audioHigh;
    float line = smoothstep(pulse, 0.0, dist);
    
    vec3 color = vec3(
        0.1 + 0.9 * audioLow,
        0.1 + 0.9 * audioMid,
        0.1 + 0.9 * audioHigh
    );
    
    color = mix(vec3(0.0), color, line);
    
    // Add some glow
    color += 0.3 * vec3(
        audioLow * (0.5 + 0.5 * sin(time * 0.5)),
        audioMid * (0.5 + 0.5 * sin(time * 0.3 + 2.0)),
        audioHigh * (0.5 + 0.5 * sin(time * 0.4 + 4.0))
    );
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
