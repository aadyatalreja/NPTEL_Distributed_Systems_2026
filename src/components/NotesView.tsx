import ReactMarkdown from "react-markdown";
import type { NoteSection } from "../types";

export default function NotesView({ notes }: { notes: NoteSection[] }) {
  if (notes.length === 0) {
    return <EmptyState message="No notes yet for this week." />;
  }
  return (
    <div className="space-y-10">
      {notes.map((section, i) => (
        <section key={i}>
          <h3
            className="font-[var(--font-display)] font-semibold text-lg mb-3 flex items-center gap-2"
            style={{ color: "var(--color-text)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--color-signal)" }}
            />
            {section.heading}
          </h3>
          <div className="prose-notes leading-relaxed" style={{ color: "var(--color-text)" }}>
            <ReactMarkdown>{section.body}</ReactMarkdown>
          </div>
        </section>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-dashed px-6 py-12 text-center"
      style={{ borderColor: "var(--color-hairline)", color: "var(--color-text-faint)" }}
    >
      <p style={{ fontFamily: "var(--font-mono)" }} className="text-sm">
        {message}
      </p>
    </div>
  );
}
