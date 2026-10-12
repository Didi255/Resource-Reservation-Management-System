"use client";

import type { TimeWindow } from "@/lib/time-window";

export function WindowPicker({
    value,
    onChange,
    invalid,
}: {
    value: TimeWindow;
    onChange: (next: TimeWindow) => void;
    invalid: boolean;
}) {
    const set = (key: keyof TimeWindow) => (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange({ ...value, [key]: e.target.value });

    const input =
        "rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

    return (
        <div>
            <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-medium">
                    <span className="mb-1 block">Date</span>
                    <input type="date" value={value.date} onChange={set("date")} className={input} />
                </label>
                <label className="text-sm font-medium">
                    <span className="mb-1 block">From</span>
                    <input type="time" value={value.from} onChange={set("from")} className={input} />
                </label>
                <label className="text-sm font-medium">
                    <span className="mb-1 block">To</span>
                    <input type="time" value={value.to} onChange={set("to")} className={input} />
                </label>
            </div>
            {invalid && <p className="mt-2 text-sm text-booked">End time must be after start time.</p>}
        </div>
    );
}
