"use client";

import { CalendarBlank, CircleNotch, Note } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AVAILABILITY_PILL } from "@/lib/availability";

type Status = "pending" | "approved" | "rejected" | "cancelled";

type Booking = {
    id: number;
    startTime: string;
    endTime: string;
    purpose: string;
    status: Status;
    resourceId: number;
    resourceName: string;
};

// Reservation status -> label and the pastel pill already used for availability.
const STATUS: Record<Status, { label: string; pill: string }> = {
    pending: { label: "Requested", pill: AVAILABILITY_PILL.pending },
    approved: { label: "Approved", pill: AVAILABILITY_PILL.free },
    rejected: { label: "Rejected", pill: AVAILABILITY_PILL.booked },
    cancelled: { label: "Cancelled", pill: AVAILABILITY_PILL.maintenance },
};

const day = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function MyBookings() {
    const [bookings, setBookings] = useState<Booking[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [now] = useState(() => Date.now()); // fixed at mount: splits upcoming from past

    useEffect(() => {
        const controller = new AbortController();

        fetch("/api/reservations?mine=1", { signal: controller.signal })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? "Could not load your bookings");
                setBookings(body.reservations);
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort();
    }, [refreshKey]);

    const { upcoming, past } = useMemo(() => {
        const all = bookings ?? [];
        const isUpcoming = (b: Booking) =>
            (b.status === "pending" || b.status === "approved") && new Date(b.endTime).getTime() > now;

        return {
            upcoming: all
                .filter(isUpcoming)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
            past: all
                .filter((b) => !isUpcoming(b))
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
        };
    }, [bookings, now]);

    const refresh = () => setRefreshKey((k) => k + 1);

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8">
            <header>
                <p className="font-mono text-sm uppercase tracking-wider text-muted">Bookings</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    My <span className="text-primary">bookings</span>
                </h1>
                <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                    Track your requests and cancel the ones you no longer need.
                </p>
            </header>

            {error && (
                <p role="alert" className="rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                    {error}
                </p>
            )}

            {bookings === null && error === null && (
                <div className="space-y-3" aria-hidden>
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="skeleton h-[112px]" />
                    ))}
                </div>
            )}

            {bookings !== null && bookings.length === 0 && (
                <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-12 text-center">
                    <p className="font-medium">No bookings yet</p>
                    <p className="mt-1 text-sm text-muted">
                        Pick a time on the{" "}
                        <Link href="/spaces" className="font-medium text-primary hover:underline">
                            floor plan
                        </Link>{" "}
                        and request a space.
                    </p>
                </div>
            )}

            {upcoming.length > 0 && (
                <Section title="Upcoming" count={upcoming.length}>
                    {upcoming.map((b) => (
                        <BookingCard key={b.id} booking={b} onChanged={refresh} />
                    ))}
                </Section>
            )}

            {past.length > 0 && (
                <Section title="Past and closed" count={past.length}>
                    {past.map((b) => (
                        <BookingCard key={b.id} booking={b} onChanged={refresh} />
                    ))}
                </Section>
            )}
        </div>
    );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-3 flex items-baseline gap-2 text-base font-semibold tracking-tight">
                {title}
                <span className="font-mono text-xs font-normal text-muted">{count}</span>
            </h2>
            <ul className="space-y-3">{children}</ul>
        </section>
    );
}

function BookingCard({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const status = STATUS[booking.status];
    const cancellable = booking.status === "pending" || booking.status === "approved";

    async function cancel() {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            const response = await fetch(`/api/reservations/${booking.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
            });
            if (response.ok) {
                onChanged();
                return;
            }
            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Could not cancel this booking");
            setConfirming(false);
        } catch {
            setError("Could not reach the server. Try again.");
            setConfirming(false);
        }
        setPending(false);
    }

    return (
        <li className="reveal rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium leading-snug">{booking.resourceName}</h3>
                        <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${status.pill}`}
                        >
                            {status.label}
                        </span>
                    </div>

                    <p className="mt-2 flex items-center gap-2 text-sm">
                        <CalendarBlank size={16} weight="bold" className="shrink-0 text-primary" aria-hidden />
                        {day(booking.startTime)}, {time(booking.startTime)} to {time(booking.endTime)}
                    </p>
                    <p className="mt-1 flex items-start gap-2 text-sm text-muted">
                        <Note size={16} className="mt-0.5 shrink-0" aria-hidden />
                        {booking.purpose}
                    </p>
                </div>

                {cancellable && !confirming && (
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            setConfirming(true);
                        }}
                        className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink outline-none transition hover:border-booked/40 hover:bg-booked-soft hover:text-booked-ink focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        Cancel booking
                    </button>
                )}
            </div>

            {confirming && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-background px-3 py-2.5">
                    <p className="text-sm">
                        Cancel this booking?
                        {booking.status === "approved" && (
                            <span className="text-muted"> Approved bookings can be cancelled up to 24 hours before they start.</span>
                        )}
                    </p>
                    <div className="ml-auto flex gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            disabled={pending}
                            className="rounded-lg px-3 py-1.5 text-sm text-muted outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            Keep it
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={pending}
                            className="flex items-center gap-2 rounded-lg bg-booked px-3 py-1.5 text-sm font-medium text-white outline-none transition hover:opacity-90 focus-visible:ring-4 focus-visible:ring-booked/30 disabled:opacity-70"
                        >
                            {pending && <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden />}
                            {pending ? "Cancelling" : "Yes, cancel"}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p role="alert" className="mt-3 text-sm text-booked">
                    {error}
                </p>
            )}
        </li>
    );
}
