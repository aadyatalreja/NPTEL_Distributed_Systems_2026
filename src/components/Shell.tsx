import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-hairline)] sticky top-0 z-10 backdrop-blur bg-[var(--color-ink)]/85">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-baseline justify-between">
          <Link to="/" className="focus-ring rounded">
            <span className="font-[var(--font-display)] font-semibold tracking-tight text-lg">
              distributed<span style={{ color: "var(--color-signal)" }}>::</span>systems
            </span>
          </Link>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
          >
            NPTEL &middot; 8-week revision cluster
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>
      <footer className="border-t border-[var(--color-hairline)]">
        <div
          className="max-w-5xl mx-auto px-6 py-4 text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
        >
          local-first &middot; no backend &middot; state lives in your browser
        </div>
      </footer>
    </div>
  );
}
