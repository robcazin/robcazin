/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "bass-vortex" as const;

export const name = 'Bass Vortex';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv - 0.5;
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Create spiral effect
    float spiral = 0.0;
    float spiralDensity = 5.0 + audioMid * 3.0;
    spiral = sin(angle * 10.0 + time * 2.0 - radius * spiralDensity);
    
    // Audio-reactive radius modulation
    float pulse = 1.0 + 0.5 * sin(time * 2.0 + audioLow * 5.0);
    float edge = 0.3 + 0.1 * sin(time + audioHigh * 3.0);
    float mask = smoothstep(edge, edge - 0.1, radius * pulse);
    
    // Color based on angle and audio
    vec3 color = vec3(
        0.5 + 0.5 * sin(angle * 2.0 + time + audioLow * 3.0),
        0.5 + 0.5 * sin(angle * 3.0 + time * 1.5 + audioMid * 4.0),
        0.5 + 0.5 * sin(angle * 4.0 + time * 0.7 + audioHigh * 5.0)
    );
    
    // Add center glow
    float center = 1.0 - smoothstep(0.0, 0.3, radius);
    color += center * vec3(1.0, 0.7, 0.3) * (0.5 + 0.5 * audioLow);
    
    // Apply spiral pattern
    color *= 0.5 + 0.5 * spiral * mask;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
