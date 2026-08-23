import { useMemo, useState } from "react";
import type { Flashcard } from "../types";
import { EmptyState } from "./NotesView";

export default function FlashcardView({ cards }: { cards: Flashcard[] }) {
  const [order, setOrder] = useState(() => cards.map((c) => c.id));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<Set<string>>(new Set());

  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  if (cards.length === 0) {
    return <EmptyState message="No flashcards yet for this week." />;
  }

  const currentId = order[i % order.length];
  const card = byId[currentId];
  const done = i >= order.length;

  const advance = (bucket: "known" | "review") => {
    if (bucket === "known") setKnown((s) => new Set(s).add(currentId));
    else setReview((s) => new Set(s).add(currentId));
    setFlipped(false);
    setI((n) => n + 1);
  };

  const restart = (onlyReview: boolean) => {
    const pool = onlyReview ? cards.filter((c) => review.has(c.id)) : cards;
    setOrder(shuffle(pool.map((c) => c.id)));
    setKnown(new Set());
    setReview(new Set());
    setI(0);
    setFlipped(false);
  };

  if (done) {
    return (
      <div className="text-center py-16">
        <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
          Deck complete
        </p>
        <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>
          {known.size} known &middot; {review.size} need review
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => restart(false)}
            className="focus-ring rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-hairline)" }}
          >
            Go again
          </button>
          {review.size > 0 && (
            <button
              onClick={() => restart(true)}
              className="focus-ring rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Drill the {review.size} I missed
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 text-sm"
        style={{ color: "var(--color-text-faint)" }}
      >
        <span>
          Card {i + 1} of {order.length}
        </span>
        <span>
          <span style={{ color: "var(--color-success)" }}>{known.size} known</span>
          {"  ·  "}
          <span style={{ color: "var(--color-warning)" }}>{review.size} review</span>
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="focus-ring w-full rounded-xl border px-8 py-16 text-center transition-colors"
        style={{
          borderColor: flipped ? "var(--color-accent)" : "var(--color-hairline)",
          background: "var(--color-surface)",
          minHeight: 220,
        }}
      >
        <p className="text-sm mb-4" style={{ color: "var(--color-text-faint)" }}>
          {flipped ? "Answer" : "Prompt · tap to reveal"}
        </p>
        <p className="text-lg leading-relaxed font-medium">{flipped ? card.back : card.front}</p>
      </button>

      {flipped && (
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={() => advance("review")}
            className="focus-ring rounded-md px-5 py-2.5 text-sm font-medium"
            style={{ border: `1px solid var(--color-danger)`, color: "var(--color-danger)" }}
          >
            Still shaky
          </button>
          <button
            onClick={() => advance("known")}
            className="focus-ring rounded-md px-5 py-2.5 text-sm font-medium"
            style={{ background: "var(--color-success)", color: "white" }}
          >
            Knew it
          </button>
        </div>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}