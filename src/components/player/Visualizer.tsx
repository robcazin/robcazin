"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { resolveAccentHex } from "@/lib/utils";

interface VisualizerProps {
  accentColor?: string;
  className?: string;
  /** Height in pixels */
  height?: number;
}

const TARGET_FPS = 48;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export default function Visualizer({
  accentColor = "#ff5a3c",
  className = "",
  height = 64,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const { analyserNode, audioContext, status } = usePlayer();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forceFull =
      document.documentElement.dataset.motion === "full";
    const apply = () =>
      setPrefersReduced(!forceFull && mq.matches);
    apply();
    const onChange = () => apply();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const accentHex = resolveAccentHex(accentColor);
  const r = parseInt(accentHex.slice(1, 3), 16);
  const g = parseInt(accentHex.slice(3, 5), 16);
  const b = parseInt(accentHex.slice(5, 7), 16);

  const drawStatic = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    },
    [r, g, b]
  );

  const drawFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      analyser: AnalyserNode,
      timestamp: number
    ) => {
      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame((ts) =>
          drawFrame(ctx, w, h, analyser, ts)
        );
        return;
      }
      lastFrameRef.current = timestamp;

      ctx.clearRect(0, 0, w, h);

      // Frequency bars (background)
      const freqBins = analyser.frequencyBinCount;
      const freqData = new Uint8Array(freqBins);
      analyser.getByteFrequencyData(freqData);
      const usedBins = Math.floor(freqBins * 0.5);
      const barW = w / usedBins;
      for (let i = 0; i < usedBins; i++) {
        const v = freqData[i] / 255;
        const barH = Math.max(1, v * h * 0.45);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.15 + v * 0.45})`;
        ctx.fillRect(i * barW, h - barH, barW - 0.5, barH);
      }

      // Time-domain waveform (foreground — most visible in the small dock)
      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
      const mid = h / 2;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
      ctx.lineWidth = 1.5;
      const slice = timeData.length / w;
      for (let x = 0; x < w; x++) {
        const idx = Math.floor(x * slice);
        const v = (timeData[idx] - 128) / 128;
        const y = mid + v * (h * 0.42);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafRef.current = requestAnimationFrame((ts) =>
        drawFrame(ctx, w, h, analyser, ts)
      );
    },
    [r, g, b]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const isPlaying = status === "playing";

    if (!analyserNode || !isPlaying || prefersReduced) {
      drawStatic(ctx, sizeRef.current.w, sizeRef.current.h);
      return () => {
        ro.disconnect();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    if (audioContext?.state === "suspended") {
      void audioContext.resume();
    }

    lastFrameRef.current = 0;
    const { w, h } = sizeRef.current;
    rafRef.current = requestAnimationFrame((ts) =>
      drawFrame(ctx, w, h, analyserNode, ts)
    );

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    analyserNode,
    audioContext,
    status,
    drawStatic,
    drawFrame,
    prefersReduced,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height: `${height}px`, width: "100%" }}
      className={`block ${className}`}
      aria-hidden="true"
    />
  );
}
