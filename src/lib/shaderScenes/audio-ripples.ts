/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "audio-ripples" as const;

export const name = 'Audio Ripples';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    
    // Create ripples based on audio
    float ripple1 = sin(dist * 30.0 - time * 2.0 + audioLow * 10.0) * 0.5 + 0.5;
    float ripple2 = sin(dist * 20.0 - time * 1.5 + audioMid * 8.0) * 0.5 + 0.5;
    float ripple3 = sin(dist * 15.0 - time * 1.0 + audioHigh * 6.0) * 0.5 + 0.5;
    
    // Combine ripples with different colors
    vec3 color = vec3(0.0);
    color.r = ripple1 * (0.8 + audioLow * 0.5);
    color.g = ripple2 * (0.6 + audioMid * 0.7);
    color.b = ripple3 * (0.7 + audioHigh * 0.6);
    
    // Add pulsing center
    float center = 1.0 - smoothstep(0.0, 0.2 + audioLow * 0.5, dist);
    color += center * vec3(1.0, 0.8, 0.5) * (0.5 + 0.5 * sin(time * 2.0));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
