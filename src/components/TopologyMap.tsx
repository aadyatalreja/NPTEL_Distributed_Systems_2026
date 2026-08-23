import { useNavigate } from "react-router-dom";
import type { WeekData } from "../types";

interface Props {
  weeks: WeekData[];
  activeWeek?: number;
}

// A plain, linear progress track: one step per week, in order, with the
// current week's position always obvious. Replaces the old decorative
// cluster diagram with something you can actually scan while studying.
export default function TopologyMap({ weeks, activeWeek }: Props) {
  const navigate = useNavigate();

  return (
    <div
      role="list"
      aria-label="Week progress"
      className="flex items-stretch gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
    >
      {weeks.map((w) => {
        const isActive = activeWeek === w.week;
        const ready = w.status === "ready";
        const inProgress = w.status === "in-progress";

        const dotColor = ready
          ? "var(--color-success)"
          : inProgress
          ? "var(--color-warning)"
          : "var(--color-hairline-lit)";

        return (
          <button
            key={w.week}
            role="listitem"
            onClick={() => navigate(`/week/${w.week}`)}
            className="focus-ring shrink-0 flex flex-col items-center gap-1.5 rounded-md px-2.5 py-2 min-w-[52px] transition-colors"
            style={{
              background: isActive ? "var(--color-accent-soft)" : "transparent",
              border: `1px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
            }}
            aria-current={isActive ? "true" : undefined}
            aria-label={`Week ${w.week}: ${w.title} — ${w.status}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: dotColor }}
            />
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: isActive ? "var(--color-text)" : "var(--color-text-faint)" }}
            >
              {w.week}
            </span>
          </button>
        );
      })}
    </div>
  );
}