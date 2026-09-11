"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { usePlayer } from "@/contexts/PlayerContext";
import {
  DEFAULT_SHADER_SCENE,
  SHADER_VERTEX,
  getShaderScene,
  isShaderSceneId,
  type ShaderSceneId,
} from "@/lib/shaderScenes";

interface ShaderVisualizerProps {
  sceneId: ShaderSceneId;
  className?: string;
  height?: number | "fill";
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

function WaveformFallback({
  className = "",
  height = "fill",
}: {
  className?: string;
  height?: number | "fill";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyserNode, status } = usePlayer();
  const timeDataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      if (!analyserNode || status !== "playing") return;
      if (!timeDataRef.current || timeDataRef.current.length !== analyserNode.fftSize) {
        timeDataRef.current = new Uint8Array(analyserNode.fftSize);
      }
      analyserNode.getByteTimeDomainData(
        timeDataRef.current as Uint8Array<ArrayBuffer>
      );
      const mid = h / 2;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      const data = timeDataRef.current;
      const slice = data.length / w;
      for (let x = 0; x < w; x++) {
        const v = (data[Math.floor(x * slice)] - 128) / 128;
        const y = mid + v * h * 0.44;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [analyserNode, status]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{
        height: height === "fill" ? "100%" : `${height}px`,
        width: "100%",
      }}
      aria-hidden
    />
  );
}

export default function ShaderVisualizer({
  sceneId,
  className = "",
  height = "fill",
}: ShaderVisualizerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyserNode, status } = usePlayer();
  const analyserRef = useRef(analyserNode);
  const statusRef = useRef(status);
  analyserRef.current = analyserNode;
  statusRef.current = status;
  const [webglOk, setWebglOk] = useState(true);
  const sceneIdRef = useRef(sceneId);
  sceneIdRef.current = isShaderSceneId(sceneId) ? sceneId : DEFAULT_SHADER_SCENE;

  useEffect(() => {
    if (!supportsWebGL()) {
      setWebglOk(false);
      return;
    }

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglOk(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    let material = makeMaterial(sceneIdRef.current);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const freqData = { current: null as Uint8Array | null };
    let raf = 0;
    let lastTs = performance.now();
    let elapsed = 0;

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h, false);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const applyScene = (id: ShaderSceneId) => {
      const next = makeMaterial(id);
      mesh.material = next;
      material.dispose();
      material = next;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      elapsed += dt;
      material.uniforms.time.value = elapsed;

      const wanted = sceneIdRef.current;
      if (material.userData.sceneId !== wanted) applyScene(wanted);

      const analyser = analyserRef.current;
      if (analyser && statusRef.current === "playing") {
        if (!freqData.current || freqData.current.length !== analyser.frequencyBinCount) {
          freqData.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(
          freqData.current as Uint8Array<ArrayBuffer>
        );
        const bins = freqData.current;
        const n = bins.length;
        const lowEnd = Math.max(1, Math.floor(n * 0.1));
        const midEnd = Math.max(lowEnd + 1, Math.floor(n * 0.4));
        let low = 0;
        let mid = 0;
        let high = 0;
        for (let i = 0; i < lowEnd; i++) low += bins[i];
        for (let i = lowEnd; i < midEnd; i++) mid += bins[i];
        for (let i = midEnd; i < n; i++) high += bins[i];
        material.uniforms.audioLow.value = low / lowEnd / 255;
        material.uniforms.audioMid.value = mid / (midEnd - lowEnd) / 255;
        material.uniforms.audioHigh.value = high / Math.max(1, n - midEnd) / 255;
      } else {
        material.uniforms.audioLow.value *= 0.92;
        material.uniforms.audioMid.value *= 0.92;
        material.uniforms.audioHigh.value *= 0.92;
      }

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  if (!webglOk) {
    return <WaveformFallback className={className} height={height} />;
  }

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

function makeMaterial(id: ShaderSceneId): THREE.ShaderMaterial {
  const scene = getShaderScene(id);
  const mat = new THREE.ShaderMaterial({
    vertexShader: SHADER_VERTEX,
    fragmentShader: scene.fragmentShader,
    uniforms: {
      time: { value: 0 },
      audioLow: { value: 0 },
      audioMid: { value: 0 },
      audioHigh: { value: 0 },
    },
  });
  mat.userData.sceneId = id;
  return mat;
}
