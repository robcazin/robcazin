/**
 * Visualizer preset library — single source of truth for modes, tuning, and assignments.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MODE CATALOG (preview in dev: ?viz=<mode> on any URL)                  │
 * ├──────────────────┬──────────────────────────────────────────────────────┤
 * │ radial           │ House default — log-spoked dial, rotation, trails    │
 * │ radial-mirror    │ Symmetric radial — calmer, reflected across axis     │
 * │ radial-dense     │ Tighter dial, faster spin — generative / dense       │
 * │ radial-ghost     │ Long afterimage, hairline spokes — ambient           │
 * │ radial-particles │ Radial + additive glow + bass bursts / tip sparks    │
 * │                  │ (large canvas only; opt-in per collection/track)     │
 * │ id4              │ Independence Day — white/blue/red layers + flag wave │
 * │ spectrum         │ Horizontal freq bars + time-domain wave               │
 * │ waveform         │ Time-domain line only — minimal                      │
 * └──────────────────┴──────────────────────────────────────────────────────┘
 *
 * ASSIGNMENT (resolution order)
 *   1. track meta.visualizer
 *   2. COLLECTION_VISUALIZER[slug]
 *   3. DEFAULT_VISUALIZER_MODE
 *
 * TRACK OVERRIDES (all optional partial merges — see visualizer-presets.md)
 *   meta.visualizer       — mode (any mode above)
 *   meta.visualizerColor  — canvas accent hex/css var (overrides collection accent)
 *   meta.radialViz        — partial RadialConfig (radial modes)
 *   meta.particleViz      — partial ParticleConfig (radial-particles only);
 *                           burstColor, accentParticleComposite, burstComposite
 *   meta.punchViz         — partial PunchConfig (transient color flash)
 *   meta.spectrumViz      — partial SpectrumConfig (spectrum mode)
 *   meta.waveformViz      — partial WaveformConfig (waveform mode)
 *
 * Top-level track.accent also works when passed as the accentColor prop.
 *
 * Edit COLLECTION_VISUALIZER and preset constants below to audition styles.
 */

import {
  DEFAULT_SHADER_SCENE,
  SHADER_SCENES,
  isShaderSceneId,
  type ShaderSceneId,
} from "./shaderScenes";

/** Panel / expanded visualizer — shader scene, graph engine, or waveform fallback */
export type VisualizerMode = ShaderSceneId | "waveform" | "graph";

/** Dock 2D canvas engine (kept for the player strip) */
export type CanvasVisualizerMode =
  | "radial"
  | "radial-mirror"
  | "radial-dense"
  | "radial-ghost"
  | "radial-particles"
  | "id4"
  | "spectrum"
  | "waveform";

export interface LayerHsl {
  h: number;
  s: number;
  baseL: number;
  tipL: number;
}

export interface Id4InnerRingConfig {
  innerRatio: number;
  outerRatio: number;
  speed: number;
  bandStep: number;
}

export interface Id4WaveConfig {
  depth: number;
  count: number;
  speed: number;
}

export interface RadialConfig {
  bands: number;
  freqMin: number;
  freqMax: number;
  innerRadiusRatio: number;
  rotationSpeed: number;
  trailFadeSeconds: number;
  mirror: boolean;
  lineWidth: number;
  padding: number;
  /** When min(w,h) > 900, maxRadius inset uses min(w,h) * this instead of padding */
  fullscreenPaddingRatio: number;
  gradient: boolean;
  baseShade: number;
  tipLift: number;
  /** Optional bloom underlayers when using additive compositing */
  bloomLayers?: number;
  /** id4 only — fixed hue per layer (no cycling) */
  layers?: {
    spokes: LayerHsl;
    counterRing: LayerHsl;
    innerRing: LayerHsl;
  };
  innerRing?: Id4InnerRingConfig;
  wave?: Id4WaveConfig;
  /** id4 blue ring counter-rotation multiplier */
  id4CounterRingSpeed?: number;
}

export interface SpectrumConfig {
  bands: number;
  freqMin: number;
  freqMax: number;
  barHeightRatio: number;
  waveHeightRatio: number;
  trailFadeSeconds: number;
  lineWidth: number;
}

export interface WaveformConfig {
  trailFadeSeconds: number;
  lineWidth: number;
  waveHeightRatio: number;
}

