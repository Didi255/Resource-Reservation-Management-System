"use client";

import Image from "next/image";
import { PinDefs, PinIcon } from "@/components/pin-icon";
import { AVAILABILITY_LABEL, type Availability, type SpaceRow } from "@/lib/availability";

const LEGEND: Availability[] = ["free", "pending", "booked", "maintenance"];

/**
 * The illustration with one push pin per resource that has a position.
 * plan_x / plan_y are percentages of the image and mark where the needle tip lands,
 * so pins stay on the right spot at any width.
 */
export function FloorPlan({
    spaces,
    selectedId,
    onSelect,
}: {
    spaces: SpaceRow[]; // only rows that have a position
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    return (
        <figure className="rounded-xl border border-line bg-surface">
            <PinDefs />

            <div className="relative">
                <Image
                    src="/floorplan.webp"
                    alt="Isometric floor plan of the office"
                    width={1680}
                    height={944}
                    priority
                    className="h-auto w-full select-none rounded-t-xl"
                />

                {spaces.map((space) => {
                    const selected = space.id === selectedId;
                    const x = space.planX ?? 50;
                    const y = space.planY ?? 50;

                    // keep the label inside the plan: anchor it away from the nearest edge
                    const horizontal = x < 20 ? "left-0" : x > 80 ? "right-0" : "left-1/2 -translate-x-1/2";
                    const vertical = y < 22 ? "top-full mt-1" : "bottom-full mb-1";

                    return (
                        <button
                            key={space.id}
                            type="button"
                            aria-label={`${space.name}, ${AVAILABILITY_LABEL[space.availability]}`}
                            aria-pressed={selected}
                            onClick={() => onSelect(space.id)}
                            // the button's bottom-centre sits on the coordinate: that is the needle tip
                            style={{ left: `${x}%`, top: `${y}%` }}
                            className="group absolute -translate-x-1/2 -translate-y-full rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <PinIcon
                                state={space.availability}
                                selected={selected}
                                className={`block origin-bottom drop-shadow-sm transition-transform duration-200 group-hover:scale-110 ${
                                    selected ? "h-10 w-[25px] scale-110 sm:h-12 sm:w-[30px]" : "h-8 w-[20px] sm:h-10 sm:w-[25px]"
                                }`}
                            />
                            <span
                                className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${horizontal} ${vertical} ${
                                    selected ? "opacity-100" : "opacity-0"
                                }`}
                            >
                                {space.name} · {AVAILABILITY_LABEL[space.availability]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* the legend names every colour, so status is never colour alone */}
            <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line px-4 py-3 text-xs text-muted">
                {LEGEND.map((state) => (
                    <span key={state} className="flex items-center gap-1.5">
                        <PinIcon state={state} className="h-[18px] w-[11px]" />
                        {AVAILABILITY_LABEL[state]}
                    </span>
                ))}
            </figcaption>
        </figure>
    );
}
