"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AvailabilitySummary } from "@/components/availability-summary";
import { CategoryTabs } from "@/components/category-tabs";
import { FloorPlan } from "@/components/floor-plan";
import { ResourceDetail } from "@/components/resource-detail";
import { ResourceGrid } from "@/components/resource-grid";
import { WindowPicker } from "@/components/window-picker";
import type { Availability, SpaceRow } from "@/lib/availability";
import { defaultWindow, toRange, type TimeWindow } from "@/lib/time-window";

const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const shortTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const subscribeNever = () => () => {};

// One grid for the header and the body, so the time panel sits exactly over the side column.
const COLUMNS =
    "lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]";

/** "plan" is the floor plan (Spaces); "list" is browse-by-category (Resources). */
export function SpacesView({ mode }: { mode: "plan" | "list" }) {
    // false while rendering on the server, true in the browser. "Now" only exists
    // in the browser, and this avoids a hydration mismatch without an effect.
    const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
    const initialWindow = useMemo(() => (mounted ? defaultWindow() : null), [mounted]);
    const [chosen, setWindow] = useState<TimeWindow | null>(null);
    const window = chosen ?? initialWindow;

    const [rows, setRows] = useState<SpaceRow[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // undefined = not chosen yet, so the first category opens by default
    const [selected, setSelected] = useState<string | null | undefined>(undefined);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0); // bump to refetch after a booking

    const range = useMemo(() => (window ? toRange(window) : null), [window]);
    const start = range?.start;
    const end = range?.end;

    useEffect(() => {
        if (!start || !end) return;
        const controller = new AbortController();

        fetch(`/api/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? "Could not load availability");
                setRows(body.resources);
                setLoaded(true);
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort();
    }, [start, end, refreshKey]);

    // The API returns rows sorted by category, so Map keeps that order.
    const groups = useMemo(() => {
        const map = new Map<string, SpaceRow[]>();
        for (const row of rows) {
            const list = map.get(row.categoryName) ?? [];
            list.push(row);
            map.set(row.categoryName, list);
        }
        return [...map.entries()];
    }, [rows]);

    const counts = useMemo(() => {
        const result: Record<Availability, number> = { free: 0, pending: 0, booked: 0, maintenance: 0 };
        for (const row of rows) result[row.availability]++;
        return result;
    }, [rows]);

    const active = selected === undefined ? (groups[0]?.[0] ?? null) : selected;
    const activeSpaces = groups.find(([name]) => name === active)?.[1] ?? [];
    const activeFree = activeSpaces.filter((s) => s.availability === "free").length;

    // Plan view: only resources with a position can be pinned. The rest live on the Resources page.
    const placed = rows.filter((r) => r.planX !== null && r.planY !== null);
    const selectedSpace = rows.find((r) => r.id === selectedId) ?? null;

    const refresh = () => setRefreshKey((k) => k + 1);

    if (!window) return null;

    const windowLabel = range
        ? `${shortDate(range.start)}, ${shortTime(range.start)} to ${shortTime(range.end)}`
        : null;

    const loading = !loaded && error === null;
    const isPlan = mode === "plan";

    const detail = (
        <ResourceDetail
            space={selectedSpace}
            windowLabel={windowLabel}
            range={range}
            onBooked={refresh}
            emptyHint={
                isPlan
                    ? "Select a space on the floor plan to view details."
                    : "Select a resource to view its details and request a booking."
            }
        />
    );

    // List page: the open category's resources. On phones the details open right under them.
    const panel = active && (
        <section
            key={active}
            aria-label={active}
            className="reveal space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight">{active}</h2>
                <p className="font-mono text-xs text-muted">
                    {activeFree} of {activeSpaces.length} available
                </p>
            </div>

            <ResourceGrid spaces={activeSpaces} selectedId={selectedId} onSelect={setSelectedId} />

            {selectedSpace && selectedSpace.categoryName === active && (
                <div className="lg:hidden">{detail}</div>
            )}
        </section>
    );

    return (
        <div className="mx-auto w-full max-w-[1800px] space-y-5">
            <div className={`grid items-center gap-4 ${COLUMNS}`}>
                <header>
                    <p className="font-mono text-sm uppercase tracking-wider text-muted">Availability</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
                        {isPlan ? (
                            <>
                                Find your <span className="text-primary">space</span>
                            </>
                        ) : (
                            <>
                                Browse <span className="text-primary">resources</span>
                            </>
                        )}
                    </h1>
                    <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                        {isPlan
                            ? "Choose a date and time, then pick a pin on the floor plan."
                            : "Choose a date and time to see every resource by category."}
                    </p>
                </header>

                <WindowPicker value={window} onChange={setWindow} invalid={range === null} stacked />
            </div>

            {error && (
                <p role="alert" className="rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                    {error}
                </p>
            )}

            {loading && (
                <div className={`grid gap-5 ${COLUMNS}`} aria-hidden>
                    {isPlan ? (
                        <div className="skeleton aspect-[1680/944]" />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="skeleton h-[236px]" />
                            ))}
                        </div>
                    )}
                    <div className="skeleton hidden h-[220px] lg:block" />
                </div>
            )}

            {loaded && rows.length === 0 && (
                <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
                    No resources are listed yet. An admin can add rooms, equipment and vehicles.
                </p>
            )}

            {loaded && rows.length > 0 && (
                // about 75% content, 25% side column; stacks when the columns would get too narrow
                <div className={`grid items-start gap-5 ${COLUMNS}`}>
                    {isPlan ? (
                        <FloorPlan spaces={placed} selectedId={selectedId} onSelect={setSelectedId} />
                    ) : (
                        <div className="space-y-5">
                            {/* the side column holds this from lg up; phones show it first instead */}
                            <div className="lg:hidden">
                                <AvailabilitySummary counts={counts} windowLabel={windowLabel} />
                            </div>

                            <h2 className="text-base font-semibold tracking-tight">Browse by category</h2>

                            <CategoryTabs
                                groups={groups}
                                active={active}
                                onSelect={(name) => setSelected(active === name ? null : name)}
                            >
                                {panel}
                            </CategoryTabs>
                        </div>
                    )}

                    <div
                        className={`space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto ${
                            isPlan ? "" : "hidden lg:block"
                        }`}
                    >
                        {!isPlan && <AvailabilitySummary counts={counts} windowLabel={windowLabel} />}
                        {detail}
                    </div>
                </div>
            )}
        </div>
    );
}