/** Canvas composite modes allowed for particle layers (see visualizer-presets.md) */
export const PARTICLE_COMPOSITE_MODES = [
  "source-over",
  "screen",
  "lighter",
  "add",
  "overlay",
  "soft-light",
  "hard-light",
  "color-dodge",
] as const;

export type ParticleCompositeMode = (typeof PARTICLE_COMPOSITE_MODES)[number];

export function parseParticleComposite(
  value: unknown,
  fallback: ParticleCompositeMode
): ParticleCompositeMode {
  if (
    typeof value === "string" &&
    (PARTICLE_COMPOSITE_MODES as readonly string[]).includes(value)
  ) {
    return value as ParticleCompositeMode;
  }
  return fallback;
}

export interface ParticleConfig {
  enabled: boolean;
  minHeightPx: number;
  maxParticles: number;
  bassMaxHz: number;
  burstThreshold: number;
  burstCount: number;
  burstSpeed: number;
  /** Hex or CSS var for bass bursts; accent when unset */
  burstColor?: string;
  /** Composite for sparks + ambient drift */
  accentParticleComposite: ParticleCompositeMode;
  /** Composite for bass bursts */
  burstComposite: ParticleCompositeMode;
  sparkThreshold: number;
  sparkFloor: number;
  maxSparksPerFrame: number;
  sparkSpeed: number;
  drag: number;
  life: number;
  jitter: number;
  streak: boolean;
  particleWidth: number;
  /** px/s² — gentle push away from center while particles live */
  outwardAccel: number;
  /** Continuous outward drift from core, scaled by bass energy */
  ambientDriftRate: number;
  ambientDriftSpeed: number;
  ambientDriftFloor: number;
  /** Second counter-rotating spoke ring (Unfolding, etc.) */
  counterRing: boolean;
  counterRingSpeed: number;
  counterRingInnerRatio: number;
  counterRingOuterRatio: number;
}

export const RADIAL_PRESETS: Record<
  "radial" | "radial-mirror" | "radial-dense" | "radial-ghost" | "id4",
  RadialConfig
> = {
  radial: {
    bands: 112,
    freqMin: 30,
    freqMax: 16000,
    innerRadiusRatio: 0.18,
    rotationSpeed: 0.03,
    trailFadeSeconds: 3,
    mirror: false,
    lineWidth: 0.9,
    padding: 4,
    fullscreenPaddingRatio: 0.04,
    gradient: true,
    baseShade: 0.3,
    tipLift: 0.35,
  },
  "radial-mirror": {
    bands: 80,
    freqMin: 40,
    freqMax: 14000,
    innerRadiusRatio: 0.22,
    rotationSpeed: 0.018,
    trailFadeSeconds: 3,
    mirror: true,
    lineWidth: 0.8,
    padding: 4,
    fullscreenPaddingRatio: 0.04,
    gradient: true,
    baseShade: 0.55,
    tipLift: 0.35,
  },
  "radial-dense": {
    bands: 128,
    freqMin: 25,
    freqMax: 18000,
    innerRadiusRatio: 0.14,
    rotationSpeed: 0.045,
    trailFadeSeconds: 3,
    mirror: false,
    lineWidth: 0.7,
    padding: 3,
    fullscreenPaddingRatio: 0.04,
    bloomLayers: 3,
    gradient: true,
    baseShade: 0.55,
    tipLift: 0.35,
  },
  "radial-ghost": {
    bands: 72,
    freqMin: 35,
    freqMax: 12000,
    innerRadiusRatio: 0.24,
    rotationSpeed: 0.012,
    trailFadeSeconds: 3,
    mirror: false,
    lineWidth: 0.65,
    padding: 5,
    fullscreenPaddingRatio: 0.04,
    gradient: true,
    baseShade: 0.55,
    tipLift: 0.35,
  },
  id4: {
    bands: 128,
    freqMin: 25,
    freqMax: 18000,
    innerRadiusRatio: 0.14,
    rotationSpeed: 0.045,
    trailFadeSeconds: 3,
    mirror: false,
    lineWidth: 0.7,
    padding: 3,
    fullscreenPaddingRatio: 0.04,
    bloomLayers: 3,
    gradient: true,
    baseShade: 0.55,
    tipLift: 0.35,
    layers: {
      spokes:      { h: 0,   s: 0,  baseL: 20, tipL: 96 },
      counterRing: { h: 220, s: 85, baseL: 30, tipL: 75 },   // was 65/18/60 — much hotter
      innerRing:   { h: 355, s: 85, baseL: 28, tipL: 70 },   // same treatment
    },
    innerRing: { innerRatio: 0.05, outerRatio: 0.30, speed: 0.6, bandStep: 1 },  // denser, reaches further
    wave: { depth: 0.22, count: 3, speed: 0.45 },
    id4CounterRingSpeed: 0.72,
  },
};

