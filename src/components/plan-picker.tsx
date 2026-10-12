"use client";

import Image from "next/image";
import { PinDefs, PinIcon } from "@/components/pin-icon";

/**
 * Click the floor plan to place a resource. The position is stored as percentages of the
 * image, the same unit the plan view uses, so it lines up at any size. The number fields
 * are the keyboard-friendly alternative to clicking.
 */
export function PlanPicker({
    x,
    y,
    onChange,
}: {
    x: number | null;
    y: number | null;
    onChange: (x: number | null, y: number | null) => void;
}) {
    const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

    function place(event: React.MouseEvent<HTMLDivElement>) {
        const box = event.currentTarget.getBoundingClientRect();
        onChange(
            clamp(((event.clientX - box.left) / box.width) * 100),
            clamp(((event.clientY - box.top) / box.height) * 100)
        );
    }

    function setAxis(axis: "x" | "y", raw: string) {
        if (raw === "") {
            onChange(null, null);
            return;
        }
        const value = clamp(Number(raw));
        // the other axis starts in the middle so the pin appears straight away
        onChange(axis === "x" ? value : (x ?? 50), axis === "y" ? value : (y ?? 50));
    }

    const placed = x !== null && y !== null;

    return (
        <div>
            <PinDefs />

            <div
                onClick={place}
                className="relative cursor-crosshair overflow-hidden rounded-lg border border-line bg-surface"
            >
                <Image
                    src="/floorplan.webp"
                    alt="Floor plan. Click to place the resource."
                    width={1680}
                    height={944}
                    className="h-auto w-full select-none"
                />
                {placed && (
                    <span
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
                        style={{ left: `${x}%`, top: `${y}%` }}
                    >
                        <PinIcon state="free" selected className="block h-9 w-[23px] drop-shadow-sm" />
                    </span>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
                {(["x", "y"] as const).map((axis) => (
                    <label key={axis} className="block">
                        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted">
                            {axis === "x" ? "Across %" : "Down %"}
                        </span>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            inputMode="numeric"
                            value={(axis === "x" ? x : y) ?? ""}
                            onChange={(e) => setAxis(axis, e.target.value)}
                            className="h-10 w-24 rounded-lg border border-line bg-surface px-3 font-mono text-sm outline-none transition hover:border-ink/25 focus:border-primary focus:ring-4 focus:ring-primary/15"
                        />
                    </label>
                ))}
                <button
                    type="button"
                    onClick={() => onChange(null, null)}
                    disabled={!placed}
                    className="h-10 rounded-lg border border-line px-3 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                >
                    Not on the plan
                </button>
            </div>
        </div>
    );
}
