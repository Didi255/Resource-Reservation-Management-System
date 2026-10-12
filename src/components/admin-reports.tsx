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

const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const subscribeNever = () => () => {};

export function AdminReports() {
    // "today" only exists in the browser: false on the server, true after hydration
    const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
    const initial = useMemo(() => {
        if (!mounted) return null;
        const today = new Date();
        return { from: toInput(shiftDays(today, -30)), to: toInput(shiftDays(today, 30)) };
    }, [mounted]);

    const [chosen, setChosen] = useState<{ from: string; to: string } | null>(null);
    const range = chosen ?? initial;

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

    if (!range) return null;

    function preset(startOffset: number, endOffset: number) {
        const today = new Date();
        setChosen({ from: toInput(shiftDays(today, startOffset)), to: toInput(shiftDays(today, endOffset)) });
    }

    const hasData = report !== null && report.byHour.some((h) => h.bookings > 0);
    const maxUtil = Math.max(1, ...(report?.utilisation.map((u) => u.utilisation) ?? [0]));
    const maxHour = Math.max(1, ...(report?.byHour.map((h) => h.bookings) ?? [0]));
    const maxDay = Math.max(1, ...(report?.byWeekday.map((d) => d.bookings) ?? [0]));

    const input =
        "h-10 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/15";
    const chip =
        "h-10 rounded-lg border border-line bg-surface px-3 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40";

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header>
                <p className="font-mono text-sm uppercase tracking-wider text-muted">Admin</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Usage <span className="text-primary">reports</span>
                </h1>
                <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                    See which resources are used, how requests are handled, and when demand peaks.
                </p>
            </header>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
                <label>
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">From</span>
                    <input
                        type="date"
                        value={range.from}
                        max={range.to}
                        onChange={(e) => setChosen({ from: e.target.value, to: range.to })}
                        className={input}
                    />
                </label>
                <label>
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">To</span>
                    <input
                        type="date"
                        value={range.to}
                        min={range.from}
                        onChange={(e) => setChosen({ from: range.from, to: e.target.value })}
                        className={input}
                    />
                </label>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={chip} onClick={() => preset(-30, 0)}>
                        Last 30 days
                    </button>
                    <button type="button" className={chip} onClick={() => preset(0, 30)}>
                        Next 30 days
                    </button>
                    <button type="button" className={chip} onClick={() => preset(-30, 30)}>
                        Around today
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                    {error}
                </p>
            )}

            {report === null && error === null && (
                <div className="space-y-4" aria-hidden>
                    <div className="skeleton h-[280px]" />
                    <div className="skeleton h-[200px]" />
                </div>
            )}

            {report !== null && (
                <>
                    {/* 1. Utilisation */}
                    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                        <h2 className="text-base font-semibold tracking-tight">Utilisation by resource</h2>
                        <p className="mt-1 text-sm text-muted">
                            Approved hours as a share of every hour in the range.
                        </p>

                        <ul className="mt-4 space-y-3">
                            {report.utilisation.map((u) => (
                                <li key={u.id}>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                        <p className="text-sm">
                                            <span className="font-medium">{u.name}</span>{" "}
                                            <span className="text-muted">{u.category}</span>
                                        </p>
                                        <p className="font-mono text-xs text-muted">
                                            {u.bookings} {u.bookings === 1 ? "booking" : "bookings"} · {u.hours} h ·{" "}
                                            <span className="text-ink">{u.utilisation}%</span>
                                        </p>
                                    </div>
                                    <div
                                        className="mt-1.5 h-2 overflow-hidden rounded-full bg-background"
                                        role="img"
                                        aria-label={`${u.name}: ${u.utilisation}% utilised`}
                                    >
                                        <div
                                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                                            style={{ width: `${(u.utilisation / maxUtil) * 100}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 2. Requests by category and status */}
                    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                        <h2 className="text-base font-semibold tracking-tight">Requests by category</h2>
                        <p className="mt-1 text-sm text-muted">Bookings that start inside the range.</p>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wider text-muted">
                                        <th className="pb-2 font-medium">Category</th>
                                        <th className="pb-2 text-right font-medium">Requested</th>
                                        <th className="pb-2 text-right font-medium">Approved</th>
                                        <th className="pb-2 text-right font-medium">Rejected</th>
                                        <th className="pb-2 text-right font-medium">Cancelled</th>
                                        <th className="pb-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {report.byCategory.map((c) => (
                                        <tr key={c.category}>
                                            <td className="py-2.5 font-medium">{c.category}</td>
                                            <td className="py-2.5 text-right font-mono">{c.pending}</td>
                                            <td className="py-2.5 text-right font-mono">{c.approved}</td>
                                            <td className="py-2.5 text-right font-mono">{c.rejected}</td>
                                            <td className="py-2.5 text-right font-mono">{c.cancelled}</td>
                                            <td className="py-2.5 text-right font-mono font-semibold">
                                                {c.pending + c.approved + c.rejected + c.cancelled}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Peak times */}
                    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                        <h2 className="text-base font-semibold tracking-tight">Peak times</h2>
                        <p className="mt-1 text-sm text-muted">
                            Approved bookings by start hour and weekday, in your timezone.
                        </p>

                        {!hasData ? (
                            <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                                No approved bookings start in this range.
                            </p>
                        ) : (
                            <div className="mt-5 grid gap-8 lg:grid-cols-[2fr_1fr]">
                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                                        Hour of day
                                    </p>
                                    <div className="flex h-36 items-end gap-1" role="img" aria-label="Bookings by hour">
                                        {report.byHour.map((h) => (
                                            <div key={h.hour} className="group relative flex h-full flex-1 items-end">
                                                <div
                                                    className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                                                    style={{
                                                        height: `${(h.bookings / maxHour) * 100}%`,
                                                        minHeight: h.bookings > 0 ? 4 : 0,
                                                    }}
                                                    title={`${pad(h.hour)}:00, ${h.bookings} booking${h.bookings === 1 ? "" : "s"}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-1 flex gap-1 font-mono text-[10px] text-muted">
                                        {report.byHour.map((h) => (
                                            <span key={h.hour} className="flex-1 text-center">
                                                {h.hour % 3 === 0 ? h.hour : ""}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
                                        Weekday
                                    </p>
                                    <div className="flex h-36 items-end gap-2" role="img" aria-label="Bookings by weekday">
                                        {report.byWeekday.map((d) => (
                                            <div key={d.weekday} className="flex h-full flex-1 items-end">
                                                <div
                                                    className="w-full rounded-t bg-primary/80"
                                                    style={{
                                                        height: `${(d.bookings / maxDay) * 100}%`,
                                                        minHeight: d.bookings > 0 ? 4 : 0,
                                                    }}
                                                    title={`${WEEKDAYS[d.weekday - 1]}, ${d.bookings} booking${d.bookings === 1 ? "" : "s"}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-1 flex gap-2 text-[11px] text-muted">
                                        {WEEKDAYS.map((w) => (
                                            <span key={w} className="flex-1 text-center">
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
