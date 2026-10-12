export type Availability = "free" | "booked" | "pending" | "maintenance";

export type SpaceRow = {
    id: number;
    name: string;
    location: string;
    description: string | null;
    categoryName: string;
    planX: number | null;
    planY: number | null;
    availability: Availability;
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
    free: "Free",
    booked: "Booked",
    pending: "Requested",
    maintenance: "Unavailable",
};

// Soft pastel fill + darker ink. Written out in full so Tailwind can see every class.
export const AVAILABILITY_PILL: Record<Availability, string> = {
    free: "bg-free-soft text-free-ink",
    booked: "bg-booked-soft text-booked-ink",
    pending: "bg-pending-soft text-pending-ink",
    maintenance: "bg-maintenance-soft text-maintenance-ink",
};

// Solid colour, for pins and dots.
export const AVAILABILITY_DOT: Record<Availability, string> = {
    free: "bg-free",
    booked: "bg-booked",
    pending: "bg-pending",
    maintenance: "bg-maintenance",
};
