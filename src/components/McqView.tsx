import { useMemo, useState } from "react";
import type { Mcq } from "../types";
import { EmptyState } from "./NotesView";

export default function McqView({ mcqs }: { mcqs: Mcq[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const ordered = useMemo(() => {
    if (shuffleSeed === 0) return mcqs;
    return [...mcqs].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcqs, shuffleSeed]);

  if (mcqs.length === 0) {
    return <EmptyState message="No MCQs yet for this week." />;
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = mcqs.filter((q) => answers[q.id] === q.correctIndex).length;

  const reset = () => setAnswers({});

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 rounded-lg border px-5 py-3"
        style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface)" }}
      >
        <span
          className="text-sm"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
        >
          score: <span style={{ color: "var(--color-quorum)" }}>{correctCount}</span>
          {" / "}
          {answeredCount} answered &middot; {mcqs.length} total
        </span>
        <div className="flex gap-3">
          <button
            onClick={() => setShuffleSeed((s) => s + 1)}
            className="text-xs focus-ring rounded"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-signal)" }}
          >
            shuffle
          </button>
          <button
            onClick={reset}
            className="text-xs focus-ring rounded"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
          >
            reset
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {ordered.map((q, i) => (
          <McqCard
            key={q.id}
            index={i + 1}
            mcq={q}
            selected={answers[q.id]}
            onSelect={(idx) => setAnswers((a) => ({ ...a, [q.id]: idx }))}
          />
        ))}
      </div>
    </div>
  );
}

function McqCard({
  index,
  mcq,
  selected,
  onSelect,
}: {
  index: number;
  mcq: Mcq;
  selected?: number;
  onSelect: (idx: number) => void;
}) {
  const answered = selected !== undefined;

  return (
    <div
      className="rounded-lg border px-5 py-5"
      style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface)" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className="text-xs mt-1 shrink-0"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
        >
          Q{index}
        </span>
        <p className="font-medium leading-snug">{mcq.question}</p>
      </div>

      <div className="space-y-2">
        {mcq.options.map((opt, idx) => {
          const isCorrect = idx === mcq.correctIndex;
          const isSelected = idx === selected;
          let border = "var(--color-hairline)";
          let bg = "transparent";
          if (answered && isCorrect) {
            border = "var(--color-quorum)";
            bg = "color-mix(in srgb, var(--color-quorum) 12%, transparent)";
          } else if (answered && isSelected && !isCorrect) {
            border = "var(--color-partition)";
            bg = "color-mix(in srgb, var(--color-partition) 12%, transparent)";
          }
          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => onSelect(idx)}
              className="focus-ring w-full text-left rounded-md border px-4 py-2.5 text-sm transition-colors disabled:cursor-default"
              style={{ borderColor: border, background: bg }}
            >
              <span
                className="inline-block w-5"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="mt-4 rounded-md px-4 py-3 text-sm leading-relaxed"
          style={{
            background: "var(--color-ink-soft)",
            color: "var(--color-text-muted)",
            borderLeft: `2px solid ${
              selected === mcq.correctIndex ? "var(--color-quorum)" : "var(--color-partition)"
            }`,
          }}
        >
          <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
            {selected === mcq.correctIndex ? "Correct. " : "Not quite. "}
          </span>
          {mcq.explanation}
        </div>
      )}
    </div>
  );
}
