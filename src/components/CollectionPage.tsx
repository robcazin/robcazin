"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Collection } from "@/lib/types";
import TrackRow from "./TrackRow";
import MetaReadout from "./MetaReadout";
import Visualizer from "./player/Visualizer";
import { usePlayer } from "@/contexts/PlayerContext";
import { resolveAccentHex } from "@/lib/utils";
import Footer from "./Footer";
import CollectionAmbientTint from "./CollectionAmbientTint";

interface CollectionPageProps {
  collection: Collection;
}

export default function CollectionPage({ collection }: CollectionPageProps) {
  const { currentTrack, status } = usePlayer();
  // Hover previews until a track is clicked; click pins the detail panel.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const accent = collection.accent ?? "var(--accent)";

  useEffect(() => {
    setPreviewId(null);
    setPinnedId(null);
  }, [collection.slug]);

  const detailId = pinnedId ?? previewId;
  const detailTrack =
    collection.tracks.find((t) => t.id === detailId) ?? null;

  const handlePreview = (id: string) => {
    if (!pinnedId) setPreviewId(id);
  };

  const handlePin = (id: string) => {
    setPinnedId(id);
    setPreviewId(null);
  };

  const accentHex = resolveAccentHex(collection.accent ?? "var(--accent)");
  const showLiveViz =
    detailTrack?.kind === "audio" &&
    currentTrack?.id === detailTrack.id &&
    status === "playing";

  return (
    <>
      <CollectionAmbientTint key={collection.slug} accent={collection.accent} />
      {/* Header */}
      <section
        className="px-6 py-14 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="max-w-5xl mx-auto">
          <Link
            href="/work"
            className="label-caps mb-6 inline-block transition-colors hover:text-[var(--text)]"
            style={{ color: "var(--text-dim)" }}
          >
            ← Work
          </Link>

          {/* Collection accent line */}
          <div
            className="w-10 h-px mb-6"
            style={{ background: accent }}
            aria-hidden
          />

          <h1
            className="text-4xl font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            {collection.title}
          </h1>

          {collection.blurb && (
            <p
              className="text-base leading-relaxed max-w-xl"
              style={{ color: "var(--text-dim)" }}
            >
              {collection.blurb}
            </p>
          )}
        </div>
      </section>

      {/* Tracks + detail panel */}
      <section className="px-6 py-12">
        <div
          className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8"
          onMouseLeave={() => {
            if (!pinnedId) setPreviewId(null);
          }}
        >
          {/* Track list */}
          <div>
            <ul
              className="list-none p-0 m-0"
              style={{ border: "1px solid var(--line)" }}
              aria-label={`${collection.title} tracks`}
            >
              {collection.tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  collection={collection}
                  index={i}
                  detailActive={detailTrack?.id === track.id}
                  pinned={pinnedId === track.id}
                  onPreview={handlePreview}
                  onPin={handlePin}
                />
              ))}
            </ul>

            <p
              className="font-mono-readout mt-4"
              style={{ color: "var(--text-dim)" }}
            >
              {collection.tracks.length} track
              {collection.tracks.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Detail panel */}
          <aside aria-label="Track details">
            {detailTrack ? (
              <div
                className="sticky top-24 p-5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                {/* Live audio visual when this track is playing */}
                {showLiveViz && (
                  <div
                    className="mb-5"
                    style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1rem" }}
                  >
                    <Visualizer accentColor={accentHex} height={72} />
                  </div>
                )}

                {/* Video preview */}
                {detailTrack.kind === "video" && detailTrack.src && (
                  <div className="mb-5 aspect-video bg-black overflow-hidden">
                    <video
                      src={detailTrack.src}
                      controls
                      className="w-full h-full object-cover"
                      aria-label={`Video: ${detailTrack.title}`}
                    />
                  </div>
                )}

                {/* Poster image */}
                {detailTrack.poster && detailTrack.kind === "audio" && (
                  <div className="mb-5 aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailTrack.poster}
                      alt={detailTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p
                  className="label-caps mb-1"
                  style={{ color: "var(--text-dim)" }}
                >
                  {collection.title}
                </p>
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{ color: "var(--text)" }}
                >
                  {detailTrack.title}
                </h2>

                {detailTrack.notes && (
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {detailTrack.notes}
                  </p>
                )}

                <MetaReadout track={detailTrack} />
              </div>
            ) : (
              <div
                className="p-5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--text-dim)",
                }}
              >
                <p className="text-sm">
                  {pinnedId
                    ? "Click another track to change details."
                    : "Hover a track for details — click to keep."}
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Footer />
    </>
  );
}
