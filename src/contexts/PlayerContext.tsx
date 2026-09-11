"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Track, Collection } from "@/lib/types";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface PlayerContextValue {
  // State
  currentTrack: Track | null;
  currentCollection: Collection | null;
  queue: Track[];
  status: PlayerStatus;
  progress: number; // 0–1
  currentTime: number; // seconds
  duration: number; // seconds
  volume: number; // 0–1
  isQueueOpen: boolean;
  playbackError: string | null;

  // Audio nodes (exposed for Visualizer)
  analyserNode: AnalyserNode | null;
  audioContext: AudioContext | null;

  // Actions
  playTrack: (track: Track, collection: Collection) => void;
  togglePlay: () => void;
  seek: (fraction: number) => void;
  seekSeconds: (seconds: number) => void;
  setVolume: (v: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setQueue: (tracks: Track[]) => void;
  toggleQueue: () => void;
}

/* ─── Context ─────────────────────────────────────────────────────────────── */

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/* ─── Provider ────────────────────────────────────────────────────────────── */

const VOLUME_KEY = "rc_volume";

function describeMediaError(audio: HTMLAudioElement, src: string): string {
  const err = audio.error;
  if (!err) return `Could not play ${src}`;
  switch (err.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "Playback aborted.";
    case MediaError.MEDIA_ERR_NETWORK:
      return `Network error loading ${src}`;
    case MediaError.MEDIA_ERR_DECODE:
      return "Decode error — file may be corrupt or use an unsupported codec.";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return `File not found or unsupported format: ${src}`;
    default:
      return `Playback failed for ${src}`;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentCollection, setCurrentCollection] =
    useState<Collection | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // The analyser/context are stored in STATE (not just refs) so that consumers
  // such as <Visualizer> re-render and receive the node once it is created on
  // the first play gesture. A ref alone would never trigger that re-render and
  // the visualizer would read a permanently-null analyser (a dead, flat graph).
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  /* ─── Audio element bootstrap (once ref is mounted) ──────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = "metadata";

    const stored = localStorage.getItem(VOLUME_KEY);
    const initialVolume = stored ? parseFloat(stored) : 0.8;
    if (!Number.isNaN(initialVolume)) {
      audio.volume = initialVolume;
      setVolumeState(initialVolume);
    } else {
      audio.volume = volume;
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Keep status in sync — after buffering, `playing` may not re-fire.
      if (!audio.paused && !audio.ended) {
        setStatus((s) => (s === "loading" ? s : "playing"));
      }
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlaying = () => {
      setPlaybackError(null);
      setStatus("playing");
    };
    const onPause = () => {
      if (!audio.ended) setStatus("paused");
    };
    const onWaiting = () => setStatus("loading");
    const onCanPlay = () => {
      if (!audio.paused) setStatus("playing");
    };
    const onError = () => {
      setPlaybackError(describeMediaError(audio, audio.src));
      setStatus("error");
    };
    const onEnded = () => {
      setStatus("paused");
      playNextRef.current();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Re-sync status after navigation / tab focus (playing may not re-fire) ─ */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = () => {
      if (!currentTrack || currentTrack.kind === "video") return;
      if (!audio.paused && !audio.ended) {
        setStatus((s) => (s === "loading" ? s : "playing"));
      } else if (audio.paused && !audio.ended) {
        setStatus("paused");
      }
    };

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || currentTrack.kind === "video") return;
    if (!audio.paused && !audio.ended) {
      setStatus((s) => (s === "loading" ? s : "playing"));
    }
  }, [pathname, currentTrack]);

  /* ─── Web Audio API setup ─────────────────────────────────────────────── */
  // Must run inside a user gesture. createMediaElementSource can only be called
  // ONCE per <audio> element, so we guard with audioCtxRef and never rebuild on
  // track change. The freshly-built graph is pushed into state so consumers
  // (the Visualizer) re-render with a live analyser.
  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    if (!audioRef.current) return;

    type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor =
      window.AudioContext ||
      (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    // createMediaElementSource consumes the element's output; route it through
    // the analyser and back out to the speakers.
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    // Push into state → triggers a re-render so <Visualizer> gets the node.
    setAnalyserNode(analyser);
    setAudioContext(ctx);
  }, []);

  /* ─── playTrack ───────────────────────────────────────────────────────── */
  const playTrack = useCallback(
    (track: Track, collection: Collection) => {
      if (track.kind === "video") {
        // Video tracks are handled in the now-playing view; just set state
        setCurrentTrack(track);
        setCurrentCollection(collection);
        // Queue the rest of the collection
        const idx = collection.tracks.findIndex((t) => t.id === track.id);
        const rest = idx >= 0 ? collection.tracks.slice(idx + 1) : [];
        setQueueState(rest);
        setStatus("idle");
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      ensureAudioContext();
      void audioCtxRef.current?.resume();

      audio.pause();
      audio.src = track.src;
      audio.load();
      setPlaybackError(null);
      setStatus("loading");
      setCurrentTrack(track);
      setCurrentCollection(collection);
      setCurrentTime(0);
      setDuration(0);

      const idx = collection.tracks.findIndex((t) => t.id === track.id);
      const rest = idx >= 0 ? collection.tracks.slice(idx + 1) : [];
      setQueueState(rest);

      audio.play().catch(() => setStatus("paused"));
    },
    [ensureAudioContext]
  );

  /* ─── playNextRef (stable ref so onEnded can call it) ─────────────────── */
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const currentCollectionRef = useRef(currentCollection);
  useEffect(() => {
    currentCollectionRef.current = currentCollection;
  }, [currentCollection]);

  const playNextRef = useRef<() => void>(() => {});

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const col = currentCollectionRef.current;
    if (q.length > 0 && col) {
      const [next, ...rest] = q;
      setQueueState(rest);
      playTrack(next, col);
    }
  }, [playTrack]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    // Otherwise, no prev queue maintained — just restart
    audio.currentTime = 0;
  }, []);

  /* ─── togglePlay ──────────────────────────────────────────────────────── */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || currentTrack.kind === "video") return;

    ensureAudioContext();
    void audioCtxRef.current?.resume();

    // Trust the element, not React status (can drift after route changes / buffering).
    if (audio.paused || audio.ended) {
      void audio.play().catch(() => setStatus("paused"));
    } else {
      audio.pause();
    }
  }, [currentTrack, ensureAudioContext]);

  /* ─── seek ────────────────────────────────────────────────────────────── */
  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = fraction * audio.duration;
  }, []);

  const seekSeconds = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, seconds));
  }, []);

  /* ─── volume ──────────────────────────────────────────────────────────── */
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    setVolumeState(clamped);
    localStorage.setItem(VOLUME_KEY, String(clamped));
  }, []);

  /* ─── keyboard controls ───────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekSeconds((audioRef.current?.currentTime ?? 0) - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekSeconds((audioRef.current?.currentTime ?? 0) + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(volume + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(volume - 0.1);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, seekSeconds, setVolume, volume]);

  /* ─── Context value ───────────────────────────────────────────────────── */
  const progress =
    duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const value: PlayerContextValue = {
    currentTrack,
    currentCollection,
    queue,
    status,
    progress,
    currentTime,
    duration,
    volume,
    isQueueOpen,
    playbackError,
    analyserNode,
    audioContext,
    playTrack,
    togglePlay,
    seek,
    seekSeconds,
    setVolume,
    playNext,
    playPrev,
    setQueue: setQueueState,
    toggleQueue: () => setIsQueueOpen((o) => !o),
  };

  return (
    <PlayerContext.Provider value={value}>
      {/* In-DOM element — required for reliable createMediaElementSource routing */}
      <audio
        ref={audioRef}
        preload="metadata"
        aria-hidden="true"
        className="sr-only"
      />
      {children}
    </PlayerContext.Provider>
  );
}
