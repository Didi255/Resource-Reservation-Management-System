"use client";

import { useEffect, useMemo, useState } from "react";
import { WindowPicker } from "@/components/window-picker";
import { defaultWindow, toRange, type TimeWindow } from "@/lib/time-window";

type Availability = "free" | "booked" | "pending" | "maintenance";
type Row = { id: number; name: string; categoryName: string; availability: Availability };

const DOT: Record<Availability, string> = {
    free: "bg-free",
    booked: "bg-booked",
    pending: "bg-pending",
    maintenance: "bg-maintenance",
};

export function SpacesView() {
    const [window, setWindow] = useState<TimeWindow | null>(null);
    const [rows, setRows] = useState<Row[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Set after mount so server and browser render the same first HTML.
    useEffect(() => setWindow(defaultWindow()), []);

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
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort(); // a newer window cancels the older request
    }, [start, end]);

    if (!window) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
            <WindowPicker value={window} onChange={setWindow} invalid={range === null} />

            {error && <p className="text-booked">{error}</p>}

            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
                {rows.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${DOT[r.availability]}`} />
                        <span className="font-medium">{r.name}</span>
                        <span className="text-sm text-muted">{r.categoryName}</span>
                        <span className="ml-auto text-sm capitalize text-muted">{r.availability}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
