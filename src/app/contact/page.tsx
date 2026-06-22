import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Rob Cazin.",
};

export default function ContactPage() {
  return (
    <>
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <p className="label-caps mb-4" style={{ color: "var(--text-dim)" }}>
          Contact
        </p>
        <h1
          className="text-4xl font-semibold mb-8"
          style={{ color: "var(--text)" }}
        >
          Get in Touch
        </h1>
        <div style={{ borderBottom: "1px solid var(--line)", marginBottom: "2.5rem" }} />

        <p
          className="text-base leading-relaxed mb-10"
          style={{ color: "var(--text-dim)" }}
        >
          For scoring commissions, sound design projects, licensing, or
          anything else — reach out directly.
        </p>

        {/* Email CTA */}
        <div
          className="p-6 mb-12"
          style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
        >
          <p className="label-caps mb-3" style={{ color: "var(--text-dim)" }}>
            Email
          </p>
          <a
            href="mailto:rob@robcazin.com"
            className="text-xl font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            rob@robcazin.com
          </a>
          {/* NOTE: Rob to confirm canonical address — update the mailto above */}
        </div>

        {/* Optional simple form */}
        <ContactForm />
      </section>

      <Footer />
    </>
  );
}
