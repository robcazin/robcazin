/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "gyroid-pulse" as const;

export const name = 'Gyroid Pulse';

export const fragmentShader = `
  uniform float time;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv - 0.5;
    float scale = 2.0 + audioLow * 2.0;
    vec3 p = vec3(uv * scale, 0.0);
    
    float speed = time * 0.5;
    float gyroid = sin(p.x + speed) * cos(p.y) + 
                  sin(p.y + speed) * cos(p.x * 0.5) + 
                  sin(time) * 0.3;
    
    gyroid += audioMid * 0.5;
    
    vec3 col = vec3(
      sin(gyroid + audioLow * 2.0) * 0.5 + 0.5,
      cos(gyroid + audioMid * 2.0) * 0.5 + 0.5,
      sin(gyroid + audioHigh * 2.0 + 1.57) * 0.5 + 0.5
    );
    
    float dist = length(uv);
    float pulse = 0.3 + audioHigh * 0.2;
    col *= smoothstep(pulse + 0.5, pulse, dist);
    
    gl_FragColor = vec4(col, 1.0);
  }
`;
