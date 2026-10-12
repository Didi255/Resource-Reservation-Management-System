"use client";

import { MapTrifold, SquaresFour } from "@phosphor-icons/react";

export type View = "list" | "plan";

const OPTIONS: { value: View; label: string; Icon: typeof SquaresFour }[] = [
    { value: "list", label: "List", Icon: SquaresFour },
    { value: "plan", label: "Plan", Icon: MapTrifold },
];

export function ViewToggle({ value, onChange }: { value: View; onChange: (next: View) => void }) {
    return (
        <div role="group" aria-label="Choose view" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
            {OPTIONS.map(({ value: option, label, Icon }) => {
                const active = value === option;
                return (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            active ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
                        }`}
                    >
                        <Icon size={16} weight={active ? "fill" : "regular"} aria-hidden />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
