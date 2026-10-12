"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type Report = {
    utilisation: {
        id: number;
        name: string;
        category: string;
        bookings: number;
        hours: number;
        utilisation: number;
    }[];
    byCategory: { category: string; pending: number; approved: number; rejected: number; cancelled: number }[];
    byHour: { hour: number; bookings: number }[];
    byWeekday: { weekday: number; bookings: number }[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const subscribeNever = () => () => {};

export function AdminReports() {
    // "today" only exists in the browser: false on the server, true after hydration
    const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

    const presets = useMemo(() => {
        if (!mounted) return [];
        const today = new Date();
        return [
            { key: "last", label: "Last 30 days", from: toInput(shiftDays(today, -30)), to: toInput(today) },
            { key: "next", label: "Next 30 days", from: toInput(today), to: toInput(shiftDays(today, 30)) },
            {
                key: "around",
                label: "Around today",
                from: toInput(shiftDays(today, -30)),
                to: toInput(shiftDays(today, 30)),
            },
        ];
    }, [mounted]);

    const [chosen, setChosen] = useState<{ from: string; to: string } | null>(null);
    const around = presets.find((p) => p.key === "around");
    const range = chosen ?? (around ? { from: around.from, to: around.to } : null);

    const [report, setReport] = useState<Report | null>(null);
    const [error, setError] = useState<string | null>(null);

    const from = range?.from;
    const to = range?.to;

    useEffect(() => {
        if (!from || !to) return;
        const controller = new AbortController();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        fetch(`/api/admin/reports?from=${from}&to=${to}&tz=${encodeURIComponent(tz)}`, {
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) {
                    const detail = body.fields ? Object.values(body.fields).flat()[0] : null;
                    throw new Error((detail as string | null) ?? body.error ?? "Could not load the report");
                }
                setReport(body);
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort();
    }, [from, to]);

    // Everything below is derived from the report, never hardcoded.
    const summary = useMemo(() => {
        if (!report) return null;
        const requests = report.byCategory.reduce(
            (sum, c) => sum + c.pending + c.approved + c.rejected + c.cancelled,
            0
        );
        const approved = report.byCategory.reduce((sum, c) => sum + c.approved, 0);
        const hours = report.utilisation.reduce((sum, u) => sum + u.hours, 0);
        const average = report.utilisation.length
            ? report.utilisation.reduce((sum, u) => sum + u.utilisation, 0) / report.utilisation.length
            : 0;
        return {
            requests,
            approved,
            hours: Math.round(hours * 10) / 10,
            average: Math.round(average * 10) / 10,
        };
    }, [report]);

    if (!range) return null;

    const activePreset = presets.find((p) => p.from === range.from && p.to === range.to)?.key ?? null;
    const maxUtil = Math.max(0, ...(report?.utilisation.map((u) => u.utilisation) ?? [0]));
    const hasBookings = report !== null && report.byHour.some((h) => h.bookings > 0);

    const dateInput =
        "h-11 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/15";
    const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <header>
                <p className="font-mono text-sm uppercase tracking-wider text-muted">Admin</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Usage <span className="text-primary">reports</span>
                </h1>
                <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                    See which resources are used, how requests are handled, and when demand peaks.
                </p>
            </header>

            {/* Date range */}
            <section aria-label="Report range" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid grid-cols-2 gap-3 sm:max-w-md lg:w-[28rem]">
                        <label>
                            <span className={label}>From</span>
                            <input
                                type="date"
                                value={range.from}
                                max={range.to}
                                onChange={(e) => e.target.value && setChosen({ from: e.target.value, to: range.to })}
                                className={dateInput}
                            />
                        </label>
                        <label>
                            <span className={label}>To</span>
                            <input
                                type="date"
                                value={range.to}
                                min={range.from}
                                onChange={(e) => e.target.value && setChosen({ from: range.from, to: e.target.value })}
                                className={dateInput}
                            />
                        </label>
                    </div>

                    <div role="group" aria-label="Quick ranges" className="flex flex-wrap gap-2">
                        {presets.map((p) => {
                            const active = activePreset === p.key;
                            return (
                                <button
                                    key={p.key}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setChosen({ from: p.from, to: p.to })}
                                    className={`h-11 rounded-lg border px-4 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] ${
                                        active
                                            ? "border-primary/40 bg-primary-soft text-primary"
                                            : "border-line bg-surface text-ink hover:bg-background"
                                    }`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {error && (
                <p role="alert" className="rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                    {error}
                </p>
            )}

            {report === null && error === null && (
                <div className="space-y-4" aria-hidden>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="skeleton h-[92px]" />
                        ))}
                    </div>
                    <div className="skeleton h-[320px]" />
                    <div className="skeleton h-[220px]" />
                </div>
            )}

            {report !== null && summary !== null && (
                <>
                    {/* Summary */}
                    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Metric label="Requests" value={String(summary.requests)} hint="starting in this range" />
                        <Metric label="Approved" value={String(summary.approved)} hint="of those requests" />
                        <Metric label="Booked hours" value={String(summary.hours)} hint="approved time in range" />
                        <Metric label="Avg. utilisation" value={`${summary.average}%`} hint="across all resources" />
                    </dl>

                    {/* 1. Utilisation */}
                    <section className="rounded-xl border border-line bg-surface">
                        <div className="p-4 pb-3 sm:p-5 sm:pb-3">
                            <h2 className="text-lg font-semibold tracking-tight">Utilisation by resource</h2>
                            <p className="mt-1 text-sm text-muted">
                                Approved hours as a share of every hour in the range. Tiers compare each resource
                                with the busiest one.
                            </p>
                        </div>

                        {maxUtil === 0 ? (
                            <p className="mx-4 mb-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted sm:mx-5 sm:mb-5">
                                No approved bookings overlap this range.
                            </p>
                        ) : (
                            <ul
                                tabIndex={0}
                                aria-label="Utilisation by resource, scrollable"
                                className="max-h-[30rem] divide-y divide-line overflow-y-auto border-t border-line outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                                {report.utilisation.map((u) => {
                                    const ratio = u.utilisation / maxUtil;
                                    const tier = u.utilisation === 0 ? "None" : ratio >= 0.66 ? "High" : ratio >= 0.33 ? "Medium" : "Low";
                                    return (
                                        <li key={u.id} className="px-4 py-3 sm:px-5">
                                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1">
                                                <p className="min-w-0 truncate text-sm">
                                                    <span className="font-medium">{u.name}</span>{" "}
                                                    <span className="text-muted">{u.category}</span>
                                                </p>
                                                <p className="flex items-baseline justify-end gap-3 font-mono text-xs text-muted sm:gap-4">
                                                    <span className="w-16 text-right">{plural(u.bookings, "booking")}</span>
                                                    <span className="w-12 text-right">{u.hours} h</span>
                                                    <span className="w-14 text-right text-sm font-semibold text-ink">
                                                        {u.utilisation}%
                                                    </span>
                                                    <span className="hidden w-16 text-right font-sans text-[11px] font-medium uppercase tracking-wider sm:inline">
                                                        {tier}
                                                    </span>
                                                </p>
                                            </div>
                                            <div
                                                className="mt-2 h-2.5 overflow-hidden rounded-full bg-background"
                                                role="img"
                                                aria-label={`${u.name}: ${u.utilisation}% utilised, ${tier} compared with the busiest resource`}
                                            >
                                                <div
                                                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                                                    style={{ width: `${ratio * 100}%` }}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* 2. Requests by category */}
                    <section className="rounded-xl border border-line bg-surface">
                        <div className="p-4 pb-3 sm:p-5 sm:pb-3">
                            <h2 className="text-lg font-semibold tracking-tight">Requests by category</h2>
                            <p className="mt-1 text-sm text-muted">Bookings that start inside the range.</p>
                        </div>

                        <div className="overflow-x-auto border-t border-line">
                            <table className="w-full min-w-[520px] text-sm">
                                <thead className="bg-background text-left text-xs uppercase tracking-wider text-muted">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">
                                            Category
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                                            Requested
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                                            Approved
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                                            Rejected
                                        </th>
                                        <th scope="col" className="px-3 py-2.5 text-right font-medium">
                                            Cancelled
                                        </th>
                                        <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {report.byCategory.map((c) => {
                                        const total = c.pending + c.approved + c.rejected + c.cancelled;
                                        const cell = (n: number, tone: string) => (
                                            <td className={`px-3 py-3 text-right font-mono ${n === 0 ? "text-muted/60" : tone}`}>
                                                {n}
                                            </td>
                                        );
                                        return (
                                            <tr key={c.category} className="transition-colors hover:bg-background/60">
                                                <th scope="row" className="px-4 py-3 text-left font-medium sm:px-5">
                                                    {c.category}
                                                </th>
                                                {cell(c.pending, "text-pending-ink")}
                                                {cell(c.approved, "text-free-ink")}
                                                {cell(c.rejected, "text-booked-ink")}
                                                {cell(c.cancelled, "text-maintenance-ink")}
                                                <td className="px-4 py-3 text-right font-mono font-semibold sm:px-5">
                                                    {total}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Peak times */}
                    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                        <h2 className="text-lg font-semibold tracking-tight">Peak times</h2>
                        <p className="mt-1 text-sm text-muted">
                            Approved bookings by start time, in your timezone. The busiest bar is darker.
                        </p>

                        {!hasBookings ? (
                            <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                                No approved bookings start in this range.
                            </p>
                        ) : (
                            <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
                                <BarChart
                                    title="By hour of day"
                                    ariaLabel="Approved bookings by start hour"
                                    items={report.byHour.map((h) => ({
                                        label: pad(h.hour),
                                        tickLabel: h.hour % 3 === 0 ? pad(h.hour) : "",
                                        value: h.bookings,
                                        tooltip: `${pad(h.hour)}:00 to ${pad((h.hour + 1) % 24)}:00`,
                                    }))}
                                    peakText={(item) => `Busiest hour: ${item.tooltip}`}
                                />
                                <BarChart
                                    title="By weekday"
                                    ariaLabel="Approved bookings by weekday"
                                    items={report.byWeekday.map((d) => ({
                                        label: WEEKDAYS[d.weekday - 1],
                                        tickLabel: WEEKDAYS[d.weekday - 1],
                                        value: d.bookings,
                                        tooltip: WEEKDAYS_LONG[d.weekday - 1],
                                    }))}
                                    peakText={(item) => `Busiest day: ${item.tooltip}`}
                                />
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-xl border border-line bg-surface p-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-2 font-mono text-3xl font-semibold leading-none tracking-tight">{value}</dd>
            <p className="mt-2 text-xs text-muted">{hint}</p>
        </div>
    );
}

type ChartItem = { label: string; tickLabel: string; value: number; tooltip: string };

/** A bar chart with gridlines, a labelled y-axis and keyboard-focusable bars. */
function BarChart({
    title,
    ariaLabel,
    items,
    peakText,
}: {
    title: string;
    ariaLabel: string;
    items: ChartItem[];
    peakText: (peak: ChartItem) => string;
}) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const peakIndex = items.findIndex((i) => i.value === max);
    const peak = items[peakIndex];
    const mid = Math.round(max / 2);

    return (
        <figure>
            <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold">{title}</span>
                {peak && peak.value > 0 && (
                    <span className="text-xs text-muted">
                        {peakText(peak)} ({plural(peak.value, "booking")})
                    </span>
                )}
            </figcaption>

            <div className="relative h-44 pl-8" role="group" aria-label={ariaLabel}>
                {/* y axis: top, middle, zero */}
                <span className="absolute left-0 top-0 -translate-y-1/2 font-mono text-[10px] text-muted">{max}</span>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">{mid}</span>
                <span className="absolute bottom-0 left-0 translate-y-1/2 font-mono text-[10px] text-muted">0</span>

                {/* gridlines */}
                <div className="pointer-events-none absolute inset-y-0 left-8 right-0">
                    <div className="absolute inset-x-0 top-0 border-t border-line" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                    <div className="absolute inset-x-0 bottom-0 border-t border-line" />
                </div>

                {/* bars */}
                <div className="relative flex h-full items-end gap-1">
                    {items.map((item, index) => (
                        <div
                            key={item.label}
                            tabIndex={0}
                            role="img"
                            aria-label={`${item.tooltip}: ${plural(item.value, "booking")}`}
                            className="group relative flex h-full flex-1 items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            <div
                                className={`w-full rounded-t transition-colors ${
                                    index === peakIndex && item.value > 0
                                        ? "bg-primary"
                                        : "bg-primary/45 group-hover:bg-primary/70 group-focus-visible:bg-primary/70"
                                }`}
                                style={{
                                    height: `${(item.value / max) * 100}%`,
                                    minHeight: item.value > 0 ? 4 : 0,
                                }}
                            />
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                {item.tooltip}: {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* x axis labels */}
            <div className="mt-2 flex gap-1 pl-8 font-mono text-[11px] text-muted">
                {items.map((item) => (
                    <span key={item.label} className="flex-1 text-center">
                        {item.tickLabel}
                    </span>
                ))}
            </div>
        </figure>
    );
}
