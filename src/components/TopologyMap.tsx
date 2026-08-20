import { useNavigate } from "react-router-dom";
import type { WeekData } from "../types";

interface Props {
  weeks: WeekData[];
  activeWeek?: number;
}

// Lays 8 week-nodes out on a gentle arc, connected by edges — a cluster
// topology diagram doubling as the course's progress tracker. A node is
// "replicated" (filled, quorum-green ring) once its week has content.
export default function TopologyMap({ weeks, activeWeek }: Props) {
  const navigate = useNavigate();
  const n = weeks.length;
  const width = 900;
  const height = 220;
  const radius = 340;
  const cx = width / 2;
  const cy = -140;

  const points = weeks.map((_, i) => {
    const spread = 0.62; // radians of arc used
    const angle = Math.PI / 2 - spread / 2 + (spread * i) / (n - 1);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return { x, y };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto overflow-visible"
      role="img"
      aria-label="Course progress topology: 8 weekly nodes"
    >
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const bothReady = weeks[i].status !== "empty" && weeks[i + 1].status !== "empty";
        return (
          <line
            key={`edge-${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            stroke={bothReady ? "var(--color-signal-dim)" : "var(--color-hairline)"}
            strokeWidth={1.5}
            strokeDasharray={bothReady ? undefined : "4 5"}
          />
        );
      })}

      {points.map((p, i) => {
        const w = weeks[i];
        const isActive = activeWeek === w.week;
        const filled = w.status !== "empty";
        return (
          <g
            key={w.week}
            transform={`translate(${p.x}, ${p.y})`}
            className="cursor-pointer focus-ring"
            tabIndex={0}
            role="button"
            aria-label={`Week ${w.week}: ${w.title}, ${w.status}`}
            onClick={() => navigate(`/week/${w.week}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate(`/week/${w.week}`);
            }}
          >
            {isActive && (
              <circle r={20} fill="none" stroke="var(--color-signal)" strokeWidth={1.5} opacity={0.5} />
            )}
            <circle
              r={14}
              fill={filled ? "var(--color-surface-2)" : "var(--color-ink-soft)"}
              stroke={filled ? "var(--color-quorum)" : "var(--color-hairline-lit)"}
              strokeWidth={filled ? 2 : 1.5}
            />
            <text
              textAnchor="middle"
              dy="0.35em"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fill={filled ? "var(--color-text)" : "var(--color-text-faint)"}
            >
              {w.week}
            </text>
            <text
              textAnchor="middle"
              y={34}
              fontFamily="var(--font-display)"
              fontSize="11"
              fill="var(--color-text-muted)"
            >
              W{w.week}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
