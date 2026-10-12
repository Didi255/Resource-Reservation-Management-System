import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import {
    AVAILABILITY_LABEL,
    AVAILABILITY_PILL,
    type Availability,
} from "@/lib/availability";

const ORDER: Availability[] = ["free", "pending", "booked", "maintenance"];

/** The selected window and one tile per status, in a 2 x 2 grid that fits a side column. */
export function AvailabilitySummary({
    counts,
    windowLabel,
}: {
    counts: Record<Availability, number>;
    windowLabel: string | null;
}) {
    return (
        <section aria-label="Availability summary" className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Selected window</p>
            {windowLabel && (
                <p className="mt-1 flex items-start gap-2 text-sm font-medium">
                    <CalendarBlank size={16} weight="bold" className="mt-0.5 shrink-0 text-primary" aria-hidden />
                    {windowLabel}
                </p>
            )}

            <dl className="mt-3 grid grid-cols-2 gap-2">
                {ORDER.map((state) => (
                    <div key={state} className={`rounded-lg px-3 py-2.5 ${AVAILABILITY_PILL[state]}`}>
                        <dd className="font-mono text-2xl font-semibold leading-none tracking-tight">
                            {counts[state]}
                        </dd>
                        <dt className="mt-1.5 text-xs font-medium">{AVAILABILITY_LABEL[state]}</dt>
                    </div>
                ))}
            </dl>
        </section>
    );
}
