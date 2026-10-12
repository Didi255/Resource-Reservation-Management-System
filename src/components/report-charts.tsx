// Small, dependency-free charts for the reports page. They render whatever numbers they are
// given and never invent data.

export type Segment = { label: string; value: number; color: string };

/** A ring split into segments, with a headline number in the middle. */
export function Donut({
    segments,
    centerValue,
    centerLabel,
    ariaLabel,
    size = 172,
}: {
    segments: Segment[];
    centerValue: string;
    centerLabel: string;
    ariaLabel: string;
    size?: number;
}) {
    const stroke = 26;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const middle = size / 2;

    let offset = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel}>
            <circle
                cx={middle}
                cy={middle}
                r={radius}
                fill="none"
                stroke="var(--color-background)"
                strokeWidth={stroke}
            />
            {total > 0 &&
                segments
                    .filter((s) => s.value > 0)
                    .map((s) => {
                        const length = (s.value / total) * circumference;
                        const circle = (
                            <circle
                                key={s.label}
                                cx={middle}
                                cy={middle}
                                r={radius}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={stroke}
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={-offset}
                                transform={`rotate(-90 ${middle} ${middle})`}
                            >
                                <title>{`${s.label}: ${s.value}`}</title>
                            </circle>
                        );
                        offset += length;
                        return circle;
                    })}
            <text
                x={middle}
                y={middle}
                textAnchor="middle"
                dy="-0.05em"
                className="fill-ink font-mono text-[26px] font-semibold"
            >
                {centerValue}
            </text>
            <text x={middle} y={middle} textAnchor="middle" dy="1.6em" className="fill-muted text-[11px]">
                {centerLabel}
            </text>
        </svg>
    );
}

/** The key for a chart: a colour dot, a name, its value and its share. */
export function Legend({ segments }: { segments: Segment[] }) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);

    return (
        <ul className="space-y-1.5 text-sm">
            {segments.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    <span className="font-mono text-xs text-muted">
                        {s.value}
                        {total > 0 && ` · ${Math.round((s.value / total) * 100)}%`}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** One horizontal bar split into proportional segments. `scale` is the full-width value. */
export function StackedBar({ segments, scale }: { segments: Segment[]; scale: number }) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const width = scale > 0 ? (total / scale) * 100 : 0;

    return (
        <div className="h-3 overflow-hidden rounded-full bg-background" role="img"
            aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
            <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${width}%` }}>
                {segments
                    .filter((s) => s.value > 0)
                    .map((s) => (
                        <div
                            key={s.label}
                            title={`${s.label}: ${s.value}`}
                            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
                        />
                    ))}
            </div>
        </div>
    );
}

/** Weekday rows by hour columns. Darker means more bookings. */
export function Heatmap({
    cells,
    weekdayLabels,
}: {
    cells: { weekday: number; hour: number; bookings: number }[];
    weekdayLabels: string[];
}) {
    const grid = new Map<string, number>();
    for (const cell of cells) grid.set(`${cell.weekday}-${cell.hour}`, cell.bookings);
    const max = Math.max(1, ...cells.map((c) => c.bookings));

    return (
        <div>
            <div
                className="grid items-center gap-[3px]"
                style={{ gridTemplateColumns: "2.25rem repeat(24, minmax(0, 1fr))" }}
                role="img"
                aria-label="Heatmap of approved bookings by weekday and hour"
            >
                {/* hour labels */}
                <span />
                {Array.from({ length: 24 }, (_, hour) => (
                    <span key={hour} className="text-center font-mono text-[10px] text-muted">
                        {hour % 3 === 0 ? hour : ""}
                    </span>
                ))}

                {weekdayLabels.map((day, index) => (
                    <Row key={day} label={day} weekday={index + 1} grid={grid} max={max} />
                ))}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted">
                Fewer
                <span className="flex gap-[3px]">
                    {[0.15, 0.4, 0.65, 0.9].map((alpha) => (
                        <span
                            key={alpha}
                            className="h-3 w-5 rounded-[3px]"
                            style={{ backgroundColor: `rgb(37 99 235 / ${alpha})` }}
                        />
                    ))}
                </span>
                More
            </div>
        </div>
    );
}

function Row({
    label,
    weekday,
    grid,
    max,
}: {
    label: string;
    weekday: number;
    grid: Map<string, number>;
    max: number;
}) {
    return (
        <>
            <span className="text-xs text-muted">{label}</span>
            {Array.from({ length: 24 }, (_, hour) => {
                const value = grid.get(`${weekday}-${hour}`) ?? 0;
                return (
                    <span
                        key={hour}
                        title={`${label} ${String(hour).padStart(2, "0")}:00, ${value} booking${value === 1 ? "" : "s"}`}
                        className="h-6 rounded-[3px] bg-background sm:h-7"
                        style={value > 0 ? { backgroundColor: `rgb(37 99 235 / ${0.15 + 0.85 * (value / max)})` } : undefined}
                    />
                );
            })}
        </>
    );
}
