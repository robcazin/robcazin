import Link from "next/link";
import { getCollections } from "@/lib/content";
import CollectionGrid from "@/components/CollectionGrid";
import Footer from "@/components/Footer";

export default function HomePage() {
  const collections = getCollections();
  const featured = collections.slice(0, 3);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative px-6 py-24 sm:py-36 border-b"
        style={{ borderColor: "var(--line)" }}
        aria-labelledby="hero-heading"
      >
        <div className="max-w-3xl mx-auto">
          <p className="label-caps mb-6" style={{ color: "var(--text-dim)" }}>
            Composer · Visual Artist · Musician · Sound Designer
          </p>
          <h1
            id="hero-heading"
            className="text-5xl sm:text-7xl font-semibold leading-none tracking-tight mb-8"
            style={{ color: "var(--text)" }}
          >
            Rob Cazin
          </h1>
          <p
            className="text-lg sm:text-xl leading-relaxed max-w-xl"
            style={{ color: "var(--text-dim)" }}
          >
            Original scores for film, TV, Advertising and theatre. Generative composition.
            Guitar improvisation. Sound design. The work spans from scoring
            shadow puppetry premiering at BAM to sound design for Sundance to physics-informed generative
            audio.
          </p>
          <div className="flex gap-4 mt-10">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80 text-[#A3BCEF] visited:text-[#A3BCEF]"
              style={{ background: "var(--accent)" }}
            >
              Browse Work
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border transition-colors hover:bg-[var(--surface)]"
              style={{ color: "var(--text)", borderColor: "var(--line)" }}
            >
              About
            </Link>
          </div>
        </div>

        {/* Vertical rule decoration */}
        <div
          className="absolute right-12 top-24 hidden lg:block"
          style={{
            width: "1px",
            height: "120px",
            background: "var(--line)",
          }}
          aria-hidden
        />
      </section>

      {/* ── Featured Collections ─────────────────────────────────────── */}
      <section
        className="px-6 py-16"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="flex items-baseline justify-between mb-10"
            style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1rem" }}
          >
            <h2
              id="featured-heading"
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-dim)" }}
            >
              Collections
            </h2>
            <Link
              href="/work"
              className="label-caps transition-colors hover:text-[var(--text)]"
              style={{ color: "var(--text-dim)" }}
            >
              All Collections →
            </Link>
          </div>

          <CollectionGrid collections={featured} />
        </div>
      </section>

      {/* ── Feathers of Fire callout ─────────────────────────────────── */}
      <section
        className="px-6 py-16 border-y"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        aria-labelledby="credit-heading"
      >
        <div className="max-w-3xl mx-auto">
          <p className="label-caps mb-4" style={{ color: "var(--text-dim)" }}>
            Featured Credit
          </p>
          <h2
            id="credit-heading"
            className="text-2xl font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            Feathers of Fire — Sound Design
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-dim)" }}>
            Shadow play adaptation of the Sufi epic <em>Conference of the Birds</em>.
            Premiered San Francisco 01.16.16, opened at BAM 02.05.16. Directed
            by Hamid Rahmanian, puppet &amp; illustration by Syd Fini.
          </p>
          <Link
            href="/work/film-theatre"
            className="label-caps transition-colors hover:text-[var(--text)]"
            style={{ color: "var(--accent)" }}
          >
            View Film &amp; Theatre →
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
