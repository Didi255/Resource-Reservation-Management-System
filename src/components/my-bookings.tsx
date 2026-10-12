"use client";

import { CalendarBlank, CheckCircle, CircleNotch, Note, WarningCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AVAILABILITY_PILL } from "@/lib/availability";

type Status = "pending" | "approved" | "rejected" | "cancelled";
type Filter = "upcoming" | "past" | "all";

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
    const [notice, setNotice] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>("upcoming");
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

    const sections: { title: string; items: Booking[] }[] =
        filter === "upcoming"
            ? [{ title: "Upcoming", items: upcoming }]
            : filter === "past"
              ? [{ title: "Past and closed", items: past }]
              : [
                    { title: "Upcoming", items: upcoming },
                    { title: "Past and closed", items: past },
                ];

    const refresh = () => setRefreshKey((k) => k + 1);
    const total = upcoming.length + past.length;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
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

            {notice && (
                <div
                    role="status"
                    className="flex items-center gap-3 rounded-lg bg-free-soft px-3 py-2.5 text-sm text-free-ink"
                >
                    <CheckCircle size={18} weight="fill" className="shrink-0" aria-hidden />
                    <p className="flex-1">{notice}</p>
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        aria-label="Dismiss"
                        className="rounded p-1 outline-none hover:bg-free/10 focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <X size={14} weight="bold" />
                    </button>
                </div>
            )}

            {bookings === null && error === null && (
                <div className="space-y-3" aria-hidden>
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="skeleton h-[96px]" />
                    ))}
                </div>
            )}

            {bookings !== null && total === 0 && (
                <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-12 text-center">
                    <p className="font-medium">No bookings yet</p>
                    <p className="mt-1 text-sm text-muted">
                        Pick a time on the floor plan and request a space.
                    </p>
                    <Link
                        href="/spaces"
                        className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30"
                    >
                        Browse spaces
                    </Link>
                </div>
            )}

            {bookings !== null && total > 0 && (
                <>
                    <FilterSwitch
                        value={filter}
                        onChange={setFilter}
                        counts={{ upcoming: upcoming.length, past: past.length, all: total }}
                    />

                    {sections.every((s) => s.items.length === 0) ? (
                        <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center">
                            <p className="font-medium">
                                {filter === "upcoming" ? "No upcoming bookings" : "No past bookings"}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                                {filter === "upcoming" ? (
                                    <>
                                        Find a free slot on the{" "}
                                        <Link href="/spaces" className="font-medium text-primary hover:underline">
                                            floor plan
                                        </Link>
                                        .
                                    </>
                                ) : (
                                    "Completed, rejected and cancelled bookings will appear here."
                                )}
                            </p>
                        </div>
                    ) : (
                        sections
                            .filter((s) => s.items.length > 0)
                            .map((s) => (
                                <section key={s.title}>
                                    <h2 className="mb-3 flex items-baseline gap-2 text-base font-semibold tracking-tight">
                                        {s.title}
                                        <span className="font-mono text-xs font-normal text-muted">
                                            {s.items.length}
                                        </span>
                                    </h2>
                                    <ul className="space-y-3">
                                        {s.items.map((b) => (
                                            <BookingCard
                                                key={b.id}
                                                booking={b}
                                                onCancelled={() => {
                                                    setNotice(
                                                        `Cancelled ${b.resourceName} on ${day(b.startTime)}.`
                                                    );
                                                    refresh();
                                                }}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ))
                    )}
                </>
            )}
        </div>
    );
}

function FilterSwitch({
    value,
    onChange,
    counts,
}: {
    value: Filter;
    onChange: (next: Filter) => void;
    counts: Record<Filter, number>;
}) {
    const options: { value: Filter; label: string }[] = [
        { value: "upcoming", label: "Upcoming" },
        { value: "past", label: "Past" },
        { value: "all", label: "All" },
    ];

    return (
        <div role="group" aria-label="Filter bookings" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
            {options.map((option) => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(option.value)}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            active ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
                        }`}
                    >
                        {option.label}
                        <span className="font-mono text-xs">{counts[option.value]}</span>
                    </button>
                );
            })}
        </div>
    );
}

function BookingCard({ booking, onCancelled }: { booking: Booking; onCancelled: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const status = STATUS[booking.status];
    const cancellable = booking.status === "pending" || booking.status === "approved";

    function openDialog() {
        setError(null);
        dialogRef.current?.showModal();
    }

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
                dialogRef.current?.close();
                onCancelled();
                return;
            }
            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Could not cancel this booking");
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    return (
        <li className="reveal rounded-xl border border-line bg-surface p-4 transition-colors hover:border-ink/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-medium leading-snug">{booking.resourceName}</h3>
                        <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase leading-4 tracking-wider ${status.pill}`}
                        >
                            {status.label}
                        </span>
                    </div>

                    <p className="flex items-center gap-2 text-sm">
                        <CalendarBlank size={16} weight="bold" className="shrink-0 text-primary" aria-hidden />
                        <span>
                            {day(booking.startTime)}, {time(booking.startTime)} to {time(booking.endTime)}
                        </span>
                    </p>
                    <p className="flex items-start gap-2 text-sm text-muted">
                        <Note size={16} className="mt-0.5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words">{booking.purpose}</span>
                    </p>
                </div>

                {cancellable && (
                    <button
                        type="button"
                        onClick={openDialog}
                        className="h-10 shrink-0 self-start rounded-lg border border-line px-3.5 text-sm font-medium text-ink outline-none transition hover:border-booked/40 hover:bg-booked-soft hover:text-booked-ink focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] max-sm:w-full"
                    >
                        Cancel booking
                    </button>
                )}
            </div>

            <dialog
                ref={dialogRef}
                aria-labelledby={`cancel-title-${booking.id}`}
                onClick={(e) => {
                    // a click on the backdrop lands on the dialog element itself
                    if (e.target === e.currentTarget && !pending) e.currentTarget.close();
                }}
                className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
            >
                <div className="p-5">
                    <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-booked-soft text-booked-ink">
                            <WarningCircle size={22} weight="fill" aria-hidden />
                        </span>
                        <div>
                            <h2 id={`cancel-title-${booking.id}`} className="text-lg font-semibold tracking-tight">
                                Cancel this booking?
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                This releases the slot for other people. You will need to request it again if
                                you change your mind.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-1 rounded-lg bg-background px-3 py-2.5 text-sm">
                        <p className="font-medium">{booking.resourceName}</p>
                        <p className="text-muted">
                            {day(booking.startTime)}, {time(booking.startTime)} to {time(booking.endTime)}
                        </p>
                        <p className="text-muted">{booking.purpose}</p>
                    </div>

                    {booking.status === "approved" && (
                        <p className="mt-3 text-xs text-muted">
                            Approved bookings can be cancelled up to 24 hours before they start.
                        </p>
                    )}

                    <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm text-booked">
                        {error}
                    </p>

                    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            disabled={pending}
                            className="h-10 rounded-lg border border-line px-4 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                        >
                            Keep booking
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={pending}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-booked px-4 text-sm font-semibold text-white outline-none transition hover:bg-booked-ink focus-visible:ring-4 focus-visible:ring-booked/30 active:scale-[0.98] disabled:opacity-70"
                        >
                            {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                            {pending ? "Cancelling" : "Yes, cancel booking"}
                        </button>
                    </div>
                </div>
            </dialog>
        </li>
    );
}
