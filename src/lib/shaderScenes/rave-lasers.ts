/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "rave-lasers" as const;

export const name = 'Rave Laser Show';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;

  // Function for radial laser beams
  float laserBeam(vec2 uv, float angle, float width) {
      float a = atan(uv.y, uv.x); // angle of pixel
      float diff = abs(sin((a - angle) * 10.0)); // repeat beams around circle
      return smoothstep(width, 0.0, diff);
  }

  void main() {
      vec2 uv = vUv * 2.0 - 1.0; // center coordinates
      vec3 color = vec3(0.0); // black background

      // Animate multiple laser beams with audio
      float beam1 = laserBeam(uv, time + audioLow * 5.0, 0.02);
      float beam2 = laserBeam(uv, time * -1.3 + audioMid * 3.0, 0.015);
      float beam3 = laserBeam(uv, time * 0.7 + audioHigh * 4.0, 0.01);

      // Combine beams and add glow
      float lasers = beam1 + beam2 + beam3;
      float glow = pow(lasers, 1.5 + audioHigh * 3.0);

      // Green laser color
      color += vec3(0.0, glow, 0.0);

      gl_FragColor = vec4(color, 1.0);
  }
`;
