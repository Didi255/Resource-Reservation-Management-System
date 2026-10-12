import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import {
    AVAILABILITY_LABEL,
    AVAILABILITY_PILL,
    type Availability,
} from "@/lib/availability";

const ORDER: Availability[] = ["free", "pending", "booked", "maintenance"];

/** The selected window and one tile per status. Used on the Resources page. */
export function AvailabilitySummary({
    counts,
    windowLabel,
}: {
    counts: Record<Availability, number>;
    windowLabel: string | null;
}) {
    return (
        <section aria-label="Availability summary" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Selected window</p>
                {windowLabel && (
                    <p className="flex items-center gap-2 text-sm font-medium">
                        <CalendarBlank size={16} weight="bold" className="shrink-0 text-primary" aria-hidden />
                        {windowLabel}
                    </p>
                )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ORDER.map((state) => (
                    <div key={state} className={`rounded-lg px-4 py-3 ${AVAILABILITY_PILL[state]}`}>
                        <dd className="font-mono text-3xl font-semibold leading-none tracking-tight">
                            {counts[state]}
                        </dd>
                        <dt className="mt-2 text-sm font-medium">{AVAILABILITY_LABEL[state]}</dt>
                    </div>
                ))}
            </dl>
        </section>
    );
}
