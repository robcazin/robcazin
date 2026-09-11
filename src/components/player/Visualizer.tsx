"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { resolveAccentHex } from "@/lib/utils";
import {
  DEFAULT_SHADER_SCENE,
  isShaderSceneId,
  type ShaderSceneId,
} from "@/lib/shaderScenes";
import {
  REDUCED_MOTION_INTERVAL_MS,
  getVisualizerMode,
  isId4Config,
  isId4Mode,
  isVisualizerMode,
  logBin,
  resolvePunchConfig,
  resolveRadialConfig,
  resolveSpectrumConfig,
  resolveVisualizerAccent,
  resolveWaveformConfig,
  type CanvasVisualizerMode,
  type LayerHsl,
  type PunchConfig,
  type RadialConfig,
  type VisualizerMode,
} from "@/lib/visualizerPresets";
import {
  ParticlePool,
  avgBandsBelow,
  isParticleLayerActive,
  resolveParticleConfig,
  type ParticleDrawPalette,
  type RadialGeometry,
} from "@/lib/visualizerParticles";

interface VisualizerProps {
  accentColor?: string;
  /** Per-track accent from track.accent — overridden by meta.visualizerColor */
  trackAccent?: string;
  className?: string;
  /** Height in pixels, or "fill" to match the parent container */
  height?: number | "fill";
  /** Collection slug for preset lookup */
  collectionSlug?: string;
  /** Track meta — mode, color, and per-preset overrides */
  trackMeta?: Record<string, unknown>;
  /** Dock stays 2D waveform; panel/expanded use shaders */
  surface?: "dock" | "panel";
}

function bandAngle(i: number, total: number): number {
  return (i / total) * Math.PI * 2 - Math.PI / 2;
}

function effectiveLineWidth(
  cfg: RadialConfig,
  w: number,
  h: number
): number {
  return cfg.lineWidth * Math.max(1, Math.min(w, h) / 420);
}

function radialGeometry(
  w: number,
  h: number,
  cfg: RadialConfig
): RadialGeometry {
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  const padding =
    minDim > 900
      ? minDim * cfg.fullscreenPaddingRatio
      : cfg.padding;
  const maxRadius = minDim / 2 - padding;
  return {
    cx,
    cy,
    innerRadius: maxRadius * cfg.innerRadiusRatio,
    maxRadius,
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = ((max + min) / 2) * 100;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = (l > 50 ? d / (2 - max - min) : d / (max + min)) * 100;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  return [
    Math.round((rn + m) * 255),
    Math.round((gn + m) * 255),
    Math.round((bn + m) * 255),
  ];
}

function timeDataRms(timeData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / timeData.length);
}

function fillOpaqueBlack(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, w, h);
}

function makeSpokeGradient(
  ctx: CanvasRenderingContext2D,
  innerRadius: number,
  maxRadius: number,
  cfg: RadialConfig,
  h: number,
  s: number,
  l: number,
  punch: number,
  punchCfg: PunchConfig,
  layerColor?: LayerHsl
): CanvasGradient {
  const grad = ctx.createRadialGradient(
    0,
    0,
    innerRadius,
    0,
    0,
    maxRadius
  );
  const hue = layerColor?.h ?? h;
  const sat = layerColor?.s ?? s;
  const baseS = sat * 0.85;
  const baseL = layerColor?.baseL ?? l * cfg.baseShade;
  const tipS = Math.min(
    100,
    sat + (punchCfg.enabled ? punch * punchCfg.satBoost * 100 : 0)
  );
  const tipL = Math.min(
    85,
    layerColor
      ? layerColor.tipL +
          (punchCfg.enabled ? punch * punchCfg.lightBoost * 100 : 0)
      : l +
          cfg.tipLift * (100 - l) +
          (punchCfg.enabled ? punch * punchCfg.lightBoost * 100 : 0)
  );
  grad.addColorStop(0, `hsl(${hue}, ${baseS}%, ${baseL}%)`);
  grad.addColorStop(0.4, `hsl(${hue}, ${baseS}%, ${baseL}%)`);  // hold dark to 40% of the spoke
  grad.addColorStop(1, `hsl(${hue}, ${tipS}%, ${tipL}%)`);
  return grad;
}

