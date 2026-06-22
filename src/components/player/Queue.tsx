"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "@/contexts/PlayerContext";
import { formatTime } from "@/lib/utils";

export default function Queue() {
  const {
    queue,
    currentTrack,
    currentCollection,
    isQueueOpen,
    toggleQueue,
    playTrack,
  } = usePlayer();

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed bottom-[var(--player-h)] right-0 w-80 max-h-96 overflow-y-auto z-40"
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--line)",
            borderLeft: "1px solid var(--line)",
          }}
          role="complementary"
          aria-label="Playback queue"
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <span className="label-caps">Up Next</span>
            <button
              onClick={toggleQueue}
              className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              aria-label="Close queue"
            >
              ✕
            </button>
          </div>

          {queue.length === 0 ? (
            <p
              className="px-4 py-6 text-sm"
              style={{ color: "var(--text-dim)" }}
            >
              Queue is empty.
            </p>
          ) : (
            <ul>
              {queue.map((track, i) => (
                <li key={track.id}>
                  <button
                    onClick={() => {
                      if (currentCollection) {
                        playTrack(track, currentCollection);
                      }
                    }}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <span
                      className="font-mono-readout shrink-0 w-5 text-right"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm">{track.title}</span>
                    {track.duration && (
                      <span className="font-mono-readout shrink-0">
                        {formatTime(track.duration)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {currentTrack && (
            <div
              className="px-4 py-3"
              style={{
                borderTop: "1px solid var(--line)",
                color: "var(--text-dim)",
              }}
            >
              <p className="label-caps mb-1">Now Playing</p>
              <p className="text-sm truncate" style={{ color: "var(--text)" }}>
                {currentTrack.title}
              </p>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
