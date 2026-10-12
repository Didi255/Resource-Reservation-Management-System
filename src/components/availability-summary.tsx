import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import {
    AVAILABILITY_LABEL,
    AVAILABILITY_PILL,
    type Availability,
} from "@/lib/availability";

const ORDER: Availability[] = ["free", "pending", "booked", "maintenance"];

/**
 * "row": a wide panel with four tiles in a line (Resources page).
 * "grid": a compact 2 x 2 version for the side column (Spaces page).
 */
export function AvailabilitySummary({
    counts,
    windowLabel,
    layout = "row",
}: {
    counts: Record<Availability, number>;
    windowLabel: string | null;
    layout?: "row" | "grid";
}) {
    const compact = layout === "grid";

    return (
        <section
            aria-label="Availability summary"
            className={`rounded-xl border border-line bg-surface ${compact ? "p-4" : "p-4 sm:p-5"}`}
        >
            <div className={compact ? "" : "flex flex-wrap items-center justify-between gap-2"}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Selected window</p>
                {windowLabel && (
                    <p className={`flex items-center gap-2 text-sm font-medium ${compact ? "mt-1" : ""}`}>
                        <CalendarBlank size={16} weight="bold" className="shrink-0 text-primary" aria-hidden />
                        {windowLabel}
                    </p>
                )}
            </div>

            <dl
                className={
                    compact
                        ? "mt-3 grid grid-cols-2 gap-2"
                        : "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
                }
            >
                {ORDER.map((state) => (
                    <div
                        key={state}
                        className={`rounded-lg ${compact ? "px-3 py-2.5" : "px-4 py-3"} ${AVAILABILITY_PILL[state]}`}
                    >
                        <dd
                            className={`font-mono font-semibold leading-none tracking-tight ${
                                compact ? "text-2xl" : "text-3xl"
                            }`}
                        >
                            {counts[state]}
                        </dd>
                        <dt className={`font-medium ${compact ? "mt-1.5 text-xs" : "mt-2 text-sm"}`}>
                            {AVAILABILITY_LABEL[state]}
                        </dt>
                    </div>
                ))}
            </dl>
        </section>
    );
}
