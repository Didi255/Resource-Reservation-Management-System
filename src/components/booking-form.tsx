"use client";

import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { useState } from "react";
import type { Availability } from "@/lib/availability";

export function BookingForm({
    resourceId,
    availability,
    range,
    onBooked,
}: {
    resourceId: number;
    availability: Availability;
    range: { start: string; end: string } | null;
    onBooked: () => void;
}) {
    const [purpose, setPurpose] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    if (sent) {
        return (
            <div role="status" className="flex items-start gap-3 rounded-lg bg-free-soft p-3 text-sm text-free-ink">
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                <div>
                    <p className="font-medium">Request sent</p>
                    <p>An admin will review it. You can follow it under your bookings.</p>
                </div>
            </div>
        );
    }

    // booked and unavailable slots cannot be requested; the panel already explains why
    if (availability === "booked" || availability === "maintenance") return null;

    if (!range) {
        return <p className="text-sm text-muted">Fix the time window above to request this space.</p>;
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending || !range) return;

        setPending(true);
        setError(null);
        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resourceId,
                    startTime: range.start,
                    endTime: range.end,
                    purpose,
                }),
            });

            if (response.ok) {
                setSent(true);
                onBooked(); // the page refetches, so this slot now shows as requested
                return;
            }

            const body = await response.json().catch(() => ({}));
            const fields = body.fields ?? {};
            setError(
                fields.purpose?.[0] ?? fields.startTime?.[0] ?? fields.endTime?.[0] ?? body.error ?? "Could not send the request"
            );
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    return (
        <form onSubmit={submit} className="space-y-3" noValidate>
            <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">Purpose</span>
                <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={2}
                    maxLength={300}
                    placeholder="What will you use it for?"
                    className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/70 hover:border-ink/25 focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
            </label>

            <p role="alert" aria-live="polite" className="min-h-5 text-sm text-booked">
                {error}
            </p>

            <button
                type="submit"
                disabled={pending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
                {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                {pending ? "Sending request" : "Request booking"}
            </button>
        </form>
    );
}
