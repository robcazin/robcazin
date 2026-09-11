/** Vendored GLSL from https://github.com/TjardoOrtan/audio-reactive-shaders (no license file). */
export const id = "sacred-geometry" as const;

export const name = 'Metatron Dream';

export const fragmentShader = `
uniform float time;
uniform float audioLow;
uniform float audioMid;
uniform float audioHigh;
varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Rotation matrix
mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

// Smooth minimum for blending shapes
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Golden ratio
const float PHI = 1.618033988749;

// Distance to regular polygon
float sdPolygon(vec2 p, int n, float r) {
  float a = atan(p.y, p.x) + PI;
  float s = TAU / float(n);
  return cos(floor(0.5 + a / s) * s - a) * length(p) - r;
}

// Flower of Life pattern
float flowerOfLife(vec2 p, float scale) {
  p *= scale;
  float d = 1e10;

  // Center circle
  d = min(d, abs(length(p) - 1.0));

  // Six surrounding circles
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec2 offset = vec2(cos(angle), sin(angle));
    d = min(d, abs(length(p - offset) - 1.0));
  }

  // Outer ring
  for (int i = 0; i < 12; i++) {
    float angle = float(i) * TAU / 12.0;
    vec2 offset = vec2(cos(angle), sin(angle)) * 1.732;
    d = min(d, abs(length(p - offset) - 1.0));
  }

  return d;
}

// Metatron's Cube vertices (3D projection)
float metatronCube(vec2 p, float t) {
  float d = 1e10;

  // 13 spheres of Metatron's Cube
  vec3 centers[13];
  centers[0] = vec3(0.0, 0.0, 0.0);

  // Inner hexagon
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0 + t * 0.5;
    centers[i + 1] = vec3(cos(angle), sin(angle), 0.0) * 0.8;
  }

  // Outer hexagon
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0 + t * 0.3;
    centers[i + 7] = vec3(cos(angle), sin(angle), 0.0) * 1.5;
  }

  // Project and draw spheres
  for (int i = 0; i < 13; i++) {
    vec3 c = centers[i];
    c.xy *= rot(t * 0.4 + float(i) * 0.2);
    c.yz *= rot(t * 0.3);
    vec2 proj = c.xy / (1.0 + c.z * 0.3);
    d = min(d, length(p - proj) - 0.15);
  }

  return d;
}

// Platonic solid edges
float platonicEdges(vec2 p, float t) {
  float d = 1e10;

  // Icosahedron vertices (20 faces, 12 vertices)
  float phi = PHI;
  vec3 verts[12];
  verts[0] = normalize(vec3(0, 1, phi));
  verts[1] = normalize(vec3(0, -1, phi));
  verts[2] = normalize(vec3(0, 1, -phi));
  verts[3] = normalize(vec3(0, -1, -phi));
  verts[4] = normalize(vec3(1, phi, 0));
  verts[5] = normalize(vec3(-1, phi, 0));
  verts[6] = normalize(vec3(1, -phi, 0));
  verts[7] = normalize(vec3(-1, -phi, 0));
  verts[8] = normalize(vec3(phi, 0, 1));
  verts[9] = normalize(vec3(-phi, 0, 1));
  verts[10] = normalize(vec3(phi, 0, -1));
  verts[11] = normalize(vec3(-phi, 0, -1));

  // Rotate in 3D
  for (int i = 0; i < 12; i++) {
    vec3 v = verts[i];
    v.xy *= rot(t * 0.5);
    v.yz *= rot(t * 0.3);
    v.xz *= rot(t * 0.4);

    // Project to 2D
    vec2 proj = v.xy / (1.5 + v.z * 0.5);
    d = min(d, length(p - proj) - 0.08);
  }

  return d;
}

// Sri Yantra inspired triangles
float sriYantra(vec2 p, float t) {
  float d = 1e10;
  p *= rot(t * 0.2);

  // 9 interlocking triangles
  for (int i = 0; i < 9; i++) {
    float angle = float(i) * TAU / 9.0;
    vec2 tp = p;
    tp *= rot(angle);

    float scale = 0.5 + float(i) * 0.15;
    bool inverted = mod(float(i), 2.0) > 0.5;

    if (inverted) {
      tp.y = -tp.y;
    }

    float tri = sdPolygon(tp, 3, scale);
    d = min(d, abs(tri) - 0.02);
  }

  return d;
}

// Vesica Piscis
float vesicaPiscis(vec2 p, float scale) {
  vec2 p1 = p - vec2(scale * 0.5, 0.0);
  vec2 p2 = p + vec2(scale * 0.5, 0.0);

  float c1 = length(p1) - scale;
  float c2 = length(p2) - scale;

  return max(c1, c2);
}

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= 1.6;

  float t = time * 0.5;

  // Audio-reactive scaling
  float pulse = 1.0 + audioLow * 0.3;
  float rotation = t + audioMid * 2.0;

  vec2 p = uv * pulse;
  p *= rot(rotation * 0.3);

  // Layer sacred geometry
  float d1 = flowerOfLife(p, 2.0 + sin(t) * 0.5);
  float d2 = metatronCube(p, t);
  float d3 = platonicEdges(p * 1.5, t);
  float d4 = sriYantra(p * 0.8, t);
  float d5 = abs(vesicaPiscis(p, 0.6)) - 0.02;

  // Combine with smooth min
  float d = d1;
  d = smin(d, d2, 0.1 + audioHigh * 0.2);
  d = smin(d, d3, 0.15);
  d = smin(d, d4, 0.1);
  d = min(d, d5);

  // Create glow
  float glow = exp(-d * 15.0);
  float outline = smoothstep(0.03, 0.0, abs(d));

  // Sacred color palette (gold, cyan, violet)
  vec3 col = vec3(0.0);

  // Golden ratio color cycling
  float hue = fract(t * 0.1 + length(p) * 0.3);
  vec3 color1 = vec3(1.0, 0.8, 0.3); // Gold
  vec3 color2 = vec3(0.3, 0.8, 1.0); // Cyan
  vec3 color3 = vec3(0.8, 0.3, 1.0); // Violet

  vec3 baseCol = mix(color1, color2, sin(hue * TAU) * 0.5 + 0.5);
  baseCol = mix(baseCol, color3, cos(hue * TAU * PHI) * 0.5 + 0.5);

  col += baseCol * glow * (1.0 + audioMid * 2.0);
  col += baseCol * outline * 2.0;

  // Audio-reactive shimmer
  float shimmer = sin(length(p) * 10.0 - t * 3.0 + audioHigh * 10.0) * 0.5 + 0.5;
  col += baseCol * shimmer * audioHigh * 0.5;

  // Mandala rings
  float rings = sin(length(p) * 20.0 - t * 2.0) * 0.5 + 0.5;
  rings *= exp(-abs(length(p) - 0.5) * 3.0);
  col += vec3(1.0, 0.95, 0.8) * rings * 0.3 * (1.0 + audioLow);

  // Center point glow
  float center = exp(-length(p) * 8.0) * (1.0 + audioLow * 2.0);
  col += vec3(1.0) * center * 0.5;

  // Vignette
  float vignette = smoothstep(1.0, 0.3, length(uv));
  col *= vignette;

  // Background
  col += vec3(0.02, 0.03, 0.05) * (1.0 - vignette);

  gl_FragColor = vec4(col, 1.0);
}
`;
