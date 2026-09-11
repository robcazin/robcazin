import Link from "next/link";

const externalLinks = [
  { label: "So! Animation", href: "http://so-animation.com" },
  { label: "Icon Theory", href: "http://www.icontheory.com" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/robcazin",
  },
];

export default function Footer() {
  return (
    <footer
      className="px-6 py-10 mt-16"
      style={{ borderTop: "1px solid var(--line)" }}
      aria-label="Site footer"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p
            className="label-caps mb-1"
            style={{ color: "var(--text-dim)" }}
          >
            Rob Cazin
          </p>
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>
            Composer · Visual Artist · Musician · Sound Designer
          </p>
        </div>

        <nav aria-label="External links">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 list-none p-0 m-0">
            {externalLinks.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-caps transition-colors hover:text-[var(--text)]"
                  style={{ color: "var(--text-dim)" }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p
          className="font-mono-readout"
          style={{ color: "var(--text-dim)" }}
        >
          © {new Date().getFullYear()} Rob Cazin
        </p>
      </div>
    </footer>
  );
}
