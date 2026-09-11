/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "audio-vortex" as const;

export const name = 'Audio Vortex';

export const fragmentShader = `
uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= 1.5; // stretch horizontally for more depth
  
  // Create a swirling vortex motion
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  
  // Vortex distortion over time and sound
  float swirl = sin(angle * 3.0 + time * 2.0 + audioLow * 5.0);
  radius += 0.05 * sin(time * 2.0 + radius * 10.0 + audioMid * 10.0);
  
  // Rotate UVs dynamically
  float rot = angle + swirl * 0.3;
  vec2 warped = vec2(cos(rot), sin(rot)) * radius * (1.0 + audioHigh * 0.3);
  
  // Wave interference pattern
  float pattern = sin(warped.x * 10.0 - time * 3.0 + audioLow * 4.0) *
                  cos(warped.y * 10.0 + time * 2.0 + audioMid * 6.0);
  
  // RGB color separation and pulsing
  vec3 color = vec3(
    0.6 + 0.4 * sin(pattern * 3.0 + time + audioLow * 10.0),
    0.5 + 0.5 * sin(pattern * 4.0 - time * 0.5 + audioMid * 8.0),
    0.4 + 0.6 * sin(pattern * 5.0 + time * 0.3 + audioHigh * 12.0)
  );
  
  // Add glowing pulse at center
  float glow = 0.25 / (radius + 0.05);
  color += glow * (0.5 + audioHigh * 1.5);
  
  // Audio-reactive brightness
  color *= (1.0 + audioLow * 0.5 + audioMid * 0.5 + audioHigh * 0.5);
  
  gl_FragColor = vec4(color, 1.0);
}
`;