function VisualizerCanvas({
  accentColor = "var(--accent)",
  trackAccent,
  className = "",
  height = 64,
  collectionSlug,
  trackMeta,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const waveTRef = useRef(0);
  const lastTsRef = useRef<number>(0);
  const lastReducedRef = useRef<number>(0);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const particlePoolRef = useRef<ParticlePool | null>(null);
  const envRef = useRef(0);
  const punchRef = useRef(0);
  const accentHslRef = useRef<[number, number, number]>([0, 0, 50]);
  const punchedRgbRef = useRef<[number, number, number]>([0, 0, 0]);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const { analyserNode, audioContext, status } = usePlayer();

  const mode = "waveform" as CanvasVisualizerMode;

  const particleCfg = useMemo(
    () => resolveParticleConfig(trackMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable on meta content, not object identity
    [JSON.stringify(trackMeta?.particleViz ?? null), trackMeta?.visualizer]
  );
  const particleCfgRef = useRef(particleCfg);
  particleCfgRef.current = particleCfg;

  const burstRgbStatic = useMemo((): [number, number, number] | null => {
    if (!particleCfg.burstColor) return null;
    const hex = resolveAccentHex(particleCfg.burstColor);
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }, [particleCfg.burstColor]);
  const burstRgbStaticRef = useRef(burstRgbStatic);
  burstRgbStaticRef.current = burstRgbStatic;

  const radialCfg = useMemo(
    () => resolveRadialConfig(mode, trackMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, JSON.stringify(trackMeta?.radialViz ?? null)]
  );
  const radialCfgRef = useRef(radialCfg);
  radialCfgRef.current = radialCfg;

  const punchCfg = useMemo(
    () => resolvePunchConfig(trackMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(trackMeta?.punchViz ?? null)]
  );
  const punchCfgRef = useRef(punchCfg);
  punchCfgRef.current = punchCfg;

  const spectrumCfg = useMemo(
    () => resolveSpectrumConfig(trackMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(trackMeta?.spectrumViz ?? null)]
  );
  const spectrumCfgRef = useRef(spectrumCfg);
  spectrumCfgRef.current = spectrumCfg;

  const waveformCfg = useMemo(
    () => resolveWaveformConfig(trackMeta),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(trackMeta?.waveformViz ?? null)]
  );
  const waveformCfgRef = useRef(waveformCfg);
  waveformCfgRef.current = waveformCfg;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forceFull = document.documentElement.dataset.motion === "full";
    const apply = () => setPrefersReduced(!forceFull && mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const effectiveAccent = useMemo(
    () => resolveVisualizerAccent(accentColor, trackMeta, trackAccent),
    [accentColor, trackAccent, trackMeta?.visualizerColor]
  );
  const accentHex = resolveAccentHex(effectiveAccent);
  const r = parseInt(accentHex.slice(1, 3), 16);
  const g = parseInt(accentHex.slice(3, 5), 16);
  const b = parseInt(accentHex.slice(5, 7), 16);
  const accentRgb = useMemo(
    () => [r, g, b] as [number, number, number],
    [r, g, b]
  );
  const accentRgbRef = useRef(accentRgb);
  accentRgbRef.current = accentRgb;
  accentHslRef.current = rgbToHsl(r, g, b);
  punchedRgbRef.current = [r, g, b];

  const accentAlpha = useCallback((mag: number, min = 0.25, max = 0.95) => {
    const alpha = min + (max - min) * mag;
    const punchCfg = punchCfgRef.current;
    const punch = punchCfg.enabled ? punchRef.current : 0;
    const [h, s, l] = accentHslRef.current;
    const sOut = Math.min(100, s + punch * punchCfg.satBoost * 100);
    const lOut = Math.min(85, l + punch * punchCfg.lightBoost * 100);
    return `hsla(${h}, ${sOut}%, ${lOut}%, ${alpha})`;
  }, []);

  const updatePunch = useCallback(
    (timeData: Uint8Array, dt: number, reduced: boolean) => {
      const punchCfg = punchCfgRef.current;
      if (!punchCfg.enabled || reduced) {
        punchRef.current = 0;
        return;
      }
      const step = dt > 0 ? dt : 1 / 60;
      const rms = timeDataRms(timeData);
      const env = envRef.current;
      const rawCoef =
        (rms > env ? punchCfg.attack : punchCfg.release) * step * 60;
      const coef = Math.min(1, rawCoef);
      envRef.current = env + (rms - env) * coef;
      const transient = Math.min(
        1,
        Math.max(
          0,
          (rms - envRef.current - punchCfg.threshold) * punchCfg.sensitivity
        )
      );
      let punch = Math.max(transient, punchRef.current);
      if (dt > 0) {
        punch = Math.max(
          transient,
          punchRef.current * Math.pow(0.1, dt / punchCfg.punchRelease)
        );
      }
      punchRef.current = punch;
      const [h, s, l] = accentHslRef.current;
      const sOut = Math.min(100, s + punch * punchCfg.satBoost * 100);
      const lOut = Math.min(85, l + punch * punchCfg.lightBoost * 100);
      punchedRgbRef.current = hslToRgb(h, sOut, lOut);
    },
    []
  );

  const trailFill = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      dt: number,
      fadeSeconds: number
    ) => {
      if (fadeSeconds <= 0) {
        fillOpaqueBlack(ctx, w, h);
        return;
      }
      const step = dt > 0 ? dt : 1 / 60;
      const a = 1 - Math.pow(0.01, step / fadeSeconds);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "difference";
      ctx.fillStyle = "rgb(1, 1, 1)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    },
    []
  );

  const strokeSpokes = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      bands: Float32Array,
      geom: RadialGeometry,
      cfg: RadialConfig,
      bloomAlphaScale = 1,
      ring?: {
        innerRadius: number;
        maxRadius: number;
        bandStep?: number;
      },
      opts?: {
        layerColor?: LayerHsl;
        wave?: RadialConfig["wave"];
        waveT?: number;
      }
    ) => {
      const innerRadius = ring?.innerRadius ?? geom.innerRadius;
      const maxRadius = ring?.maxRadius ?? geom.maxRadius;
      const step = ring?.bandStep ?? 1;
      const minA = 0.25;
      const maxA = 0.95;

      if (cfg.gradient) {
        const punchCfg = punchCfgRef.current;
        const punch = punchCfg.enabled ? punchRef.current : 0;
        const [h, s, l] = accentHslRef.current;
        ctx.strokeStyle = makeSpokeGradient(
          ctx,
          innerRadius,
          maxRadius,
          cfg,
          h,
          s,
          l,
          punch,
          punchCfg,
          opts?.layerColor
        );
      }

      const drawBand = (i: number, angle: number) => {
        const mag = bands[i] / 255;
        const span = maxRadius - innerRadius;
        const r0 = innerRadius;
        let r1 = innerRadius + mag * span;
        if (opts?.wave && opts.waveT !== undefined) {
          const wobble =
            1 +
            opts.wave.depth *
              Math.sin(angle * opts.wave.count + opts.waveT);
          r1 = innerRadius + mag * span * wobble;
          r1 = Math.min(maxRadius * 1.05, r1);
        }
        if (cfg.gradient) {
          ctx.globalAlpha =
            minA + (maxA - minA) * mag * bloomAlphaScale;
        } else {
          ctx.strokeStyle = accentAlpha(mag * bloomAlphaScale);
        }
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r0, Math.sin(angle) * r0);
        ctx.lineTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        ctx.stroke();
      };

      const count = bands.length;
      if (cfg.mirror) {
        const half = Math.floor(count / 2);
        for (let i = 0; i < half; i += step) {
          const angle = bandAngle(i, count);
          drawBand(i, angle);
          drawBand(i, Math.PI - angle);
        }
      } else {
        for (let i = 0; i < count; i += step) drawBand(i, bandAngle(i, count));
      }

      if (cfg.gradient) ctx.globalAlpha = 1;
    },
    [accentAlpha]
  );

  const drawId4Radial = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      bands: Float32Array,
      rotation: number,
      cfg: RadialConfig,
      trails: boolean,
      dt: number,
      waveT: number
    ) => {
      const geom = radialGeometry(w, h, cfg);
      const lineW = effectiveLineWidth(cfg, w, h);
      const layers = cfg.layers!;
      const innerRingCfg = cfg.innerRing!;
      const wave = cfg.wave!;
      const span = geom.maxRadius - geom.innerRadius;
      const waveOpts = { wave, waveT };

      trailFill(ctx, w, h, dt, trails ? cfg.trailFadeSeconds : 0);

      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";

      // Red inner ring — co-rotates with main dial
      ctx.save();
      ctx.translate(geom.cx, geom.cy);
      ctx.rotate(rotation * innerRingCfg.speed);
      ctx.lineWidth = lineW * 0.75;
      strokeSpokes(
        ctx,
        bands,
        geom,
        cfg,
        0.55,
        {
          innerRadius: geom.innerRadius + span * innerRingCfg.innerRatio,
          maxRadius: geom.innerRadius + span * innerRingCfg.outerRatio,
          bandStep: innerRingCfg.bandStep,
        },
        { layerColor: layers.innerRing, ...waveOpts }
      );
      ctx.restore();

      // Blue counter-ring
      ctx.save();
      ctx.translate(geom.cx, geom.cy);
      ctx.rotate(-rotation * (cfg.id4CounterRingSpeed ?? 0.72));
      ctx.lineWidth = lineW * 0.85;
      strokeSpokes(
        ctx,
        bands,
        geom,
        cfg,
        0.45,
        {
          innerRadius: geom.innerRadius + span * 0.52,
          maxRadius: geom.innerRadius + span * 0.78,
          bandStep: 2,
        },
        { layerColor: layers.counterRing, ...waveOpts }
      );
      ctx.restore();

      // White main spokes + bloom
      ctx.save();
      ctx.translate(geom.cx, geom.cy);
      ctx.rotate(rotation);
      const bloomLayers = cfg.bloomLayers ?? 3;
      for (let layer = bloomLayers - 1; layer >= 0; layer--) {
        const t = layer / Math.max(1, bloomLayers - 1);
        ctx.lineWidth = lineW * (1 + (1 - t) * 2);
        strokeSpokes(ctx, bands, geom, cfg, 0.15 + 0.85 * (1 - t), undefined, {
          layerColor: layers.spokes,
          ...waveOpts,
        });
      }
      ctx.restore();

      ctx.globalCompositeOperation = "source-over";
    },
    [strokeSpokes, trailFill]
  );

  const drawRadial = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      bands: Float32Array,
      rotation: number,
      cfg: RadialConfig,
      trails: boolean,
      options?: {
        particles?: boolean;
        dt?: number;
        pool?: ParticlePool | null;
      }
    ) => {
      const geom = radialGeometry(w, h, cfg);
      const lineW = effectiveLineWidth(cfg, w, h);
      const pool = options?.pool;
      const glow = Boolean(options?.particles && pool);
      const dt = options?.dt ?? 0;

      trailFill(
        ctx,
        w,
        h,
        dt,
        trails ? cfg.trailFadeSeconds : 0
      );

      if (isId4Config(cfg)) {
        drawId4Radial(ctx, w, h, bands, rotation, cfg, trails, dt, waveTRef.current);
        return;
      }

      if (glow && pool) {
        const pCfg = particleCfgRef.current;
        if (dt > 0) {
          const bassEnergy = avgBandsBelow(
            bands,
            pCfg.bassMaxHz,
            cfg.freqMin,
            cfg.freqMax
          );
          pool.spawnAmbientDrift(geom, bassEnergy, dt, pCfg);
          pool.spawnBassBurst(
            geom,
            bassEnergy,
            pool.prevBassEnergy,
            pCfg
          );
          pool.prevBassEnergy = bassEnergy;
          pool.spawnTipSparks(bands, geom, rotation, pCfg);
        }

        ctx.globalCompositeOperation = "add" as GlobalCompositeOperation;
        ctx.lineCap = "round";

        if (pCfg.counterRing) {
          const span = geom.maxRadius - geom.innerRadius;
          const ringInner =
            geom.innerRadius + span * pCfg.counterRingInnerRatio;
          const ringMax =
            geom.innerRadius + span * pCfg.counterRingOuterRatio;
          ctx.save();
          ctx.translate(geom.cx, geom.cy);
          ctx.rotate(-rotation * pCfg.counterRingSpeed);
          ctx.lineWidth = lineW * 0.85;
          strokeSpokes(ctx, bands, geom, cfg, 0.45, {
            innerRadius: ringInner,
            maxRadius: ringMax,
            bandStep: 2,
          });
          ctx.restore();
        }

        ctx.save();
        ctx.translate(geom.cx, geom.cy);
        ctx.rotate(rotation);

        const bloomLayers = cfg.bloomLayers ?? 3;
        for (let layer = bloomLayers - 1; layer >= 0; layer--) {
          const t = layer / Math.max(1, bloomLayers - 1);
          ctx.lineWidth = lineW * (1 + (1 - t) * 2);
          strokeSpokes(ctx, bands, geom, cfg, .15 + 0.85 * (1 - t));
        }

        ctx.restore();
        if (dt > 0) {
          const id4Layers = cfg.layers;
          const whiteRgb = id4Layers
            ? hslToRgb(
                id4Layers.spokes.h,
                id4Layers.spokes.s,
                id4Layers.spokes.baseL
              )
            : punchedRgbRef.current;
          const palette: ParticleDrawPalette = {
            accentRgb: id4Layers ? whiteRgb : punchedRgbRef.current,
            burstRgb:
              burstRgbStaticRef.current ?? punchedRgbRef.current,
            accentComposite: pCfg.accentParticleComposite,
            burstComposite: pCfg.burstComposite,
          };
          pool.updateAndDraw(ctx, dt, w, h, geom, palette, pCfg);
        }
        ctx.globalCompositeOperation = "source-over";
        return;
      }

      ctx.save();
      ctx.translate(geom.cx, geom.cy);
      ctx.rotate(rotation);
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      strokeSpokes(ctx, bands, geom, cfg);
      ctx.restore();
    },
    [drawId4Radial, strokeSpokes, trailFill]
  );

  const drawSpectrum = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      analyser: AnalyserNode,
      bands: Float32Array,
      trails: boolean,
      dt: number,
      timeData: Uint8Array
    ) => {
      const cfg = spectrumCfgRef.current;
      trailFill(
        ctx,
        w,
        h,
        dt,
        trails ? cfg.trailFadeSeconds : 0
      );

      const barW = w / bands.length;
      for (let i = 0; i < bands.length; i++) {
        const mag = bands[i] / 255;
        const barH = Math.max(1, mag * h * cfg.barHeightRatio);
        ctx.fillStyle = accentAlpha(mag, 0.15, 0.55);
        ctx.fillRect(i * barW, h - barH, Math.max(1, barW - 0.5), barH);
      }

      const mid = h / 2;
      ctx.beginPath();
      ctx.strokeStyle = accentAlpha(1, 0.75, 0.95);
      ctx.lineWidth = cfg.lineWidth;
      const slice = timeData.length / w;
      for (let x = 0; x < w; x++) {
        const idx = Math.floor(x * slice);
        const v = (timeData[idx] - 128) / 128;
        const y = mid + v * (h * cfg.waveHeightRatio);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [accentAlpha, trailFill]
  );

  const drawWaveform = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      analyser: AnalyserNode,
      trails: boolean,
      dt: number,
      timeData: Uint8Array
    ) => {
      const cfg = waveformCfgRef.current;
      trailFill(
        ctx,
        w,
        h,
        dt,
        trails ? cfg.trailFadeSeconds : 0
      );

      const mid = h / 2;
      ctx.beginPath();
      ctx.strokeStyle = accentAlpha(1, 0.7, 0.95);
      ctx.lineWidth = cfg.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const slice = timeData.length / w;
      for (let x = 0; x < w; x++) {
        const idx = Math.floor(x * slice);
        const v = (timeData[idx] - 128) / 128;
        const y = mid + v * (h * cfg.waveHeightRatio);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    [accentAlpha, trailFill]
  );

  const drawIdle = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      fillOpaqueBlack(ctx, w, h);
      if (mode === "spectrum" || mode === "waveform") {
        ctx.strokeStyle = accentAlpha(0, 0.15, 0.15);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }
      const cfg = radialCfgRef.current;
      const { cx, cy, innerRadius } = radialGeometry(w, h, cfg);
      if (isId4Mode(mode)) {
        const spoke = cfg.layers?.spokes;
        ctx.strokeStyle = spoke
          ? `hsla(${spoke.h}, ${spoke.s * 0.85}%, ${spoke.baseL}%, 0.15)`
          : accentAlpha(0, 0.15, 0.15);
      } else {
        ctx.strokeStyle = accentAlpha(0, 0.15, 0.15);
      }
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
    },
    [accentAlpha, mode]
  );

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      analyser: AnalyserNode,
      sampleRate: number,
      timestamp: number,
      reduced: boolean
    ) => {
      if (!freqDataRef.current || freqDataRef.current.length !== analyser.frequencyBinCount) {
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      if (!timeDataRef.current || timeDataRef.current.length !== analyser.fftSize) {
        timeDataRef.current = new Uint8Array(analyser.fftSize);
      }

      const freqData = freqDataRef.current;
      const timeData = timeDataRef.current;

      let dt = 0;
      if (!reduced) {
        dt =
          lastTsRef.current > 0
            ? Math.min(0.05, (timestamp - lastTsRef.current) / 1000)
            : 0;
      }

      analyser.getByteTimeDomainData(
        timeData as Uint8Array<ArrayBuffer>
      );
      updatePunch(timeData, dt, reduced);

      if (mode === "waveform") {
        drawWaveform(ctx, w, h, analyser, !reduced, dt, timeData);
        return;
      }

      if (mode === "spectrum") {
        analyser.getByteFrequencyData(
          freqData as Uint8Array<ArrayBuffer>
        );
        const specCfg = spectrumCfgRef.current;
        const bands = logBin(
          freqData,
          specCfg.bands,
          specCfg.freqMin,
          specCfg.freqMax,
          sampleRate,
          analyser.fftSize
        );
        drawSpectrum(ctx, w, h, analyser, bands, !reduced, dt, timeData);
        return;
      }

      const cfg = radialCfgRef.current;
      let rotation = 0;
      if (!reduced) {
        rotationRef.current += cfg.rotationSpeed * dt;
        rotation = rotationRef.current;
        if (isId4Mode(mode) && cfg.wave) {
          waveTRef.current += cfg.wave.speed * dt;
        }
      }

      analyser.getByteFrequencyData(
        freqData as Uint8Array<ArrayBuffer>
      );
      const bands = logBin(
        freqData,
        cfg.bands,
        cfg.freqMin,
        cfg.freqMax,
        sampleRate,
        analyser.fftSize
      );

      const pCfg = particleCfgRef.current;
      const particlesActive = isParticleLayerActive(mode, reduced, h, pCfg);

      if (particlesActive) {
        const pCfg = particleCfgRef.current;
        if (!particlePoolRef.current) {
          particlePoolRef.current = new ParticlePool(
            pCfg.maxParticles,
            cfg.bands
          );
        } else {
          particlePoolRef.current.resizeBands(cfg.bands);
        }
      }

      drawRadial(ctx, w, h, bands, rotation, cfg, !reduced, {
        particles: particlesActive,
        dt,
        pool: particlesActive ? particlePoolRef.current : null,
      });
    },
    [drawRadial, drawSpectrum, drawWaveform, mode]
  );

  /** Latest draw fns — RAF loop reads refs so progress ticks don't restart the loop */
  const drawFrameRef = useRef(drawFrame);
  const drawIdleRef = useRef(drawIdle);
  drawFrameRef.current = drawFrame;
  drawIdleRef.current = drawIdle;

  const prefersReducedRef = useRef(prefersReduced);
  prefersReducedRef.current = prefersReduced;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fillOpaqueBlack(ctx, w, h);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const isPlaying = status === "playing";
    const { w, h } = sizeRef.current;

    if (!analyserNode || !isPlaying) {
      particlePoolRef.current?.reset();
      drawIdleRef.current(ctx, w, h);
      return () => {
        ro.disconnect();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }

    const sampleRate = audioContext?.sampleRate ?? 48000;
    lastTsRef.current = 0;
    lastReducedRef.current = 0;
    rotationRef.current = 0;
    waveTRef.current = 0;
    particlePoolRef.current?.reset();
    envRef.current = 0;
    punchRef.current = 0;
    fillOpaqueBlack(ctx, w, h);

    const loop = (ts: number) => {
      const { w: cw, h: ch } = sizeRef.current;
      if (prefersReducedRef.current) {
        if (ts - lastReducedRef.current >= REDUCED_MOTION_INTERVAL_MS) {
          lastReducedRef.current = ts;
          drawFrameRef.current(ctx, cw, ch, analyserNode, sampleRate, ts, true);
        }
      } else {
        drawFrameRef.current(ctx, cw, ch, analyserNode, sampleRate, ts, false);
        lastTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode, audioContext, status, mode]);

  return (
    <canvas
      ref={canvasRef}
      data-viz-mode={mode}
      style={{
        height: height === "fill" ? "100%" : `${height}px`,
        width: "100%",
      }}
      className={`block ${className}`}
      aria-hidden="true"
    />
  );
}

