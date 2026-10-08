"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

interface ArchiveSketchPreviewProps {
  sketchId: string;
  className?: string;
  height?: number | "fill";
}

/**
 * Square studies paint a full frame and do not ship isolate.js.
 * `?item` makes motion-runtime hide the body until an isolator removes the guard,
 * so these pages are loaded without that query.
 */
const FULL_BLEED = new Set([
  "signal-assembly.html",
  "phase-mechanics.html",
  "orbital-memory.html",
  "square-signal-assembly.html",
  "square-signal-assembly-slow.html",
]);

/** `iwr:<study file>:<item index>` */
function sketchSrc(sketchId: string): string | null {
  if (!sketchId.startsWith("iwr:")) return null;
  const rest = sketchId.slice(4);
  const split = rest.lastIndexOf(":");
  if (split <= 0) return null;
  const file = rest.slice(0, split);
  const item = rest.slice(split + 1);
  if (!file.endsWith(".html") || !/^\d+$/.test(item)) return null;
  const path = `/dev/iwrzwr-archive/studies/${file}`;
  if (FULL_BLEED.has(file)) return path;
  return `${path}?item=${item}`;
}

function bandAverage(bins: Uint8Array, start: number, end: number): number {
  let sum = 0;
  const from = Math.max(0, start);
  const to = Math.min(bins.length, end);
  if (to <= from) return 0;
  for (let i = from; i < to; i++) sum += bins[i];
  return sum / (to - from) / 255;
}

/**
 * Dev-only iframe of one vendored archive sketch.
 * The study page is loaded only after this component mounts.
 */
function disposeFrame(iframe: HTMLIFrameElement) {
  const frame = iframe.contentWindow;
  if (frame) {
    try {
      frame.postMessage(
        { type: "archive-visibility", active: false },
        window.location.origin
      );
      frame.postMessage({ type: "iwr-dispose" }, window.location.origin);
    } catch {
      // The document is already gone.
    }
  }
  iframe.src = "about:blank";
  iframe.remove();
}

export default function ArchiveSketchPreview({
  sketchId,
  className = "",
  height = "fill",
}: ArchiveSketchPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { analyserNode, status } = usePlayer();
  const analyserRef = useRef(analyserNode);
  const statusRef = useRef(status);
  const src = useMemo(() => sketchSrc(sketchId), [sketchId]);

  useEffect(() => {
    analyserRef.current = analyserNode;
    statusRef.current = status;
  }, [analyserNode, status]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !src) return;

    const iframe = document.createElement("iframe");
    iframe.title = sketchId;
    iframe.src = src;
    iframe.className = "block h-full w-full border-0 bg-black";
    host.replaceChildren(iframe);

    const freq = { current: null as Uint8Array | null };
    let env = 0;
    let kickAge = 30;
    let snareAge = 30;
    let hatAge = 30;
    let noteAge = 30;
    let beat = 0;
    let songTime = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      kickAge += dt;
      snareAge += dt;
      hatAge += dt;
      noteAge += dt;

      const analyser = analyserRef.current;
      const playing = statusRef.current === "playing" && Boolean(analyser);
      let low = 0;
      let mid = 0;
      let high = 0;
      let level = 0;
      let hit = 0;

      if (playing && analyser) {
        songTime += dt;
        if (!freq.current || freq.current.length !== analyser.frequencyBinCount) {
          freq.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(freq.current as Uint8Array<ArrayBuffer>);
        const bins = freq.current;
        const n = bins.length;
        const lowEnd = Math.max(1, Math.floor(n * 0.1));
        const midEnd = Math.max(lowEnd + 1, Math.floor(n * 0.4));
        low = bandAverage(bins, 0, lowEnd);
        mid = bandAverage(bins, lowEnd, midEnd);
        high = bandAverage(bins, midEnd, n);
        level = low * 0.5 + mid * 0.3 + high * 0.2;
        const transient = Math.max(0, level - env);
        env += (level - env) * (level > env ? 0.35 : 0.08);
        hit = Math.min(1, transient * 6);
        if (low > 0.55 && kickAge > 0.18) {
          kickAge = 0;
          beat += 1;
        }
        if (mid > 0.45 && snareAge > 0.16) snareAge = 0;
        if (high > 0.35 && hatAge > 0.08) hatAge = 0;
        if (level > 0.4 && noteAge > 0.14) noteAge = 0;
      } else {
        env *= 0.9;
      }

      const frame = iframe.contentWindow;
      if (!frame) return;
      try {
        frame.postMessage(
          {
            type: "iwr-audio",
            active: playing,
            level,
            hit,
            low,
            mid,
            high,
            kickAge,
            snareAge,
            hatAge,
            noteAge,
            beat,
            songTime,
          },
          window.location.origin
        );
      } catch {
        // Frame navigated away during disposal.
      }
    };

    const postViewport = () => {
      const frame = iframe.contentWindow;
      if (!frame) return;
      const box = host.getBoundingClientRect();
      try {
        frame.postMessage(
          {
            type: "iwr-viewport",
            width: box.width,
            height: box.height,
            dpr: window.devicePixelRatio || 1,
          },
          window.location.origin
        );
      } catch {
        // Frame navigated away during disposal.
      }
    };
    const viewportObserver = new ResizeObserver(postViewport);
    viewportObserver.observe(host);
    window.addEventListener("resize", postViewport);
    window.visualViewport?.addEventListener("resize", postViewport);
    iframe.addEventListener("load", postViewport);

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      viewportObserver.disconnect();
      window.removeEventListener("resize", postViewport);
      window.visualViewport?.removeEventListener("resize", postViewport);
      disposeFrame(iframe);
    };
  }, [sketchId, src]);

  if (!src) {
    return (
      <div className={`grid place-items-center bg-black text-white/70 ${className}`}>
        Unknown archive sketch
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={`bg-black ${className}`}
      style={{
        height: height === "fill" ? "100%" : `${height}px`,
        width: "100%",
      }}
    />
  );
}
