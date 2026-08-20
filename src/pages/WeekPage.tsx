import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import TopologyMap from "../components/TopologyMap";
import NotesView from "../components/NotesView";
import SlidesView from "../components/SlidesView";
import McqView from "../components/McqView";
import FlashcardView from "../components/FlashcardView";
import { weeks, getWeek } from "../data/weeks";

type Tab = "notes" | "slides" | "mcqs" | "flashcards";

const TABS: { id: Tab; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "slides", label: "Slides" },
  { id: "mcqs", label: "MCQs" },
  { id: "flashcards", label: "Flashcards" },
];

export default function WeekPage() {
  const { weekNum } = useParams();
  const [tab, setTab] = useState<Tab>("notes");
  const week = getWeek(Number(weekNum));

  if (!week) {
    return (
      <Shell>
        <p style={{ color: "var(--color-text-muted)" }}>
          No such week.{" "}
          <Link to="/" className="focus-ring rounded" style={{ color: "var(--color-signal)" }}>
            Back to map
          </Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8">
        <TopologyMap weeks={weeks} activeWeek={week.week} />
      </div>

      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-2"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-signal)" }}
        >
          week {String(week.week).padStart(2, "0")}
        </p>
        <h1 className="font-[var(--font-display)] font-semibold text-3xl">{week.title}</h1>
      </div>

      <div
        className="flex gap-1 mb-8 border-b"
        style={{ borderColor: "var(--color-hairline)" }}
        role="tablist"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const count =
            t.id === "notes"
              ? week.notes.length
              : t.id === "slides"
              ? week.slides.length
              : t.id === "mcqs"
              ? week.mcqs.length
              : week.flashcards.length;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className="focus-ring px-4 py-2.5 text-sm font-[var(--font-display)] font-medium relative -mb-px"
              style={{
                color: active ? "var(--color-text)" : "var(--color-text-faint)",
                borderBottom: active ? "2px solid var(--color-signal)" : "2px solid transparent",
              }}
            >
              {t.label}
              {count > 0 && (
                <span
                  className="ml-1.5 text-xs"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "notes" && <NotesView notes={week.notes} />}
        {tab === "slides" && <SlidesView slides={week.slides} />}
        {tab === "mcqs" && <McqView mcqs={week.mcqs} />}
        {tab === "flashcards" && <FlashcardView cards={week.flashcards} />}
      </div>
    </Shell>
  );
}
