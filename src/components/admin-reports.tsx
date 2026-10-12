"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Donut, Heatmap, Legend, StackedBar, type Segment } from "@/components/report-charts";

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
    heatmap: { weekday: number; hour: number; bookings: number }[];
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// One muted colour per category. Order follows the alphabetical category list.
const PALETTE = ["#2563eb", "#0d9488", "#7c3aed", "#d97706", "#db2777", "#64748b", "#0891b2", "#65a30d"];

// The same colours the rest of the app uses for these statuses.
const STATUS_COLOR = {
    pending: "#d97706",
    approved: "#16a34a",
    rejected: "#dc2626",
    cancelled: "#94a3b8",
} as const;

const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const subscribeNever = () => () => {};

const TABS = [
    { key: "utilisation", label: "Utilisation" },
    { key: "requests", label: "Requests by category" },
    { key: "peak", label: "Peak times" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
    const [tab, setTab] = useState<TabKey>("utilisation");
    const [showAll, setShowAll] = useState(false);

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
    const derived = useMemo(() => {
        if (!report) return null;

        const categories = report.byCategory.map((c) => c.category);
        const colorOf = (category: string) => PALETTE[Math.max(0, categories.indexOf(category)) % PALETTE.length];

        const requests = report.byCategory.reduce(
            (sum, c) => sum + c.pending + c.approved + c.rejected + c.cancelled,
            0
        );
        const approved = report.byCategory.reduce((sum, c) => sum + c.approved, 0);
        const hours = report.utilisation.reduce((sum, u) => sum + u.hours, 0);
        const average = report.utilisation.length
            ? report.utilisation.reduce((sum, u) => sum + u.utilisation, 0) / report.utilisation.length
            : 0;

        const hoursByCategory: Segment[] = categories.map((category) => ({
            label: category,
            value: Math.round(
                report.utilisation.filter((u) => u.category === category).reduce((s, u) => s + u.hours, 0) * 10
            ) / 10,
            color: colorOf(category),
        }));

        const statusMix: Segment[] = [
            { label: "Requested", value: report.byCategory.reduce((s, c) => s + c.pending, 0), color: STATUS_COLOR.pending },
            { label: "Approved", value: approved, color: STATUS_COLOR.approved },
            { label: "Rejected", value: report.byCategory.reduce((s, c) => s + c.rejected, 0), color: STATUS_COLOR.rejected },
            { label: "Cancelled", value: report.byCategory.reduce((s, c) => s + c.cancelled, 0), color: STATUS_COLOR.cancelled },
        ];

        const categoryTotals = report.byCategory.map((c) => c.pending + c.approved + c.rejected + c.cancelled);
        const busiestCell = report.heatmap.reduce<{ weekday: number; hour: number; bookings: number } | null>(
            (best, cell) => (!best || cell.bookings > best.bookings ? cell : best),
            null
        );

        return {
            colorOf,
            summary: {
                requests,
                approved,
                hours: Math.round(hours * 10) / 10,
                // two decimals: with few bookings the average is small, and 0 would hide it
                average: Math.round(average * 100) / 100,
            },
            hoursByCategory,
            statusMix,
            maxCategoryTotal: Math.max(0, ...categoryTotals),
            maxUtil: Math.max(0, ...report.utilisation.map((u) => u.utilisation)),
            hasBookings: report.byHour.some((h) => h.bookings > 0),
            busiestCell,
        };
    }, [report]);

    if (!range) return null;

    const activePreset = presets.find((p) => p.from === range.from && p.to === range.to)?.key ?? null;

    const dateInput =
        "h-11 w-full rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/15";
    const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";
    const card = "rounded-xl border border-line bg-surface";

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
            <section aria-label="Report range" className={`${card} p-4 sm:p-5`}>
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
                </div>
            )}

            {report !== null && derived !== null && (
                <>
                    {/* Summary */}
                    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Metric tone="amber" label="Requests" value={String(derived.summary.requests)} hint="starting in this range" />
                        <Metric tone="green" label="Approved" value={String(derived.summary.approved)} hint="of those requests" />
                        <Metric tone="blue" label="Booked hours" value={String(derived.summary.hours)} hint="approved time in range" />
                        <Metric
                            tone="slate"
                            label="Avg. utilisation"
                            value={`${derived.summary.average}%`}
                            hint="across all resources"
                        />
                    </dl>

                    {/* Tabs: one report at a time */}
                    <div
                        role="tablist"
                        aria-label="Report sections"
                        className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {TABS.map((t, index) => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    role="tab"
                                    id={`tab-${t.key}`}
                                    aria-selected={active}
                                    aria-controls={`panel-${t.key}`}
                                    tabIndex={active ? 0 : -1}
                                    onClick={() => setTab(t.key)}
                                    onKeyDown={(e) => {
                                        const offset = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                                        if (!offset) return;
                                        e.preventDefault();
                                        const next = TABS[(index + offset + TABS.length) % TABS.length];
                                        setTab(next.key);
                                        document.getElementById(`tab-${next.key}`)?.focus();
                                    }}
                                    className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium outline-none transition-colors focus-visible:rounded-t-md focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                        active
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted hover:text-ink"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* 1. Utilisation */}
                    <section
                        role="tabpanel"
                        id="panel-utilisation"
                        aria-labelledby="tab-utilisation"
                        hidden={tab !== "utilisation"}
                        className={card}
                    >
                        {derived.maxUtil === 0 ? (
                            <p className="m-4 rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted sm:m-5">
                                No approved bookings overlap this range.
                            </p>
                        ) : (
                            <>
                                <div className="grid gap-8 p-4 sm:p-5 lg:grid-cols-[auto_1fr]">
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-tight">Booked hours by category</h2>
                                        <p className="mt-1 text-sm text-muted">Where the approved time goes.</p>
                                        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col lg:items-start">
                                            <Donut
                                                segments={derived.hoursByCategory}
                                                centerValue={String(derived.summary.hours)}
                                                centerLabel="booked hours"
                                                ariaLabel={`Booked hours by category, ${derived.summary.hours} hours in total`}
                                            />
                                            <div className="w-full min-w-[12rem] sm:w-auto lg:w-full">
                                                <Legend segments={derived.hoursByCategory} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold tracking-tight">Busiest resources</h2>
                                        <p className="mt-1 text-sm text-muted">
                                            Share of the range each one is booked for.
                                        </p>
                                        <ol className="mt-4 space-y-4">
                                            {report.utilisation
                                                .filter((u) => u.utilisation > 0)
                                                .slice(0, 5)
                                                .map((u, index) => (
                                                    <li key={u.id}>
                                                        <div className="flex items-baseline justify-between gap-3">
                                                            <p className="flex min-w-0 items-baseline gap-2 text-sm">
                                                                <span className="font-mono text-xs text-muted">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="truncate font-medium">{u.name}</span>
                                                            </p>
                                                            <p className="shrink-0 font-mono text-sm font-semibold">
                                                                {u.utilisation}%
                                                            </p>
                                                        </div>
                                                        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-background">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${(u.utilisation / derived.maxUtil) * 100}%`,
                                                                    backgroundColor: derived.colorOf(u.category),
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted">
                                                            {u.category} · {plural(u.bookings, "booking")} · {u.hours} h
                                                        </p>
                                                    </li>
                                                ))}
                                        </ol>
                                    </div>
                                </div>

                                <div className="border-t border-line">
                                    <h3 className="px-4 pt-4 text-sm font-semibold sm:px-5">All resources</h3>
                                    <ul className="mt-2 divide-y divide-line">
                                        {(showAll ? report.utilisation : report.utilisation.slice(0, 8)).map((u) => {
                                            const ratio = derived.maxUtil > 0 ? u.utilisation / derived.maxUtil : 0;
                                            const tier =
                                                u.utilisation === 0 ? "None" : ratio >= 0.66 ? "High" : ratio >= 0.33 ? "Medium" : "Low";
                                            return (
                                                <li key={u.id} className="px-4 py-2.5 sm:px-5">
                                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
                                                        <p className="flex min-w-0 items-center gap-2 text-sm">
                                                            <span
                                                                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                                                style={{ backgroundColor: derived.colorOf(u.category) }}
                                                            />
                                                            <span className="truncate font-medium">{u.name}</span>
                                                            <span className="hidden truncate text-muted sm:inline">
                                                                {u.category}
                                                            </span>
                                                        </p>
                                                        <p className="flex items-baseline gap-3 font-mono text-xs text-muted sm:gap-4">
                                                            <span className="hidden w-20 text-right sm:inline">
                                                                {plural(u.bookings, "booking")}
                                                            </span>
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
                                                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background"
                                                        role="img"
                                                        aria-label={`${u.name}: ${u.utilisation}% utilised, ${tier} compared with the busiest resource`}
                                                    >
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${ratio * 100}%`,
                                                                backgroundColor: derived.colorOf(u.category),
                                                            }}
                                                        />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {report.utilisation.length > 8 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAll((v) => !v)}
                                            className="m-4 h-10 rounded-lg border border-line px-4 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 sm:mx-5"
                                        >
                                            {showAll ? "Show fewer" : `Show all ${report.utilisation.length} resources`}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </section>

                    {/* 2. Requests by category */}
                    <section
                        role="tabpanel"
                        id="panel-requests"
                        aria-labelledby="tab-requests"
                        hidden={tab !== "requests"}
                        className={card}
                    >
                        <div className="grid gap-8 p-4 sm:p-5 lg:grid-cols-[auto_1fr]">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Status mix</h2>
                                <p className="mt-1 text-sm text-muted">How requests ended up in this range.</p>
                                <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col lg:items-start">
                                    <Donut
                                        segments={derived.statusMix}
                                        centerValue={String(derived.summary.requests)}
                                        centerLabel="requests"
                                        ariaLabel={`Requests by status, ${derived.summary.requests} in total`}
                                    />
                                    <div className="w-full min-w-[12rem] sm:w-auto lg:w-full">
                                        <Legend segments={derived.statusMix} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">By category</h2>
                                <p className="mt-1 text-sm text-muted">
                                    Bar length compares categories. Colours show how each request ended.
                                </p>
                                <ul className="mt-4 space-y-4">
                                    {report.byCategory.map((c) => {
                                        const total = c.pending + c.approved + c.rejected + c.cancelled;
                                        return (
                                            <li key={c.category}>
                                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                                    <span className="flex items-center gap-2 font-medium">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-sm"
                                                            style={{ backgroundColor: derived.colorOf(c.category) }}
                                                        />
                                                        {c.category}
                                                    </span>
                                                    <span className="font-mono text-xs text-muted">
                                                        {plural(total, "request")}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5">
                                                    <StackedBar
                                                        scale={derived.maxCategoryTotal}
                                                        segments={[
                                                            { label: "Requested", value: c.pending, color: STATUS_COLOR.pending },
                                                            { label: "Approved", value: c.approved, color: STATUS_COLOR.approved },
                                                            { label: "Rejected", value: c.rejected, color: STATUS_COLOR.rejected },
                                                            { label: "Cancelled", value: c.cancelled, color: STATUS_COLOR.cancelled },
                                                        ]}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        <div className="overflow-x-auto border-t border-line">
                            <table className="w-full min-w-[520px] text-sm">
                                <caption className="sr-only">Requests by category and status</caption>
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
                    <section
                        role="tabpanel"
                        id="panel-peak"
                        aria-labelledby="tab-peak"
                        hidden={tab !== "peak"}
                        className={`${card} p-4 sm:p-5`}
                    >
                        {!derived.hasBookings ? (
                            <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                                No approved bookings start in this range.
                            </p>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-tight">When demand peaks</h2>
                                            <p className="mt-1 text-sm text-muted">
                                                Approved bookings by weekday and start hour, in your timezone.
                                            </p>
                                        </div>
                                        {derived.busiestCell && (
                                            <p className="rounded-md bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-hover">
                                                Busiest: {WEEKDAYS_LONG[derived.busiestCell.weekday - 1]},{" "}
                                                {pad(derived.busiestCell.hour)}:00 (
                                                {plural(derived.busiestCell.bookings, "booking")})
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 overflow-x-auto pb-1">
                                        <div className="min-w-[560px]">
                                            <Heatmap cells={report.heatmap} weekdayLabels={WEEKDAYS} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-8 border-t border-line pt-6 lg:grid-cols-[3fr_2fr]">
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
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

// Soft tints that reuse the status colours: amber = requested, green = approved.
const TONES = {
    amber: "border-pending-ink/15 bg-pending-soft text-pending-ink",
    green: "border-free-ink/15 bg-free-soft text-free-ink",
    blue: "border-primary/15 bg-primary-soft text-primary-hover",
    slate: "border-maintenance-ink/15 bg-maintenance-soft text-maintenance-ink",
} as const;

function Metric({
    label,
    value,
    hint,
    tone,
}: {
    label: string;
    value: string;
    hint: string;
    tone: keyof typeof TONES;
}) {
    return (
        <div className={`rounded-xl border p-4 ${TONES[tone]}`}>
            <dt className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</dt>
            <dd className="mt-2 font-mono text-3xl font-semibold leading-none tracking-tight">{value}</dd>
            <p className="mt-2 text-xs opacity-80">{hint}</p>
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
                <span className="absolute left-0 top-0 -translate-y-1/2 font-mono text-[10px] text-muted">{max}</span>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted">{mid}</span>
                <span className="absolute bottom-0 left-0 translate-y-1/2 font-mono text-[10px] text-muted">0</span>

                <div className="pointer-events-none absolute inset-y-0 left-8 right-0">
                    <div className="absolute inset-x-0 top-0 border-t border-line" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                    <div className="absolute inset-x-0 bottom-0 border-t border-line" />
                </div>

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
