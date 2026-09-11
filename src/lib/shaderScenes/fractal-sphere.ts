/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "fractal-sphere" as const;

export const name = 'Fractal Sphere';

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
    vec2 uv = vUv - 0.5;
    float scale = 1.5 + audioLow;
    vec2 st = uv * scale;
    
    float n = noise(st + time * 0.3);
    n += noise(st * 2.0 + time * 0.5 + 10.0) * 0.5;
    n += noise(st * 4.0 - time * 0.2 + 20.0) * 0.25;
    
    float fractal = n * (1.0 + audioMid);
    
    vec3 col = vec3(
      fractal * (1.0 + audioLow),
      fractal * 0.5 + audioMid * 0.5,
      1.0 - fractal * 0.3 + audioHigh * 0.3
    );
    
    float dist = length(uv);
    float sphere = 0.5 + sin(time + audioLow * 3.0) * 0.1;
    col *= smoothstep(sphere + 0.1, sphere, dist);
    
    gl_FragColor = vec4(col, 1.0);
  }
`;
