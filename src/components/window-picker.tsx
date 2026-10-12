"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { TimeField } from "@/components/time-field";
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
    return (
        <div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4 sm:max-w-xl sm:grid-cols-[1.4fr_1fr_1fr]">
                <label className="col-span-2 sm:col-span-1">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                        <CalendarBlank size={14} weight="bold" className="text-primary" aria-hidden />
                        Date
                    </span>
                    <input
                        type="date"
                        value={value.date}
                        onChange={(e) => onChange({ ...value, date: e.target.value })}
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                </label>

                <TimeField label="From" value={value.from} onChange={(from) => onChange({ ...value, from })} />
                <TimeField label="To" value={value.to} onChange={(to) => onChange({ ...value, to })} />
            </div>

            {invalid && (
                <p role="alert" className="mt-2 text-sm text-booked-ink">
                    End time must be after start time.
                </p>
            )}
        </div>
    );
}
