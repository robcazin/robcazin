import type { Track } from "@/lib/types";

interface MetaReadoutProps {
  track: Track;
  className?: string;
}

const isUrl = (s: string) => /^https?:\/\//.test(s);

export default function MetaReadout({ track, className = "" }: MetaReadoutProps) {
  const { meta, year, credits } = track;
  if (!meta && !year && !credits) return null;

  const formatValue = (v: unknown): string => {
    if (typeof v === "boolean") return v ? "yes" : "no";
    return String(v);
  };

  const rows: Array<[string, string]> = [];

  if (year) rows.push(["year", String(year)]);

  // `meta` is freeform — render every key/value in authoring order.
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      if (v !== undefined && v !== null) {
        rows.push([k, formatValue(v)]);
      }
    }
  }

  return (
    <dl className={`font-mono-readout grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 ${className}`}>
      {rows.map(([key, val]) => (
        <div key={key} className="contents">
          <dt style={{ color: "var(--text-dim)" }}>{key}</dt>
          <dd>
            {isUrl(val) ? (
              <a
                href={val}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition-colors hover:text-[var(--text)]"
              >
                {key === "imdb" ? "view on IMDb" : "link"}
                <span aria-hidden="true"> ↗</span>
              </a>
            ) : (
              val
            )}
          </dd>
        </div>
      ))}
      {credits && (
        <div className="col-span-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--line)" }}>
          <p style={{ color: "var(--text-dim)", fontFamily: "inherit" }}>{credits}</p>
        </div>
      )}
    </dl>
  );
}
