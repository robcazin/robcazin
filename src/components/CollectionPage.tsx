"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Collection } from "@/lib/types";
import TrackRow from "./TrackRow";
import MetaReadout from "./MetaReadout";
import Visualizer from "./player/Visualizer";
import ExpandedVisualizerPanel, {
  ExpandVisualizerIcon,
} from "./player/ExpandedVisualizerPanel";
import { usePlayer } from "@/contexts/PlayerContext";
import { resolveAccentHex } from "@/lib/utils";
import Footer from "./Footer";
import CollectionAmbientTint from "./CollectionAmbientTint";

interface CollectionPageProps {
  collection: Collection;
}

export default function CollectionPage({ collection }: CollectionPageProps) {
  const { currentTrack } = usePlayer();
  // Hover previews until a track is clicked; click pins when nothing is playing.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [vizExpanded, setVizExpanded] = useState(false);
  const accent = collection.accent ?? "var(--accent)";

  const trackIds = collection.tracks.map((t) => t.id);

  useEffect(() => {
    setPreviewId(null);
    setPinnedId(null);
    setVizExpanded(false);
  }, [collection.slug]);

  // While this collection is playing, detail always follows the current track.
  const playingInCollection =
    currentTrack && trackIds.includes(currentTrack.id)
      ? currentTrack.id
      : null;

  const detailId = playingInCollection ?? pinnedId ?? previewId;
  const detailTrack =
    collection.tracks.find((t) => t.id === detailId) ?? null;

  const handlePreview = (id: string) => {
    if (!playingInCollection && !pinnedId) setPreviewId(id);
  };

  const handlePin = (id: string) => {
    setPinnedId(id);
    setPreviewId(null);
  };

  const accentHex = resolveAccentHex(collection.accent ?? "var(--accent)");
  const showDetailViz = detailTrack?.kind === "audio";

  const hasDetailMedia =
    detailTrack &&
    (showDetailViz ||
      (detailTrack.kind === "video" && !!detailTrack.src) ||
      (!!detailTrack.poster && detailTrack.kind === "audio"));

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
          className="max-w-5xl mx-auto xl:max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] gap-8 lg:gap-6 xl:gap-8"
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

          {/* Detail panel — grows right on xl; scrolls internally when tall */}
          <aside aria-label="Track details" className="min-w-0">
            {detailTrack ? (
              <div
                className="sticky top-24 p-5 max-h-[calc(100vh-var(--player-h)-7rem)] overflow-y-auto"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  className={`grid gap-4 xl:gap-6 ${
                    hasDetailMedia
                      ? "grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)]"
                      : "grid-cols-1"
                  }`}
                >
                  {/* Left: visual / video / poster */}
                  {hasDetailMedia && (
                  <div className="min-w-0">
                    {showDetailViz && (
                      <div className="relative mb-4 sm:mb-0">
                        <div className="mx-auto w-full max-w-[11rem] min-h-[11rem] aspect-square">
                          {!vizExpanded && (
                            <Visualizer
                              accentColor={accentHex}
                              height="fill"
                              collectionSlug={collection.slug}
                              trackMeta={detailTrack.meta}
                              surface="panel"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setVizExpanded(true)}
                          className="absolute bottom-1.5 right-1.5 p-1.5 rounded-sm transition-colors hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{
                            color: "var(--text-dim)",
                            outlineColor: accent,
                          }}
                          aria-label="Expand visualizer"
                        >
                          <ExpandVisualizerIcon />
                        </button>
                      </div>
                    )}

                    {detailTrack.kind === "video" && detailTrack.src && (
                      <div className="aspect-video bg-black overflow-hidden sm:aspect-square sm:max-h-[9.5rem]">
                        <video
                          src={detailTrack.src}
                          controls
                          className="w-full h-full object-cover"
                          aria-label={`Video: ${detailTrack.title}`}
                        />
                      </div>
                    )}

                    {detailTrack.poster && detailTrack.kind === "audio" && (
                      <div className="aspect-square max-w-[9.5rem] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detailTrack.poster}
                          alt={detailTrack.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  )}

                  {/* Right: title, notes, meta */}
                  <div className="min-w-0">
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
                </div>
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

      {detailTrack?.kind === "audio" && (
        <ExpandedVisualizerPanel
          open={vizExpanded}
          onClose={() => setVizExpanded(false)}
          accentColor={accentHex}
          collectionSlug={collection.slug}
          trackMeta={detailTrack.meta}
        />
      )}
    </>
  );
}
