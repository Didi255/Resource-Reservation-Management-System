import { AvailabilityBadge } from "@/components/availability-badge";
import type { SpaceRow } from "@/lib/availability";

export function ResourceGrid({ spaces }: { spaces: SpaceRow[] }) {
    if (spaces.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                Nothing is listed in this category yet. An admin can add resources from the admin area.
            </p>
        );
    }

    return (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {spaces.map((space, index) => (
                <li
                    key={space.id}
                    className="reveal rounded-xl border border-line bg-surface p-4 transition-colors hover:border-primary/40"
                    style={{ "--i": index } as React.CSSProperties}
                >
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium leading-snug">{space.name}</h3>
                        <AvailabilityBadge value={space.availability} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{space.location}</p>
                </li>
            ))}
        </ul>
    );
}
