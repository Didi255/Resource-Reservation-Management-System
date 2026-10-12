export type TimeWindow = { date: string; from: string; to: string };

const pad = (n: number) => String(n).padStart(2, "0");
const dateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Next full hour, for one hour. Clamped so it never crosses midnight. */
export function defaultWindow(now = new Date()): TimeWindow {
    const start = new Date(now);
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const crossesMidnight = end.getDate() !== start.getDate();
    return {
        date: dateInput(start),
        from: timeInput(start),
        to: crossesMidnight ? "23:59" : timeInput(end),
    };
}

/** Local inputs -> UTC ISO strings, or null if incomplete or end <= start. */
export function toRange(w: TimeWindow): { start: string; end: string } | null {
    if (!w.date || !w.from || !w.to) return null;
    const start = new Date(`${w.date}T${w.from}`);
    const end = new Date(`${w.date}T${w.to}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    if (end <= start) return null;
    return { start: start.toISOString(), end: end.toISOString() };
}
