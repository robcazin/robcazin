"use client";

import { useCallback, useRef, useState } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import Visualizer from "./Visualizer";
import Queue from "./Queue";
import { formatTime, resolveAccentHex } from "@/lib/utils";

/* ─── Icon helpers ───────────────────────────────────────────────────────── */
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <polygon points="4,2 16,9 4,16" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <rect x="3" y="2" width="4" height="14" rx="1" />
      <rect x="11" y="2" width="4" height="14" rx="1" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <polygon points="13,2 4,8 13,14" />
      <rect x="2" y="2" width="2.5" height="12" rx="1" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <polygon points="3,2 12,8 3,14" />
      <rect x="11.5" y="2" width="2.5" height="12" rx="1" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      {muted ? (
        <>
          <polygon points="1,5 5,5 9,2 9,14 5,11 1,11" />
          <line x1="12" y1="5" x2="16" y2="11" stroke="currentColor" strokeWidth="1.5" />
          <line x1="16" y1="5" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <polygon points="1,5 5,5 9,2 9,14 5,11 1,11" />
          <path d="M11.5 5.5 C13 6.5 13 9.5 11.5 10.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M13 3.5 C15.5 5.5 15.5 10.5 13 12.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="10" y2="12" />
    </svg>
  );
}

/* ─── Progress scrubber ──────────────────────────────────────────────────── */
function ProgressBar() {
  const { progress, seek } = usePlayer();
  const barRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const getRelativeX = useCallback(
    (clientX: number) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") seek(Math.max(0, progress - 0.02));
        if (e.key === "ArrowRight") seek(Math.min(1, progress + 0.02));
      }}
      className="relative h-[3px] w-full cursor-pointer group rounded-full"
      style={{ background: "var(--line)" }}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{
          width: `${progress * 100}%`,
          background: "var(--accent)",
          transition: "none",
        }}
      />
      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-opacity"
        style={{
          left: `${progress * 100}%`,
          background: "var(--accent)",
          opacity: hovered ? 1 : 0,
        }}
      />
    </div>
  );
}

/* ─── Volume slider ─────────────────────────────────────────────────────── */
function VolumeControl() {
  const { volume, setVolume } = usePlayer();
  const [muted, setMuted] = useState(false);
  const [premuteVol, setPremuteVol] = useState(volume);

  const handleMuteToggle = () => {
    if (muted) {
      setVolume(premuteVol || 0.7);
      setMuted(false);
    } else {
      setPremuteVol(volume);
      setVolume(0);
      setMuted(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleMuteToggle}
        className="shrink-0 transition-colors hover:text-[var(--text)]"
        style={{ color: "var(--text-dim)" }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <VolumeIcon muted={muted || volume === 0} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => {
          setVolume(parseFloat(e.target.value));
          setMuted(false);
        }}
        className="w-16 accent-[var(--accent)] cursor-pointer"
        aria-label="Volume"
      />
    </div>
  );
}

/* ─── PlayerDock ─────────────────────────────────────────────────────────── */
export default function PlayerDock() {
  const {
    currentTrack,
    currentCollection,
    status,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    toggleQueue,
    isQueueOpen,
    playbackError,
  } = usePlayer();

  const accent = resolveAccentHex(
    currentCollection?.accent ?? currentTrack?.accent ?? "var(--accent)"
  );
  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  return (
    <>
      <Queue />
      <footer
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: "var(--player-h)",
          background: "var(--surface)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: "1px solid var(--line)",
        }}
        role="region"
        aria-label="Audio player"
      >
        {/* Progress bar — full width, top edge */}
        <div className="absolute top-0 left-0 right-0 px-0">
          <ProgressBar />
        </div>

        <div className="h-full flex items-center gap-4 px-4 lg:px-6">
          {/* Visualizer — always visible; waveform + spectrum */}
          <div
            className="w-14 sm:w-24 lg:w-36 shrink-0"
            style={{ borderLeft: "1px solid var(--line)", paddingLeft: "0.75rem" }}
          >
            <Visualizer accentColor={accent} height={44} />
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0 hidden md:block">
            {currentTrack ? (
              <>
                <p
                  className="text-sm font-medium truncate leading-tight"
                  style={{ color: "var(--text)" }}
                >
                  {currentTrack.title}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{
                    color: status === "error" ? "var(--accent)" : "var(--text-dim)",
                  }}
                >
                  {status === "error" && playbackError
                    ? playbackError
                    : currentCollection?.title}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                dynamics are vital — don&apos;t be afraid to crank it up
              </p>
            )}
          </div>

          {/* Transport */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={playPrev}
              className="transition-colors hover:text-[var(--text)] disabled:opacity-30"
              style={{ color: "var(--text-dim)" }}
              disabled={!currentTrack}
              aria-label="Previous / restart"
            >
              <PrevIcon />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentTrack || currentTrack.kind === "video"}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: accent, color: "#0a0b0d" }}
              aria-label={isPlaying ? "Pause" : "Play"}
              aria-pressed={isPlaying}
            >
              {isLoading ? (
                <span className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            <button
              onClick={playNext}
              className="transition-colors hover:text-[var(--text)] disabled:opacity-30"
              style={{ color: "var(--text-dim)" }}
              disabled={!currentTrack}
              aria-label="Next track"
            >
              <NextIcon />
            </button>
          </div>

          {/* Time */}
          <div
            className="font-mono-readout shrink-0 hidden sm:flex items-center gap-1"
            aria-live="off"
          >
            <span>{formatTime(currentTime)}</span>
            <span style={{ color: "var(--line)" }}>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="hidden lg:flex shrink-0">
            <VolumeControl />
          </div>

          {/* Queue toggle */}
          <button
            onClick={toggleQueue}
            className="shrink-0 transition-colors hover:text-[var(--text)]"
            style={{ color: isQueueOpen ? accent : "var(--text-dim)" }}
            aria-label="Toggle queue"
            aria-pressed={isQueueOpen}
          >
            <QueueIcon />
          </button>
        </div>
      </footer>
    </>
  );
}
