"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

interface WaveformProps {
  accentColor?: string;
  className?: string;
}

/**
 * Display-and-scrub waveform.
 *
 * Architecture: PlayerContext owns the single plain <audio> element that
 * actually plays, and the AnalyserNode taps THAT element via its own
 * createMediaElementSource (called exactly once). WaveSurfer here is created
 * with the `WebAudio` backend purely to DECODE + DRAW peaks and handle
 * scrub clicks — it never plays audio (we never call ws.play), so it owns no
 * playback element and cannot conflict with the analyser graph. Cursor sync
 * and seeks are bridged to PlayerContext below.
 *
 * (Tradeoff: the file is fetched once for playback and once by WaveSurfer for
 * peaks. To drop to a single fetch later, precompute peaks at build time and
 * pass them via the `peaks` option instead of `url`.)
 */
export default function Waveform({
  accentColor = "#ff5a3c",
  className = "",
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { currentTrack, progress, seek } = usePlayer();

  // Init WaveSurfer when track changes
  useEffect(() => {
    if (!containerRef.current || !currentTrack || currentTrack.kind !== "audio")
      return;

    let destroyed = false;

    const init = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      if (destroyed) return;

      wsRef.current?.destroy();
      setReady(false);

      const ws = WaveSurfer.create({
        container: containerRef.current!,
        url: currentTrack.src,
        waveColor: "#23262b",
        progressColor: accentColor,
        cursorColor: accentColor,
        cursorWidth: 1,
        height: 48,
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        backend: "WebAudio",
      });

      ws.on("ready", () => {
        if (!destroyed) setReady(true);
      });

      ws.on("seeking", (t: number) => {
        if (!destroyed) {
          const dur = ws.getDuration();
          if (dur > 0) seek(t / dur);
        }
      });

      wsRef.current = ws;
    };

    init();

    return () => {
      destroyed = true;
      wsRef.current?.destroy();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Keep WaveSurfer progress in sync (no seek feedback loop)
  useEffect(() => {
    if (!wsRef.current || !ready || isDragging) return;
    const ws = wsRef.current;
    const dur = ws.getDuration?.() ?? 0;
    if (dur > 0) {
      ws.setTime?.(progress * dur);
    }
  }, [progress, ready, isDragging]);

  return (
    <div
      className={`relative w-full cursor-pointer ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      <div ref={containerRef} className="w-full" />
      {!ready && currentTrack?.kind === "audio" && (
        <div className="absolute inset-0 flex items-center">
          <div
            className="h-px w-full"
            style={{ background: "var(--line)" }}
          />
        </div>
      )}
    </div>
  );
}
