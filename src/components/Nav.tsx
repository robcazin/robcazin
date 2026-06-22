"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
      style={{
        background: "var(--surface)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className="text-sm font-semibold tracking-widest uppercase transition-colors hover:text-[var(--accent)]"
        style={{ color: "var(--text)", letterSpacing: "0.18em" }}
      >
        Rob Cazin
      </Link>

      {/* Nav links */}
      <nav aria-label="Main navigation">
        <ul className="flex items-center gap-6 list-none p-0 m-0">
          {links.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="label-caps transition-colors"
                  style={{
                    color: active ? "var(--text)" : "var(--text-dim)",
                    borderBottom: active ? "1px solid var(--accent)" : "1px solid transparent",
                    paddingBottom: "2px",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