/** Spoke geometry used when mode is radial-particles */
export const RADIAL_PARTICLES_BASE: keyof typeof RADIAL_PRESETS = "radial-dense";

export const PARTICLE_CONFIG: ParticleConfig = {
  enabled: true,
  minHeightPx: 160,
  maxParticles: 240,
  bassMaxHz: 120,
  burstThreshold: 0.55,
  burstCount: 18,
  burstSpeed: 120,
  accentParticleComposite: "screen",
  burstComposite: "add",
  sparkThreshold: 0.18,
  sparkFloor: 0.3,
  maxSparksPerFrame: 8,
  sparkSpeed: 70,
  drag: 0.96,
  life: 1.5,
  jitter: 0.25,
  streak: true,
  particleWidth: 1.5,
  outwardAccel: 48,
  ambientDriftRate: 3,
  ambientDriftSpeed: 28,
  ambientDriftFloor: 0.12,
  counterRing: false,
  counterRingSpeed: 0.72,
  counterRingInnerRatio: 0.52,
  counterRingOuterRatio: 0.78,
};

export const SPECTRUM_PRESET: SpectrumConfig = {
  bands: 56,
  freqMin: 30,
  freqMax: 16000,
  barHeightRatio: 0.45,
  waveHeightRatio: 0.42,
  trailFadeSeconds: 3,
  lineWidth: 1.5,
};

export const WAVEFORM_PRESET: WaveformConfig = {
  trailFadeSeconds: 3,
  lineWidth: 1.5,
  waveHeightRatio: 0.44,
};

export const DEFAULT_VISUALIZER_MODE: VisualizerMode = DEFAULT_SHADER_SCENE;

/** Per-collection shader assignments */
export const COLLECTION_VISUALIZER: Partial<Record<string, VisualizerMode>> = {
  science: "sacred-geometry",
  journeys: "kaleidoscope",
  "film-music": "bass-vortex",
  vaurals: "audio-matrix",
  "guitar-improv": "audio-waves",
  fragments: "audio-waves",
  anomalies: "audio-waves",
  "film-theatre": "rainy-days",
};

const MODE_LABELS: Record<VisualizerMode, string> = {
  waveform: "Waveform",
  graph: "Graph (curvature flow)",
  ...Object.fromEntries(SHADER_SCENES.map((s) => [s.id, s.name])),
} as Record<VisualizerMode, string>;

/** Human-readable catalog for UI / docs */
export const VISUALIZER_LIBRARY = Object.entries(MODE_LABELS).map(
  ([id, label]) => ({
    id: id as VisualizerMode,
    label,
    collection: Object.entries(COLLECTION_VISUALIZER).find(
      ([, mode]) => mode === id
    )?.[0],
  })
);

export function visualizerModeLabel(mode: VisualizerMode): string {
  return MODE_LABELS[mode];
}

export function isVisualizerMode(value: string): value is VisualizerMode {
  return value === "waveform" || value === "graph" || isShaderSceneId(value);
}

export function isRadialMode(
  mode: CanvasVisualizerMode
): mode is CanvasVisualizerMode & (
  | "radial"
  | "radial-mirror"
  | "radial-dense"
  | "radial-ghost"
  | "radial-particles"
  | "id4"
) {
  return (
    mode === "radial-particles" ||
    mode === "id4" ||
    mode === "radial" ||
    mode === "radial-mirror" ||
    mode === "radial-dense" ||
    mode === "radial-ghost"
  );
}

export function isId4Mode(mode: CanvasVisualizerMode): mode is "id4" {
  return mode === "id4";
}

