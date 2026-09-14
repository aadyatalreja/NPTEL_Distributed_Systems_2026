import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import Shell from "../components/Shell";
import TopologyMap from "../components/TopologyMap";
import { weeks } from "../data/weeks";

function statusColor(status: string): string {
  return status === "ready"
    ? "var(--color-success)"
    : status === "in-progress"
    ? "var(--color-warning)"
    : "var(--color-hairline-lit)";
}

export default function Home() {
  const readyCount = weeks.filter((w) => w.status !== "empty").length;

  return (
    <Shell>
      <div
        className="mb-8 text-xs px-3 py-2 rounded-md border"
        style={{
          borderColor: "var(--color-hairline)",
          background: "var(--color-surface-2)",
          color: "var(--color-text-faint)",
        }}
      >
        Disclaimer : For personal revision/studying only. Not affiliated with, endorsed by,
        or officially associated with NPTEL, IITs, or any institution behind
        the course materials referenced here.
      </div>

      <div className="mb-10">
        <p
          className="text-sm mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          {readyCount} of {weeks.length} weeks available
        </p>
        <h1 className="font-semibold text-3xl md:text-4xl leading-tight mb-4 tracking-tight">
          Distributed Systems, one week at a time.
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-xl leading-relaxed">
          Summary notes, slide references, MCQs with worked solutions, and
          flashcard recall drills — built up week by week as the course
          goes.
        </p>
      </div>

      <div className="mb-10">
        <TopologyMap weeks={weeks} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {weeks.map((w) => {
          const tint = statusColor(w.status);
          const label =
            w.status === "ready" ? "Ready" : w.status === "in-progress" ? "In progress" : "Empty";
          return (
            <Link
              key={w.week}
              to={`/week/${w.week}`}
              className="focus-ring glass-card group flex flex-col justify-between gap-3 px-4 py-4 transition-transform duration-150 hover:-translate-y-0.5"
              style={{ "--card-tint": tint } as CSSProperties}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs tabular-nums font-medium"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {String(w.week).padStart(2, "0")}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: tint, boxShadow: `0 0 0 3px color-mix(in srgb, ${tint} 18%, transparent)` }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="font-medium text-sm leading-snug line-clamp-2">{w.title}</p>
                <p
                  className="text-xs mt-1.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  {label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}