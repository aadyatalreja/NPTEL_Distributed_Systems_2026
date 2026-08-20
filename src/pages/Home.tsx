import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import TopologyMap from "../components/TopologyMap";
import { weeks } from "../data/weeks";

export default function Home() {
  const readyCount = weeks.filter((w) => w.status !== "empty").length;

  return (
    <Shell>
      <div className="mb-12">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-3"
          style={{ fontFamily: "var(--font-mono)", color: "var(--color-signal)" }}
        >
          cluster status &middot; {readyCount}/8 nodes replicated
        </p>
        <h1
          className="font-[var(--font-display)] font-semibold text-4xl md:text-5xl leading-tight mb-4"
        >
          Distributed Systems,<br />one week at a time.
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-xl leading-relaxed">
          Summary notes, slide references, MCQs with worked solutions, and flashcard
          recall drills — built up week by week as the course goes.
        </p>
      </div>

      <div className="mb-14 py-6">
        <TopologyMap weeks={weeks} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {weeks.map((w) => (
          <Link
            key={w.week}
            to={`/week/${w.week}`}
            className="focus-ring group flex items-center justify-between rounded-lg border px-5 py-4 transition-colors"
            style={{
              borderColor: "var(--color-hairline)",
              background: "var(--color-surface)",
            }}
          >
            <div>
              <div
                className="text-xs mb-1"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
              >
                node {String(w.week).padStart(2, "0")}
              </div>
              <div className="font-[var(--font-display)] font-medium">{w.title}</div>
            </div>
            <StatusDot status={w.status} />
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "ready"
      ? "var(--color-quorum)"
      : status === "in-progress"
      ? "var(--color-amber)"
      : "var(--color-hairline-lit)";
  const label = status === "ready" ? "ready" : status === "in-progress" ? "building" : "empty";
  return (
    <span
      className="text-xs flex items-center gap-2"
      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-faint)" }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
