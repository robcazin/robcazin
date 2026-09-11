"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

function isTouchLiteDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 1
  );
}

/** Seek strip without WaveSurfer — avoids decoding full FLAC in RAM on iOS. */
function LiteSeekStrip({
  progress,
  seek,
  accentColor,
  className,
}: {
  progress: number;
  seek: (t: number) => void;
  accentColor: string;
  className: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const getRelativeX = useCallback((clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => seek(getRelativeX(e.clientX)),
    [seek, getRelativeX]
  );

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") seek(Math.max(0, progress - 0.02));
        if (e.key === "ArrowRight") seek(Math.min(1, progress + 0.02));
      }}
      className={`relative flex h-12 w-full cursor-pointer items-center ${className}`}
    >
      <div
        className="relative h-px w-full"
        style={{ background: "var(--line)" }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${progress * 100}%`, background: accentColor }}
        />
      </div>
    </div>
  );
}

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
 * On iOS / coarse-pointer devices WaveSurfer is skipped entirely (decoding a
 * full FLAC for peaks exhausts WebKit memory). A thin ProgressBar-style seek
 * strip is rendered instead.
 *
 * (Tradeoff: the file is fetched once for playback and once by WaveSurfer for
 * peaks. To drop to a single fetch later, precompute peaks at build time and
 * pass them via the `peaks` option instead of `url`.)
 */
export default function Waveform({
  accentColor = "var(--accent)",
  className = "",
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  /** null until mounted — avoids hydration mismatch and premature WaveSurfer init */
  const [lite, setLite] = useState<boolean | null>(null);
  const { currentTrack, progress, seek } = usePlayer();

  useEffect(() => {
    setLite(isTouchLiteDevice());
  }, []);

  // Init WaveSurfer when track changes
  useEffect(() => {
    if (lite !== false) return;
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
  }, [currentTrack?.id, lite]);

  // Keep WaveSurfer progress in sync (no seek feedback loop)
  useEffect(() => {
    if (lite !== false || !wsRef.current || !ready || isDragging) return;
    const ws = wsRef.current;
    const dur = ws.getDuration?.() ?? 0;
    if (dur > 0) {
      ws.setTime?.(progress * dur);
    }
  }, [progress, ready, isDragging, lite]);

  if (lite) {
    return (
      <LiteSeekStrip
        progress={progress}
        seek={seek}
        accentColor={accentColor}
        className={className}
      />
    );
  }

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
