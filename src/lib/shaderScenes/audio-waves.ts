/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "audio-waves" as const;

export const name = 'Audio Waves';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv - 0.5;
    
    float wave1 = sin(uv.x * 5.0 + time + audioLow * 5.0);
    float wave2 = cos(uv.y * 5.0 + time * 1.5 + audioMid * 3.0);
    float wave3 = sin(length(uv) * 10.0 - time * 0.5 + audioHigh * 4.0);
    
    float waves = wave1 * wave2 * wave3;
    
    vec3 col = vec3(
      abs(wave1) * (0.8 + audioLow * 0.2),
      abs(wave2) * (0.6 + audioMid * 0.4),
      abs(wave3) * (0.9 + audioHigh * 0.1)
    );
    
    col *= (1.0 + waves * 0.5);
    col += audioLow * 0.2;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;
