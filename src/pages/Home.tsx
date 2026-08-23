import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import TopologyMap from "../components/TopologyMap";
import { weeks } from "../data/weeks";

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

      <div className="border-t" style={{ borderColor: "var(--color-hairline)" }}>
        {weeks.map((w) => (
          <Link
            key={w.week}
            to={`/week/${w.week}`}
            className="focus-ring group flex items-center justify-between gap-4 py-4 border-b transition-colors hover:bg-[var(--color-surface-2)] px-2 -mx-2 rounded-md"
            style={{ borderColor: "var(--color-hairline)" }}
          >
            <div className="flex items-baseline gap-4 min-w-0">
              <span
                className="text-sm tabular-nums shrink-0"
                style={{ color: "var(--color-text-faint)" }}
              >
                {String(w.week).padStart(2, "0")}
              </span>
              <span className="font-medium truncate">{w.title}</span>
            </div>
            <StatusTag status={w.status} />
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function StatusTag({ status }: { status: string }) {
  const color =
    status === "ready"
      ? "var(--color-success)"
      : status === "in-progress"
      ? "var(--color-warning)"
      : "var(--color-text-faint)";
  const label = status === "ready" ? "Ready" : status === "in-progress" ? "In progress" : "Empty";
  return (
    <span
      className="text-xs shrink-0 flex items-center gap-1.5"
      style={{ color: "var(--color-text-faint)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}