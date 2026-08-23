import type { SlideRef } from "../types";
import { EmptyState } from "./NotesView";

export default function SlidesView({ slides, pdfUrl }: { slides: SlideRef[]; pdfUrl?: string }) {
  if (slides.length === 0 && !pdfUrl) {
    return <EmptyState message="No slide references logged for this week." />;
  }

  return (
    <div>
      {pdfUrl && (
        <div
          className="rounded-lg border overflow-hidden mb-8"
          style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            <span className="text-sm font-medium">Lecture deck</span>
            <div className="flex gap-4">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded text-sm"
                style={{ color: "var(--color-accent)" }}
              >
                Open in new tab
              </a>
              <a
                href={pdfUrl}
                download
                className="focus-ring rounded text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Download
              </a>
            </div>
          </div>
          <iframe
            src={pdfUrl}
            title="Lecture slides PDF"
            className="w-full"
            style={{ height: "70vh", border: "none", background: "var(--color-surface-2)" }}
          />
        </div>
      )}

      {slides.length > 0 && (
        <ol className="space-y-2.5">
          {slides.map((s, i) => (
            <li
              key={i}
              className="rounded-lg border px-5 py-4"
              style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface)" }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{s.label}</span>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm focus-ring rounded shrink-0"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Open deck →
                  </a>
                )}
              </div>
              {s.note && (
                <p className="text-sm mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  {s.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}