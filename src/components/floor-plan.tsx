"use client";

import Image from "next/image";
import { AVAILABILITY_DOT, AVAILABILITY_LABEL, type SpaceRow } from "@/lib/availability";

/**
 * The illustration with one pin per resource that has a position.
 * Pin position is plan_x / plan_y in percent of the image, so it holds at any width.
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
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
            <Image
                src="/floorplan.webp"
                alt="Isometric floor plan of the office"
                width={1680}
                height={944}
                priority
                className="h-auto w-full select-none"
            />

            {spaces.map((space) => {
                const selected = space.id === selectedId;
                return (
                    <button
                        key={space.id}
                        type="button"
                        aria-label={`${space.name}, ${AVAILABILITY_LABEL[space.availability]}`}
                        aria-pressed={selected}
                        onClick={() => onSelect(space.id)}
                        style={{ left: `${space.planX}%`, top: `${space.planY}%` }}
                        className="group absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <span
                            className={`block rounded-full shadow-sm ring-2 ring-white transition-all duration-200 group-hover:scale-110 ${
                                AVAILABILITY_DOT[space.availability]
                            } ${selected ? "h-6 w-6 ring-[3px] ring-ink" : "h-4 w-4 sm:h-5 sm:w-5"}`}
                        />
                        <span
                            className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
                                selected ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            {space.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