/** Fallback while search params hydrate */
function VisualizerFallback({
  height = 64,
  className = "",
}: Pick<VisualizerProps, "height" | "className">) {
  return (
    <canvas
      style={{
        height: height === "fill" ? "100%" : `${height}px`,
        width: "100%",
      }}
      className={`block ${className}`}
      aria-hidden="true"
    />
  );
}

const ShaderVisualizer = dynamic(() => import("./ShaderVisualizer"), {
  ssr: false,
  loading: () => <VisualizerFallback height="fill" />,
});

const GraphVisualizer = dynamic(() => import("./GraphVisualizer"), {
  ssr: false,
  loading: () => <VisualizerFallback height="fill" />,
});

function resolvePanelMode(
  collectionSlug: string | undefined,
  trackMeta: Record<string, unknown> | undefined,
  vizOverride: string | null
): VisualizerMode {
  if (
    process.env.NODE_ENV === "development" &&
    vizOverride &&
    isVisualizerMode(vizOverride)
  ) {
    return vizOverride;
  }
  return getVisualizerMode(collectionSlug, trackMeta);
}

function PanelVisualizer({
  className = "",
  height = "fill",
  collectionSlug,
  trackMeta,
  accentColor,
  trackAccent,
}: VisualizerProps) {
  const searchParams = useSearchParams();
  const vizOverride = searchParams.get("viz");
  const mode = resolvePanelMode(collectionSlug, trackMeta, vizOverride);
  const effectiveAccent = resolveVisualizerAccent(
    accentColor ?? "var(--accent)",
    trackMeta,
    trackAccent
  );

  if (mode === "graph") {
    return (
      <GraphVisualizer
        accentColor={effectiveAccent}
        className={className}
        height={height}
      />
    );
  }

  const sceneId: ShaderSceneId = isShaderSceneId(mode)
    ? mode
    : DEFAULT_SHADER_SCENE;
  return (
    <ShaderVisualizer sceneId={sceneId} className={className} height={height} />
  );
}

export default function Visualizer(props: VisualizerProps) {
  if (props.surface === "panel") {
    return (
      <Suspense
        fallback={
          <VisualizerFallback height={props.height} className={props.className} />
        }
      >
        <PanelVisualizer {...props} />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <VisualizerFallback height={props.height} className={props.className} />
      }
    >
      <VisualizerCanvas {...props} />
    </Suspense>
  );
}

export {
  DEFAULT_VISUALIZER_MODE,
  VISUALIZER_LIBRARY,
  getVisualizerMode,
} from "@/lib/visualizerPresets";
export { visualizerModeLabel } from "@/lib/visualizerPresets";
