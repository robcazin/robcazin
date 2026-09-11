"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { GRAPH_N, GraphEngine } from "@/lib/graphEngine";
import { resolveAccentHex } from "@/lib/utils";
import { PUNCH_CONFIG } from "@/lib/visualizerPresets";

/** RMS of raw time-domain samples — unaffected by the analyser's smoothingTimeConstant,
 *  so transients (kick/snare attacks) come through undamped. Same technique as Visualizer.tsx. */
function timeDataRms(timeData: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / timeData.length);
}

interface GraphVisualizerProps {
  accentColor?: string;
  className?: string;
  height?: number | "fill";
}

function parseRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Hue-rotate ~180° in RGB for the negative-curvature pole. */
function complementRgb([r, g, b]: [number, number, number]): [number, number, number] {
  return [255 - r, 255 - g, 255 - b];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Reference for normalizing node degree to 0..1. The Flower of Life preset's
 *  hex lattice tops out around 6; the old Star hub preset reaches 9 — this
 *  splits the difference so neither preset looks clipped or washed out. */
const MAX_DEGREE_REF = 7;

export default function GraphVisualizer({
  accentColor = "var(--accent)",
  className = "",
  height = "fill",
}: GraphVisualizerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyserNode, status } = usePlayer();
  const analyserRef = useRef(analyserNode);
  const statusRef = useRef(status);
  analyserRef.current = analyserNode;
  statusRef.current = status;
  const accentRef = useRef(accentColor);
  accentRef.current = accentColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const engine = new GraphEngine({ morphDuration: 10, flowAmount: 0.55 });
    engine.update(0);
    const flashUntil = new Array<number>(GRAPH_N).fill(0);
    const freqData = { current: null as Uint8Array | null };
    const timeData = { current: null as Uint8Array | null };
    let envLevel = 0;
    let punch = 0;
    let lastStep = 0;
    let raf = 0;
    let lastTs = performance.now();
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      const reduced =
        document.documentElement.dataset.motion !== "full" && motionMq.matches;
      const analyser = analyserRef.current;
      const playing = statusRef.current === "playing" && !!analyser;
      let mid = 0;
      if (!reduced && playing && analyser) {
        if (
          !freqData.current ||
          freqData.current.length !== analyser.frequencyBinCount
        ) {
          freqData.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(
          freqData.current as Uint8Array<ArrayBuffer>
        );
        const bins = freqData.current;
        const n = bins.length;
        const lowEnd = Math.max(1, Math.floor(n * 0.1));
        const midEnd = Math.max(lowEnd + 1, Math.floor(n * 0.4));
        for (let i = lowEnd; i < midEnd; i++) mid += bins[i];
        mid = mid / (midEnd - lowEnd) / 255;
      }

      // Transient/"punch" detector on raw time-domain samples — this is what
      // Visualizer.tsx uses for beat punch, and it bypasses the analyser's
      // smoothingTimeConstant (0.8), which otherwise smears out kick attacks.
      if (!reduced && playing && analyser) {
        if (!timeData.current || timeData.current.length !== analyser.fftSize) {
          timeData.current = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(
          timeData.current as Uint8Array<ArrayBuffer>
        );
        const rms = timeDataRms(timeData.current);
        const stepDt = dt > 0 ? dt : 1 / 60;
        const coef = Math.min(
          1,
          (rms > envLevel ? PUNCH_CONFIG.attack : PUNCH_CONFIG.release) *
            stepDt *
            60
        );
        envLevel = envLevel + (rms - envLevel) * coef;
        const transient = Math.min(
          1,
          Math.max(0, (rms - envLevel - PUNCH_CONFIG.threshold) * PUNCH_CONFIG.sensitivity)
        );
        punch =
          dt > 0
            ? Math.max(transient, punch * Math.pow(0.1, dt / PUNCH_CONFIG.punchRelease))
            : Math.max(transient, punch);
      } else {
        punch = 0;
      }

      if (!reduced) {
        engine.flowAmount = 0.35 + mid * 0.35 + punch * 0.4;
        engine.update(dt);
      }

      if (!reduced && playing && punch > 0.32 && now - lastStep > 160) {
        const beat = engine.step();
        flashUntil[beat.node] = now + 260 + punch * 200;
        lastStep = now;
      }

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.38;
      const accentHex = resolveAccentHex(accentRef.current);
      const posRgb = parseRgb(accentHex);
      const negRgb = complementRgb(posRgb);

      for (let i = 0; i < engine.n; i++) {
        for (let j = i + 1; j < engine.n; j++) {
          const wt = engine.W[i][j];
          if (wt < 0.03) continue;
          const t = Math.max(0, Math.min(1, (engine.Fmat[i][j] + 4) / 8));
          const r = Math.round(lerp(negRgb[0], posRgb[0], t));
          const g = Math.round(lerp(negRgb[1], posRgb[1], t));
          const b = Math.round(lerp(negRgb[2], posRgb[2], t));
          ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(1, 0.12 + 0.55 * wt + punch * 0.3)})`;
          ctx.lineWidth = (0.6 + 2.2 * wt) * (1 + punch * 0.7);
          ctx.beginPath();
          ctx.moveTo(
            cx + engine.positions[i].x * radius,
            cy + engine.positions[i].y * radius
          );
          ctx.lineTo(
            cx + engine.positions[j].x * radius,
            cy + engine.positions[j].y * radius
          );
          ctx.stroke();
        }
      }

      if (engine.droneNode >= 0) {
        const p = engine.positions[engine.droneNode];
        const pulse = 8 + 4 * Math.sin(now / 300) + punch * 10;
        ctx.strokeStyle = `rgba(${posRgb[0]},${posRgb[1]},${posRgb[2]},${Math.min(1, 0.45 + punch * 0.3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          cx + p.x * radius,
          cy + p.y * radius,
          16 + pulse,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      for (let i = 0; i < engine.n; i++) {
        const p = engine.positions[i];
        const deg = engine.degree(i);
        const baseR = 4 + 3.2 * Math.min(1, deg / MAX_DEGREE_REF);
        const flashing = now < flashUntil[i];
        const isWalker = i === engine.walkerNode;
        const r = baseR + punch * 3 + (flashing ? 5 : 0) + (isWalker ? 2 : 0);
        ctx.beginPath();
        ctx.arc(cx + p.x * radius, cy + p.y * radius, r, 0, Math.PI * 2);
        if (flashing || isWalker) {
          ctx.fillStyle = accentHex;
        } else {
          const a = 0.35 + 0.5 * Math.min(1, deg / MAX_DEGREE_REF);
          ctx.fillStyle = `rgba(255,255,255,${a})`;
        }
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        height: height === "fill" ? "100%" : `${height}px`,
        width: "100%",
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
