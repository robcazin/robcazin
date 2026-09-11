/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "kaleidoscope" as const;

export const name = 'Kaleidoscope';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    vec2 centered = vUv - 0.5;
    float angle = atan(centered.y, centered.x);
    float radius = length(centered);
    
    float segments = 6.0 + floor(audioLow * 6.0);
    angle = mod(angle, 3.14159 * 2.0 / segments);
    angle = abs(angle - 3.14159 / segments);
    
    vec2 kaleidoUv = vec2(cos(angle), sin(angle)) * radius;
    kaleidoUv += time * 0.2;
    
    float n = noise(kaleidoUv * 3.0 + time * 0.2);
    n += noise(kaleidoUv * 6.0 - time * 0.3 + 10.0) * 0.5;
    n *= (1.0 + audioMid * 0.5);
    
    vec3 col = vec3(
      n * (0.8 + audioHigh * 0.2),
      sin(n * 3.14 + audioMid * 2.0) * 0.5 + 0.5,
      cos(n * 3.14 + audioLow * 2.0) * 0.5 + 0.5
    );
    
    col *= 1.0 + sin(radius * 10.0 + time) * 0.3;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;
