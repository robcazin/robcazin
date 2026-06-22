import type { Metadata } from "next";
import AboutTimeline from "@/components/AboutTimeline";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — Rob Cazin",
  description:
    "The story behind Rob Cazin — from a Wurlitzer organ under the furniture to fifty years of image, sound, and machine.",
};

export default function AboutPage() {
  return (
    <>
      <section
        className="px-6 py-14 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="w-10 h-px mb-6"
            style={{ background: "var(--accent)" }}
            aria-hidden
          />
          <h1
            className="text-4xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            About
          </h1>
        </div>
      </section>

      <AboutTimeline />

      <Footer />
    </>
  );
}
