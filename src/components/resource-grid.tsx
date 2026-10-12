import { AvailabilityBadge } from "@/components/availability-badge";
import type { SpaceRow } from "@/lib/availability";

export function ResourceGrid({
    spaces,
    selectedId = null,
    onSelect,
}: {
    spaces: SpaceRow[];
    selectedId?: number | null;
    onSelect?: (id: number) => void;
}) {
    if (spaces.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                Nothing is listed in this category yet. An admin can add resources from the admin area.
            </p>
        );
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {spaces.map((space, index) => {
                const selected = space.id === selectedId;
                const muted = space.availability === "maintenance";
                const surface = muted ? "bg-background" : "bg-surface";

                const content = (
                    <>
                        <div className="flex items-start justify-between gap-3">
                            <h3 className={`font-medium leading-snug ${muted ? "text-muted" : ""}`}>{space.name}</h3>
                            <AvailabilityBadge value={space.availability} />
                        </div>
                        <p className="mt-1.5 text-sm text-muted">{space.location}</p>
                    </>
                );

                return (
                    <li key={space.id} className="reveal" style={{ "--i": index } as React.CSSProperties}>
                        {onSelect ? (
                            <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onSelect(space.id)}
                                className={`block h-full w-full rounded-xl border p-4 text-left outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99] ${surface} ${
                                    selected ? "border-primary ring-4 ring-primary/10" : "border-line"
                                }`}
                            >
                                {content}
                            </button>
                        ) : (
                            <div className={`h-full rounded-xl border border-line p-4 ${surface}`}>{content}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
