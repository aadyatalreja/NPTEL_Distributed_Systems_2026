import ReactMarkdown from "react-markdown";
import type { NoteSection } from "../types";

export default function NotesView({ notes }: { notes: NoteSection[] }) {
  if (notes.length === 0) {
    return <EmptyState message="No notes yet for this week." />;
  }
  return (
    <div className="space-y-9">
      {notes.map((section, i) => (
        <section key={i}>
          <h3
            className="font-semibold text-lg mb-3 pb-2 border-b"
            style={{ color: "var(--color-text)", borderColor: "var(--color-hairline)" }}
          >
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
      <p className="text-sm">{message}</p>
    </div>
  );
}