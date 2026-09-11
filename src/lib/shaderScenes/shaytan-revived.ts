/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "shaytan-revived" as const;

export const name = 'Shaytan Revived';

export const fragmentShader = `
uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
varying vec2 vUv;

// hash + noise helpers
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(23.43, 45.17))) * 9181.233);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// rotate function
mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= 1.6;

  float t = time * 0.7;
  float bassWarp = audioLow * 5.0;
  float midWarp = audioMid * 3.0;
  float highWarp = audioHigh * 7.0;

  // Fractal tunnel / infernal swirl
  vec2 p = uv;
  float acc = 0.0;
  float glow = 0.0;

  for (int i = 0; i < 6; i++) {
    p *= rot(t * 0.2 + float(i) * 0.5);
    p += vec2(
      sin(p.y * 2.0 + t + audioMid * 6.0),
      cos(p.x * 2.0 - t + audioHigh * 4.0)
    ) * 0.4;

    float len = length(p);
    acc += exp(-3.0 * abs(len - 0.5 + 0.2 * sin(t + len * 3.0)));
    glow += smoothstep(0.4, 0.0, len) * (0.4 + 0.6 * audioHigh);
  }

  // Noise-driven distortion and chromatic split
  float n = noise(p * 3.0 + vec2(t, -t));
  float pulse = sin(t * 3.0 + audioLow * 10.0 + n * 10.0) * 0.5 + 0.5;

  // Psychedelic lava palette
  vec3 col = vec3(0.0);
  col.r = pow(acc, 2.0) * (1.5 + audioLow * 1.0);
  col.g = pow(acc, 1.2) * (0.6 + audioMid * 1.5);
  col.b = pow(acc, 3.0) * (0.3 + audioHigh * 2.0);

  // Add infernal glow core
  col += glow * vec3(1.2, 0.3 + audioMid * 0.5, 0.0 + audioHigh * 1.0);

  // Chromatic offset (psychedelic halo)
  col.r += 0.2 * sin(n * 12.0 + time * 3.0);
  col.g += 0.2 * cos(n * 14.0 - time * 4.0);
  col.b += 0.3 * sin(n * 10.0 + time * 5.0);

  // Intensify with audio-reactive burn
  col *= (1.0 + 2.0 * pulse * (audioLow + audioMid + audioHigh));

  // Vignette + inversion for demonic depth
  float vignette = smoothstep(1.2, 0.3, length(uv));
  col = mix(vec3(0.02, 0.0, 0.03), col, vignette);

  // Tone-map to fiery chaos and invert white to black
  col = exp(-col * 1.5);

  gl_FragColor = vec4(col, 1.0);
}
`;
