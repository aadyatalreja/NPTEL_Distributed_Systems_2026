import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ borderColor: "var(--color-hairline)", background: "color-mix(in srgb, var(--color-bg) 88%, transparent)" }}
      >
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="focus-ring rounded font-semibold tracking-tight text-[15px]">
            Distributed Systems
          </Link>
          <div className="flex items-center gap-4">
            <span
              className="text-xs hidden sm:inline"
              style={{ color: "var(--color-text-faint)" }}
            >
              NPTEL revision notes
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">{children}</main>

      <footer className="border-t" style={{ borderColor: "var(--color-hairline)" }}>
        <div
          className="max-w-3xl mx-auto px-6 py-5 text-xs"
          style={{ color: "var(--color-text-faint)" }}
        >
          A self-hosted study companion &middot; nothing you do here leaves your browser
        </div>
      </footer>
    </div>
  );
}