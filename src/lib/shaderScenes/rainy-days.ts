/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "rainy-days" as const;

export const name = 'Audio-Reactive Rainy Chill';

export const fragmentShader = `
  precision highp float;

  uniform float time;
  uniform vec2 resolution;
  uniform float audioLow;
  uniform float audioMid;
  uniform float audioHigh;
  varying vec2 vUv;

  // 2D random
  float rand(vec2 p) { return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

  // Smooth noise
  float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = rand(i);
      float b = rand(i + vec2(1.0,0.0));
      float c = rand(i + vec2(0.0,1.0));
      float d = rand(i + vec2(1.0,1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }

  // Fractal Brownian Motion for clouds
  float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      for(int i=0;i<5;i++){
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
      }
      return v;
  }

  // Clouds
  float clouds(vec2 uv){
      float c = fbm(uv*3.0 + time*0.02);
      c = smoothstep(0.2, 0.8 + audioLow*0.5, c); // audioLow modulates cloud density
      return c;
  }

  // Vertical rain streaks
  float rain(vec2 uv){
      float speed = 2.0 + audioHigh*3.0; // audioHigh modulates speed
      float y = fract(uv.y * 50.0 - time * speed);
      float xNoise = rand(floor(uv*50.0));
      float streak = smoothstep(0.0, 0.02, y + xNoise*0.02) - smoothstep(0.02, 0.04, y + xNoise*0.02);
      streak *= 1.0 + audioMid*2.0; // audioMid modulates rain intensity
      return streak;
  }

  void main(){
      vec2 uv = vUv;

      // Clouds
      float cloudLayer = clouds(uv + vec2(time*0.01, 0.0));
      vec3 sky = mix(vec3(0.05,0.05,0.08), vec3(0.2,0.2,0.25), cloudLayer);

      // Rain
      float r = rain(uv);
      vec3 rainColor = vec3(0.6,0.6,0.7) * r;

      // Flicker / indoor vibe
      float flicker = 0.02 * sin(time*2.0 + uv.x*10.0);

      // Combine
      vec3 color = sky + rainColor + flicker;

      // Vignette for cozy effect
      float dist = distance(uv, vec2(0.5));
      color *= smoothstep(0.7, 0.5, dist);

      gl_FragColor = vec4(color, 1.0);
  }
`;
