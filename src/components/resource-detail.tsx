import { CursorClick, MapPin } from "@phosphor-icons/react/dist/ssr";
import { AvailabilityBadge } from "@/components/availability-badge";
import { BookingForm } from "@/components/booking-form";
import type { Availability, SpaceRow } from "@/lib/availability";

const STATUS_NOTE: Record<Availability, string> = {
    free: "Free for the selected window.",
    pending: "Someone has requested this slot and an admin has not decided yet. You can still request it.",
    booked: "Already booked for part or all of the selected window.",
    maintenance: "Not available for booking right now.",
};

export function ResourceDetail({
    space,
    windowLabel,
    range,
    onBooked,
}: {
    space: SpaceRow | null;
    windowLabel: string | null;
    range: { start: string; end: string } | null;
    onBooked: () => void;
}) {
    if (!space) {
        return (
            <aside className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface p-6 text-center">
                <CursorClick size={24} className="text-muted" aria-hidden />
                <p className="text-sm text-muted">Select a space on the floor plan to view details.</p>
            </aside>
        );
    }

    return (
        <aside className="rounded-xl border border-line bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">{space.categoryName}</p>

            <div className="mt-1 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug tracking-tight">{space.name}</h2>
                <AvailabilityBadge value={space.availability} />
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={16} aria-hidden />
                {space.location}
            </p>

            {space.description && <p className="mt-4 text-sm leading-relaxed">{space.description}</p>}

            <div className="mt-5 rounded-lg bg-background px-3 py-2.5 text-sm">
                {windowLabel && <p className="font-medium">{windowLabel}</p>}
                <p className="text-muted">{STATUS_NOTE[space.availability]}</p>
            </div>

            {/* key resets the form (typed purpose, success state) when another resource is chosen */}
            <div className="mt-5">
                <BookingForm
                    key={space.id}
                    resourceId={space.id}
                    availability={space.availability}
                    range={range}
                    onBooked={onBooked}
                />
            </div>
        </aside>
    );
}
