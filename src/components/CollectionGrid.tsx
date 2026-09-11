import Link from "next/link";
import type { Collection } from "@/lib/types";
import type { CSSProperties } from "react";

interface CollectionGridProps {
  collections: Collection[];
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px list-none p-0 m-0"
        style={{ background: "var(--line)" }}>
      {collections.map((col) => {
        const accent = col.accent ?? "var(--accent)";
        return (
          <li key={col.slug} style={{ background: "var(--surface)" }}>
            <Link
              href={`/work/${col.slug}`}
              className="group flex flex-col h-full px-6 py-8 transition-colors hover:bg-[color-mix(in_srgb,var(--col-accent)_28%,var(--bg))]"
              style={{ "--col-accent": accent } as CSSProperties}
              aria-label={`View ${col.title} collection`}
            >
              {/* Accent rule */}
              <div
                className="w-8 h-px mb-6 transition-all group-hover:w-16"
                style={{ background: accent }}
              />

              <h2
                className="text-lg font-semibold mb-3 transition-colors"
                style={{ color: "var(--text)" }}
              >
                {col.title}
              </h2>

              {col.blurb && (
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ color: "var(--text-dim)" }}
                >
                  {col.blurb}
                </p>
              )}

              <div className="flex items-center justify-between mt-6">
                <span
                  className="font-mono-readout"
                  style={{ color: "var(--text-dim)" }}
                >
                  {col.tracks.length} track{col.tracks.length !== 1 ? "s" : ""}
                </span>
                <span
                  className="label-caps transition-colors group-hover:text-[var(--text)]"
                  style={{ color: "var(--text-dim)" }}
                >
                  View →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
