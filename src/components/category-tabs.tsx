"use client";

import { CaretDown } from "@phosphor-icons/react";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { categoryArt } from "@/lib/category-art";
import type { SpaceRow } from "@/lib/availability";

type Group = [string, SpaceRow[]];

const MIN_CARD_WIDTH = 300;
const GAP = 16;

/**
 * How many cards fit in a row of the given container, so the grid adapts to the
 * space it actually has (sidebar or not) and not only to the viewport width.
 */
function useColumns(ref: React.RefObject<HTMLDivElement | null>) {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const update = () => {
            const width = element.clientWidth;
            setColumns(Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP))));
        };
        update();

        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return columns;
}

export function CategoryTabs({
    groups,
    active,
    onSelect,
    children,
}: {
    groups: Group[];
    active: string | null;
    onSelect: (name: string) => void;
    children: ReactNode; // the open category's resources, shown right below its row
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const columns = useColumns(containerRef);

    const rows: Group[][] = [];
    for (let i = 0; i < groups.length; i += columns) {
        rows.push(groups.slice(i, i + columns));
    }

    return (
        <div ref={containerRef} className="flex flex-col gap-4">
            {rows.map((row, rowIndex) => (
                <Fragment key={rowIndex}>
                    <div
                        className="grid gap-4"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {row.map(([name, spaces], colIndex) => {
                            const art = categoryArt(name);
                            const free = spaces.filter((s) => s.availability === "free").length;
                            const open = active === name;

                            return (
                                <button
                                    key={name}
                                    type="button"
                                    data-selected={open}
                                    aria-expanded={open}
                                    onClick={() => onSelect(name)}
                                    style={{ "--i": rowIndex * columns + colIndex } as CSSProperties}
                                    className="group reveal rounded-xl border border-line bg-surface p-3 text-left outline-none transition hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgb(15_23_42/0.15)] focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:border-primary data-[selected=true]:ring-4 data-[selected=true]:ring-primary/10 active:scale-[0.99]"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-background">
                                        {art && (
                                            <Image
                                                src={art}
                                                alt=""
                                                fill
                                                sizes="(min-width: 1024px) 30vw, 90vw"
                                                className="object-contain p-3 mix-blend-multiply"
                                            />
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 px-1">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium leading-tight">{name}</p>
                                            <p className="mt-1.5 flex items-center gap-2 text-sm">
                                                <span
                                                    className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
                                                        free > 0
                                                            ? "bg-free-soft text-free-ink"
                                                            : "bg-maintenance-soft text-maintenance-ink"
                                                    }`}
                                                >
                                                    {free > 0 ? `${free} available` : "None available"}
                                                </span>
                                                <span className="font-mono text-xs text-muted">
                                                    {spaces.length} total
                                                </span>
                                            </p>
                                        </div>
                                        <CaretDown
                                            size={18}
                                            weight="bold"
                                            aria-hidden
                                            className="shrink-0 text-muted transition-transform duration-300 group-data-[selected=true]:rotate-180 group-data-[selected=true]:text-primary"
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* the open category's resources, full width, right under its row */}
                    {row.some(([name]) => name === active) && <div>{children}</div>}
                </Fragment>
            ))}
        </div>
    );
}
