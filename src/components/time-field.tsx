"use client";

import { Clock } from "@phosphor-icons/react";
import { useId, useRef, useState } from "react";

type Period = "AM" | "PM";
type Draft = { hour: number; minute: number; period: Period };

const SIZE = 264;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 106; // hours
const INNER_RADIUS = 66; // minutes

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:30" -> { hour: 2, minute: 30, period: "PM" } */
function parse(value: string): Draft {
    const [hh, mm] = value.split(":").map(Number);
    const h24 = Number.isFinite(hh) ? hh : 0;
    return {
        hour: h24 % 12 === 0 ? 12 : h24 % 12,
        minute: Number.isFinite(mm) ? mm : 0,
        period: h24 >= 12 ? "PM" : "AM",
    };
}

/** { hour: 2, minute: 30, period: "PM" } -> "14:30" */
function format24({ hour, minute, period }: Draft): string {
    return `${pad((hour % 12) + (period === "PM" ? 12 : 0))}:${pad(minute)}`;
}

/** Position on the dial for an angle in degrees (0 = 12 o'clock, clockwise). */
function point(angle: number, radius: number) {
    const radians = ((angle - 90) * Math.PI) / 180;
    return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
}

export function TimeField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string; // "HH:mm", 24-hour, the same shape the rest of the app uses
    onChange: (next: string) => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [draft, setDraft] = useState<Draft>(() => parse(value));

    const shown = parse(value);
    const display = `${shown.hour}:${pad(shown.minute)} ${shown.period}`;

    function open() {
        setDraft(parse(value));
        dialogRef.current?.showModal();
    }

    function confirm() {
        onChange(format24(draft));
        dialogRef.current?.close();
    }

    const hourPoint = point(draft.hour * 30, OUTER_RADIUS);
    const minutePoint = point(draft.minute * 6, INNER_RADIUS);
    const transition = { transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)" };

    return (
        <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>

            <button
                type="button"
                onClick={open}
                aria-haspopup="dialog"
                aria-label={`${label}: ${display}. Change time`}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm outline-none transition hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
            >
                {display}
                <Clock size={16} weight="bold" className="text-primary" aria-hidden />
            </button>

            <dialog
                ref={dialogRef}
                aria-labelledby={titleId}
                onClick={(e) => {
                    // a click on the backdrop lands on the dialog element itself
                    if (e.target === e.currentTarget) e.currentTarget.close();
                }}
                className="m-auto rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
            >
                <div className="w-[min(92vw,336px)] p-5">
                    <h2 id={titleId} className="sr-only">
                        {label} time
                    </h2>

                    {/* readout */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-mono text-4xl tracking-tight">
                            <span className="rounded-lg bg-primary-soft px-2 py-1 text-primary">{pad(draft.hour)}</span>
                            <span className="text-muted">:</span>
                            <span className="rounded-lg bg-primary-soft px-2 py-1 text-primary">
                                {pad(draft.minute)}
                            </span>
                        </div>

                        <div className="flex flex-col overflow-hidden rounded-lg border border-line text-sm font-medium">
                            {(["AM", "PM"] as const).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    aria-pressed={draft.period === period}
                                    onClick={() => setDraft({ ...draft, period })}
                                    className={`px-3 py-1.5 transition-colors ${
                                        draft.period === period ? "bg-primary text-white" : "text-muted hover:bg-background"
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* one dial, two rings: outer = hour, inner = minute */}
                    <div
                        className="relative mx-auto mt-5 rounded-full bg-primary-soft"
                        style={{ width: SIZE, height: SIZE }}
                    >
                        <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden>
                            {/* hour arm sits at the very back, under the inner disc */}
                            <line
                                x1={CENTER}
                                y1={CENTER}
                                x2={hourPoint.x}
                                y2={hourPoint.y}
                                stroke="var(--color-primary)"
                                strokeWidth={4}
                                strokeLinecap="round"
                                style={transition}
                            />
                            {/* inner disc separates the minute ring from the hour ring */}
                            <circle
                                cx={CENTER}
                                cy={CENTER}
                                r={INNER_RADIUS + 22}
                                fill="white"
                                stroke="var(--color-line)"
                            />
                            {/* minute arm sits in front of the disc */}
                            <line
                                x1={CENTER}
                                y1={CENTER}
                                x2={minutePoint.x}
                                y2={minutePoint.y}
                                stroke="var(--color-primary)"
                                strokeWidth={2}
                                strokeLinecap="round"
                                style={transition}
                            />
                            <circle cx={hourPoint.x} cy={hourPoint.y} r={18} fill="var(--color-primary)" style={transition} />
                            <circle cx={minutePoint.x} cy={minutePoint.y} r={14} fill="var(--color-primary)" style={transition} />
                            <circle cx={CENTER} cy={CENTER} r={5} fill="var(--color-primary)" />
                        </svg>

                        {HOURS.map((n) => {
                            const p = point(n * 30, OUTER_RADIUS);
                            const selected = draft.hour === n;
                            return (
                                <button
                                    key={`h${n}`}
                                    type="button"
                                    aria-label={`${n} o'clock`}
                                    aria-pressed={selected}
                                    onClick={() => setDraft({ ...draft, hour: n })}
                                    className={`absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-mono text-sm transition-colors ${
                                        selected ? "text-white" : "text-ink hover:bg-white"
                                    }`}
                                    style={{ left: p.x, top: p.y }}
                                >
                                    {n}
                                </button>
                            );
                        })}

                        {MINUTES.map((m) => {
                            const p = point(m * 6, INNER_RADIUS);
                            const selected = draft.minute === m;
                            return (
                                <button
                                    key={`m${m}`}
                                    type="button"
                                    aria-label={`${m} minutes`}
                                    aria-pressed={selected}
                                    onClick={() => setDraft({ ...draft, minute: m })}
                                    className={`absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-mono text-[11px] transition-colors ${
                                        selected ? "text-white" : "text-muted hover:bg-primary-soft hover:text-ink"
                                    }`}
                                    style={{ left: p.x, top: p.y }}
                                >
                                    {pad(m)}
                                </button>
                            );
                        })}
                    </div>

                    

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-ink"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirm}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]"
                        >
                            Set time
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
