"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Visualizer, {
  getVisualizerMode,
  visualizerModeLabel,
} from "./Visualizer";

const supportsFs =
  typeof document !== "undefined" &&
  typeof document.documentElement.requestFullscreen === "function";

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <polyline points="3,3 11,11" />
      <polyline points="11,3 3,11" />
    </svg>
  );
}

interface ExpandedVisualizerPanelProps {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  collectionSlug?: string;
  trackMeta?: Record<string, unknown>;
}

export default function ExpandedVisualizerPanel({
  open,
  onClose,
  accentColor,
  collectionSlug,
  trackMeta,
}: ExpandedVisualizerPanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const handleClose = useCallback(() => {
    if (document.fullscreenElement === wrapperRef.current) {
      void document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    onClose();
  }, [onClose]);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (isFullscreen) scheduleHideControls();
  }, [isFullscreen, scheduleHideControls]);

  const toggleFullscreen = useCallback(async () => {
    if (supportsFs) {
      if (document.fullscreenElement === wrapperRef.current) {
        try {
          await document.exitFullscreen();
        } catch {
          setIsFullscreen(false);
        }
        return;
      }
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
      try {
        await wrapperRef.current?.requestFullscreen();
      } catch {
        setIsFullscreen(true);
      }
      return;
    }
    setIsFullscreen((v) => !v);
  }, [isFullscreen]);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      if (document.fullscreenElement === wrapperRef.current) {
        void document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
      setControlsVisible(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.fullscreenElement === wrapperRef.current) return;
      if (isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
        return;
      }
      handleClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isFullscreen, handleClose]);

  useEffect(() => {
    if (!open || !isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setControlsVisible(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      return;
    }
    scheduleHideControls();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isFullscreen, scheduleHideControls]);

  if (!open) return null;

  const vizMode = getVisualizerMode(collectionSlug, trackMeta);

  return (
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center"
          : "fixed inset-x-0 z-[49] flex flex-col items-center px-4 pt-10 pb-2"
      }
      style={
        isFullscreen
          ? { background: "#000" }
          : {
              bottom: "var(--player-h)",
              background: "var(--surface)",
              borderTop: "1px solid var(--line)",
            }
      }
      role="dialog"
      aria-label={
        isFullscreen
          ? "Fullscreen audio visualizer"
          : "Expanded audio visualizer"
      }
      onMouseMove={isFullscreen ? revealControls : undefined}
    >
      <div
        className="absolute top-0 right-0 flex items-center gap-1 p-3 z-10 transition-opacity duration-300"
        style={{
          opacity: isFullscreen ? (controlsVisible ? 1 : 0) : 1,
        }}
      >
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="p-1.5 rounded-sm transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          style={{ color: "var(--text-dim)" }}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? <ShrinkVisualizerIcon /> : <ExpandVisualizerIcon />}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-sm transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          style={{ color: "var(--text-dim)" }}
          aria-label="Close visualizer"
        >
          <CloseIcon />
        </button>
      </div>

      <div
        className={
          isFullscreen
            ? "flex-1 min-h-0 w-full"
            : "aspect-square shrink-0"
        }
        style={
          isFullscreen
            ? undefined
            : {
                width: "min(50vh, calc(100vw - 2rem))",
                maxHeight: "50vh",
              }
        }
      >
        <Visualizer
          accentColor={accentColor}
          height="fill"
          className="w-full h-full"
          collectionSlug={collectionSlug}
          trackMeta={trackMeta}
          surface="panel"
        />
      </div>

      <p
        className={`font-mono-readout text-center pointer-events-none transition-opacity duration-300 ${
          isFullscreen
            ? "absolute left-4 right-4 bottom-4"
            : "relative mt-2 mb-1 px-4"
        }`}
        style={{
          color: "var(--text-dim)",
          fontSize: "0.625rem",
          opacity: isFullscreen ? (controlsVisible ? 1 : 0) : 1,
        }}
      >
        {visualizerModeLabel(vizMode)}
        {!isFullscreen && (
          <span className="hidden sm:inline"> · expand icon for fullscreen</span>
        )}
        {process.env.NODE_ENV === "development" && (
          <span> · try ?viz=graph, kaleidoscope, bass-vortex…</span>
        )}
      </p>
    </div>
  );
}

export function ExpandVisualizerIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <polyline points="1,4 1,1 4,1" />
      <polyline points="8,1 11,1 11,4" />
      <polyline points="11,8 11,11 8,11" />
      <polyline points="4,11 1,11 1,8" />
    </svg>
  );
}

function ShrinkVisualizerIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <polyline points="4,1 1,1 1,4" />
      <polyline points="8,1 11,1 11,4" />
      <polyline points="11,8 11,11 8,11" />
      <polyline points="1,8 1,11 4,11" />
    </svg>
  );
}
