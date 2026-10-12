import { AVAILABILITY_LABEL, AVAILABILITY_PILL, type Availability } from "@/lib/availability";

export function AvailabilityBadge({ value }: { value: Availability }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${AVAILABILITY_PILL[value]}`}
        >
            {AVAILABILITY_LABEL[value]}
        </span>
    );
}