export function isId4Config(cfg: RadialConfig): boolean {
  return Boolean(cfg.layers && cfg.innerRing && cfg.wave);
}

/** Which radial spoke preset backs a given mode */
export function resolveRadialPresetKey(
  mode: CanvasVisualizerMode
): keyof typeof RADIAL_PRESETS {
  if (mode === "radial-particles") return RADIAL_PARTICLES_BASE;
  if (mode === "id4") return "id4";
  if (mode in RADIAL_PRESETS) return mode as keyof typeof RADIAL_PRESETS;
  return "radial";
}

/** Resolve mode: track meta → collection map → default */
export function getVisualizerMode(
  collectionSlug?: string,
  trackMeta?: Record<string, unknown>
): VisualizerMode {
  const fromTrack = trackMeta?.visualizer;
  if (typeof fromTrack === "string" && isVisualizerMode(fromTrack)) {
    return fromTrack;
  }
  if (collectionSlug && COLLECTION_VISUALIZER[collectionSlug]) {
    return COLLECTION_VISUALIZER[collectionSlug]!;
  }
  return DEFAULT_VISUALIZER_MODE;
}

/** Log-spaced magnitude bins shared by radial + spectrum modes */
export function logBin(
  freqData: Uint8Array,
  bands: number,
  freqMin: number,
  freqMax: number,
  sampleRate: number,
  fftSize: number
): Float32Array {
  const result = new Float32Array(bands);
  const hzPerBin = sampleRate / fftSize;

  for (let j = 0; j < bands; j++) {
    const fLow = freqMin * Math.pow(freqMax / freqMin, j / bands);
    const fHigh = freqMin * Math.pow(freqMax / freqMin, (j + 1) / bands);
    const binStart = Math.max(0, Math.floor(fLow / hzPerBin));
    const binEnd = Math.min(freqData.length - 1, Math.ceil(fHigh / hzPerBin));
    let sum = 0;
    let count = 0;
    for (let k = binStart; k <= binEnd; k++) {
      sum += freqData[k];
      count++;
    }
    result[j] = count > 0 ? sum / count : 0;
  }
  return result;
}

export const BG_RGB = "10, 11, 13";
export const REDUCED_MOTION_INTERVAL_MS = 500;

export interface PunchConfig {
  enabled: boolean;
  attack: number;
  release: number;
  threshold: number;
  sensitivity: number;
  punchRelease: number;
  satBoost: number;
  lightBoost: number;
}

export const PUNCH_CONFIG: PunchConfig = {
  enabled: true,
  attack: 0.6,
  release: 0.08,
  threshold: 0.06,
  sensitivity: 3.0,
  punchRelease: 0.28,
  satBoost: 0.35,
  lightBoost: 0.18,
};

function mergeMeta<T extends object>(
  base: T,
  raw: unknown
): T {
  if (!raw || typeof raw !== "object") return base;
  return { ...base, ...(raw as Partial<T>) };
}

/** Canvas accent: meta.visualizerColor → trackAccent prop → accentColor prop */
export function resolveVisualizerAccent(
  accentColor: string,
  trackMeta?: Record<string, unknown>,
  trackAccent?: string
): string {
  const fromMeta = trackMeta?.visualizerColor;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  if (typeof trackAccent === "string" && trackAccent.length > 0) {
    return trackAccent;
  }
  return accentColor;
}

export function resolveRadialConfig(
  mode: CanvasVisualizerMode,
  trackMeta?: Record<string, unknown>
): RadialConfig {
  return mergeMeta(
    RADIAL_PRESETS[resolveRadialPresetKey(mode)],
    trackMeta?.radialViz
  );
}

export function resolvePunchConfig(
  trackMeta?: Record<string, unknown>
): PunchConfig {
  return mergeMeta(PUNCH_CONFIG, trackMeta?.punchViz);
}

export function resolveSpectrumConfig(
  trackMeta?: Record<string, unknown>
): SpectrumConfig {
  return mergeMeta(SPECTRUM_PRESET, trackMeta?.spectrumViz);
}

export function resolveWaveformConfig(
  trackMeta?: Record<string, unknown>
): WaveformConfig {
  return mergeMeta(WAVEFORM_PRESET, trackMeta?.waveformViz);
}
