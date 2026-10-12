import type { Availability } from "@/lib/availability";

// Three tones per status: highlight, body, shade. They give the ball its glossy 3D look.
const TONES: Record<Availability, [string, string, string]> = {
    free: ["#4ade80", "#16a34a", "#166534"],
    pending: ["#fbbf24", "#d97706", "#92400e"],
    booked: ["#f87171", "#dc2626", "#991b1b"],
    maintenance: ["#cbd5e1", "#94a3b8", "#64748b"],
};

const STATES = Object.keys(TONES) as Availability[];

/**
 * Render once on a page that uses PinIcon. Each pin references these gradients by id,
 * so the colours are defined in one place instead of repeated in every pin.
 */
export function PinDefs() {
    return (
        <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
            <defs>
                {STATES.map((state) => (
                    <radialGradient key={state} id={`pin-${state}`} cx="35%" cy="30%" r="80%">
                        <stop offset="0" stopColor={TONES[state][0]} />
                        <stop offset="0.5" stopColor={TONES[state][1]} />
                        <stop offset="1" stopColor={TONES[state][2]} />
                    </radialGradient>
                ))}
                <linearGradient id="pin-needle" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#6b7280" />
                    <stop offset="0.5" stopColor="#e5e7eb" />
                    <stop offset="1" stopColor="#6b7280" />
                </linearGradient>
            </defs>
        </svg>
    );
}

/** A push pin whose tip is the bottom-centre of the icon. */
export function PinIcon({
    state,
    className,
    selected = false,
}: {
    state: Availability;
    className?: string;
    selected?: boolean;
}) {
    return (
        <svg viewBox="0 0 28 44" className={className} aria-hidden focusable="false">
            {/* needle with a pointed tip */}
            <path d="M13 21h2v19l-1 3-1-3z" fill="url(#pin-needle)" />
            {/* ball */}
            <circle
                cx="14"
                cy="13"
                r="11"
                fill={`url(#pin-${state})`}
                stroke={selected ? "#0f172a" : "none"}
                strokeWidth="1.5"
            />
            {/* gloss */}
            <ellipse cx="10" cy="8.5" rx="3.4" ry="2.3" fill="#fff" opacity="0.7" transform="rotate(-30 10 8.5)" />
        </svg>
    );
}
