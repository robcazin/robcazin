import type { Metadata } from "next";
import { getCollections } from "@/lib/content";
import CollectionGrid from "@/components/CollectionGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Browse Rob Cazin's catalog: generative composition, guitar improvisation, film and theatre scores, and more.",
};

export default function WorkPage() {
  const collections = getCollections();

  return (
    <>
      <section className="px-6 py-16 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="label-caps mb-4" style={{ color: "var(--text-dim)" }}>
            Catalog
          </p>
          <h1
            className="text-4xl font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            Work
          </h1>
          <p
            className="text-base max-w-xl leading-relaxed"
            style={{ color: "var(--text-dim)" }}
          >
            Eight collections spanning generative composition, journeys, film
            music, guitar improvisation, theatre scores, and experimental A/V
            work. Select any collection to browse tracks and play directly
            from the page.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <CollectionGrid collections={collections} />
        </div>
      </section>

      <Footer />
    </>
  );
}
