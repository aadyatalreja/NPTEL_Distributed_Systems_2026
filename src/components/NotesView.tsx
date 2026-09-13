import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CSSProperties } from "react";
import type { NoteSection } from "../types";

// Maps a heading or MCQ/flashcard topic tag (e.g. "Unit 2", "Unit 2 —
// Message Passing Systems") to that unit's accent colour, so cards read
// as belonging to a topic at a glance. Falls back to the neutral accent
// for anything unrecognised or unset.
export function topicTint(label?: string): string {
  const match = label?.match(/Unit\s*([1-4])/i);
  if (match) return `var(--color-topic-l${match[1]})`;
  return "var(--color-accent)";
}

export default function NotesView({ notes }: { notes: NoteSection[] }) {
  if (notes.length === 0) {
    return <EmptyState message="No notes yet for this week." />;
  }
  return (
    <div className="space-y-6">
      {notes.map((section, i) => {
        const highlight = section.heading.trim().startsWith("⭐");
        const tint = highlight ? "var(--color-warning)" : topicTint(section.heading);
        return (
          <section
            key={i}
            className="glass-card px-6 py-6 md:px-7 md:py-7"
            style={{ "--card-tint": tint } as CSSProperties}
          >
            <div className="flex items-center gap-3 mb-5">
              {!highlight && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: tint, boxShadow: `0 0 0 4px color-mix(in srgb, ${tint} 18%, transparent)` }}
                />
              )}
              <h3
                className="font-display font-semibold text-lg md:text-xl tracking-tight"
                style={{ color: highlight ? tint : "var(--color-text)" }}
              >
                {section.heading}
              </h3>
            </div>
            <div className="prose-notes leading-relaxed" style={{ color: "var(--color-text)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-dashed px-6 py-12 text-center"
      style={{ borderColor: "var(--color-hairline)", color: "var(--color-text-faint)" }}
    >
      <p className="text-sm">{message}</p>
    </div>
  );
}