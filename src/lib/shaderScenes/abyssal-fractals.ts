/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "abyssal-fractals" as const;

export const name = 'Abyssal Fractals';

export const fragmentShader = `
uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
varying vec2 vUv;

// Fractal noise function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= 1.6; // aspect correction

  // Create a swirling warped coordinate field
  float t = time * 0.3;
  float n = noise(uv * 1.5 + vec2(t * 0.5, t));
  uv += 0.3 * vec2(sin(n * 6.2831 + t), cos(n * 6.2831 - t)) * (audioLow + 0.1);

  // Recursive fractal iteration
  float f = 0.0;
  vec2 p = uv;
  for (int i = 0; i < 6; i++) {
    p = abs(p) / dot(p, p) - 0.8; // classic “kaleidoscopic” inversion fractal
    f += exp(-5.0 * abs(length(p) - 0.5));
    p *= 1.3 + 0.2 * audioMid;
  }

  // Deep pulsing glow from the abyss
  float glow = smoothstep(0.1, 0.9, f);
  float pulse = sin(time * 2.0 + audioLow * 8.0) * 0.5 + 0.5;
  vec3 color = vec3(0.0);

  // Base dark palette with subtle tint shifts
  color.r += pow(f, 1.5) * (0.2 + audioLow * 0.8);
  color.g += pow(f, 1.2) * (0.15 + audioMid * 0.5);
  color.b += pow(f, 2.0) * (0.4 + audioHigh * 1.2);

  // Apply glow and pulse
  color *= (0.2 + 0.8 * glow);
  color += pulse * 0.1 * vec3(audioLow, audioMid, audioHigh);

  // Invert slightly for depth
  color = 1.0 - exp(-color * 2.5);

  // Fade edges to black
  float vignette = smoothstep(1.2, 0.4, length(uv));
  color *= vignette * 0.9;

  gl_FragColor = vec4(color, 1.0);
}
`;
