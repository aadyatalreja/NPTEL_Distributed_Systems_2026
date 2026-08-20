import type { SlideRef } from "../types";
import { EmptyState } from "./NotesView";

export default function SlidesView({ slides }: { slides: SlideRef[] }) {
  if (slides.length === 0) {
    return <EmptyState message="No slide references logged for this week." />;
  }
  return (
    <ol className="space-y-3">
      {slides.map((s, i) => (
        <li
          key={i}
          className="rounded-lg border px-5 py-4"
          style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface)" }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-[var(--font-display)] font-medium">{s.label}</span>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs focus-ring rounded"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-signal)" }}
              >
                open deck →
              </a>
            )}
          </div>
          {s.note && (
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              {s.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
