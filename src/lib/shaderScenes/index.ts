/**
 * Audio-reactive GLSL scenes vendored from
 * https://github.com/TjardoOrtan/audio-reactive-shaders (no license file).
 *
 * Includes visualizers ported from iwrzwr-visual-archive by Kagan Yaldizkaya
 * (MIT License, Copyright 2026 Kagan Yaldizkaya)
 * https://github.com/kaganin/iwrzwr-visual-archive
 *
 * Preview in dev: ?viz=<id>
 */

import * as abyssalFractals from "./abyssal-fractals";
import * as audioMatrix from "./audio-matrix";
import * as audioRipples from "./audio-ripples";
import * as audioVortex from "./audio-vortex";
import * as audioWaves from "./audio-waves";
import * as bassVortex from "./bass-vortex";
import * as contourMemory from "./contour-memory";
import * as cosmicStorm from "./cosmic-storm";
import * as fractalSphere from "./fractal-sphere";
import * as gyroidPulse from "./gyroid-pulse";
import * as kaleidoscope from "./kaleidoscope";
import * as neonGrid from "./neon-grid";
import * as packetStitch from "./packet-stitch";
import * as phaseBraid from "./phase-braid";
import * as rainyDays from "./rainy-days";
import * as raveLasers from "./rave-lasers";
import * as sacredGeometry from "./sacred-geometry";
import * as shaytanRevived from "./shaytan-revived";
import * as spectrumRibbon from "./spectrum-ribbon";
import * as teletextPulse from "./teletext-pulse";

export interface ShaderScene {
  id: ShaderSceneId;
  name: string;
  fragmentShader: string;
}

const scenes = [
  kaleidoscope,
  bassVortex,
  cosmicStorm,
  audioMatrix,
  neonGrid,
  fractalSphere,
  audioRipples,
  rainyDays,
  gyroidPulse,
  abyssalFractals,
  sacredGeometry,
  shaytanRevived,
  audioWaves,
  audioVortex,
  raveLasers,
  // iwrzwr-visual-archive ports
  spectrumRibbon,
  phaseBraid,
  contourMemory,
  packetStitch,
  teletextPulse,
] as const;

export type ShaderSceneId = (typeof scenes)[number]["id"];

export const SHADER_SCENES: readonly ShaderScene[] = scenes;

export const SHADER_SCENE_IDS: readonly ShaderSceneId[] = scenes.map((s) => s.id);

const BY_ID = new Map<string, ShaderScene>(
  scenes.map((s) => [s.id, s as ShaderScene])
);

export function isShaderSceneId(value: string): value is ShaderSceneId {
  return BY_ID.has(value);
}

export function getShaderScene(id: ShaderSceneId): ShaderScene {
  return BY_ID.get(id)!;
}

export const DEFAULT_SHADER_SCENE: ShaderSceneId = "kaleidoscope";

export const SHADER_VERTEX = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
