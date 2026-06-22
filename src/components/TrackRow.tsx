"use client";

import { usePlayer } from "@/contexts/PlayerContext";
import type { Track, Collection } from "@/lib/types";
import { formatTime } from "@/lib/utils";

interface TrackRowProps {
  track: Track;
  collection: Collection;
  index: number;
  onPreview?: (id: string) => void;
  onPin?: (id: string) => void;
  detailActive?: boolean;
  pinned?: boolean;
}

function VideoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <polygon points="2,1 11,6 2,11" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <polygon points="1,1 9,6 1,11" />
    </svg>
  );
}

export default function TrackRow({
  track,
  collection,
  index,
  onPreview,
  onPin,
  detailActive,
  pinned,
}: TrackRowProps) {
  const { currentTrack, status, playTrack } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const isPlaying = isCurrent && status === "playing";
  const accent = collection.accent ?? "var(--accent)";
  const highlighted = isCurrent || detailActive;

  return (
    <li>
      <button
        onClick={() => {
          onPin?.(track.id);
          playTrack(track, collection);
        }}
        onMouseEnter={() => onPreview?.(track.id)}
        onFocus={() => onPreview?.(track.id)}
        className="w-full text-left flex items-center gap-4 px-4 py-3.5 group transition-colors hover:bg-[var(--surface-2)]"
        style={{
          borderBottom: "1px solid var(--line)",
          background: highlighted ? "var(--surface-2)" : undefined,
        }}
        aria-label={`Play ${track.title}`}
        aria-pressed={isCurrent}
      >
        {/* Index / play indicator */}
        <div
          className="font-mono-readout w-6 shrink-0 text-right"
          style={{ color: isCurrent ? accent : "var(--text-dim)" }}
        >
          {isCurrent ? (
            isPlaying ? (
              <span className="inline-flex gap-0.5 items-end h-3">
                <span
                  className="w-0.5 rounded-sm animate-pulse"
                  style={{ height: "60%", background: accent }}
                />
                <span
                  className="w-0.5 rounded-sm animate-pulse"
                  style={{
                    height: "100%",
                    background: accent,
                    animationDelay: "0.15s",
                  }}
                />
                <span
                  className="w-0.5 rounded-sm animate-pulse"
                  style={{
                    height: "40%",
                    background: accent,
                    animationDelay: "0.3s",
                  }}
                />
              </span>
            ) : (
              <span style={{ color: accent }}>
                {track.kind === "video" ? <VideoIcon /> : <AudioIcon />}
              </span>
            )
          ) : (
            <span className="group-hover:hidden">{index + 1}</span>
          )}
          {!isCurrent && (
            <span className="hidden group-hover:inline" style={{ color: accent }}>
              {track.kind === "video" ? <VideoIcon /> : <AudioIcon />}
            </span>
          )}
        </div>

        {/* Title + notes */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text)" }}
          >
            {track.title}
          </p>
          {track.notes && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--text-dim)" }}
            >
              {track.notes}
            </p>
          )}
        </div>

        {/* Kind badge */}
        {track.kind === "video" && (
          <span
            className="label-caps shrink-0 hidden sm:block"
            style={{ color: "var(--text-dim)" }}
          >
            video
          </span>
        )}

        {/* Duration */}
        {track.duration && (
          <span className="font-mono-readout shrink-0">
            {formatTime(track.duration)}
          </span>
        )}
      </button>
    </li>
  );
}
