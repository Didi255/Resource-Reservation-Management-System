"use client";

import {
    CalendarBlank,
    CheckCircle,
    CircleNotch,
    Clock,
    Note,
    User,
    Users,
    WarningCircle,
    X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AVAILABILITY_PILL } from "@/lib/availability";

type Tab = "pending" | "approved";

type Reservation = {
    id: number;
    startTime: string;
    endTime: string;
    purpose: string;
    status: "pending" | "approved";
    createdAt: string;
    resourceId: number;
    resourceName: string;
    userName: string;
    userEmail: string;
    userPhone: string | null;
};

const day = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const stamp = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** What an open dialog is about: reject a request or cancel an approved booking. */
type Target = { kind: "reject" | "cancel"; booking: Reservation };

export function AdminApprovals() {
    const [tab, setTab] = useState<Tab>("pending");
    const [items, setItems] = useState<Reservation[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [target, setTarget] = useState<Target | null>(null);
    const [now] = useState(() => Date.now()); // fixed at mount: hides bookings that already ended

    useEffect(() => {
        const controller = new AbortController();

        fetch(`/api/reservations?status=${tab}`, { signal: controller.signal })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? "Could not load reservations");
                setItems(body.reservations);
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort();
    }, [tab, refreshKey]);

    const list = useMemo(() => {
        const all = (items ?? []).filter((r) => new Date(r.endTime).getTime() > now);
        return all.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [items, now]);

    // For each pending request: how many other pending requests want the same resource at an overlapping time.
    const competing = useMemo(() => {
        const result = new Map<number, number>();
        for (const a of list) {
            const others = list.filter(
                (b) =>
                    b.id !== a.id &&
                    b.resourceId === a.resourceId &&
                    new Date(a.startTime) < new Date(b.endTime) &&
                    new Date(b.startTime) < new Date(a.endTime)
            );
            result.set(a.id, others.length);
        }
        return result;
    }, [list]);

    const refresh = () => setRefreshKey((k) => k + 1);

    function switchTab(next: Tab) {
        setItems(null); // show the placeholder instead of the other tab's list
        setError(null);
        setTab(next);
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header>
                <p className="font-mono text-sm uppercase tracking-wider text-muted">Admin</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Review <span className="text-primary">requests</span>
                </h1>
                <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                    Approve or reject booking requests, and cancel approved bookings when you have to.
                </p>
            </header>

            <div role="group" aria-label="Show" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
                {(["pending", "approved"] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={tab === option}
                        onClick={() => switchTab(option)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            tab === option ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

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

            {items === null && error === null && (
                <div className="space-y-3" aria-hidden>
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="skeleton h-[128px]" />
                    ))}
                </div>
            )}

            {items !== null && list.length === 0 && (
                <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-12 text-center">
                    <p className="font-medium">
                        {tab === "pending" ? "No requests waiting" : "No upcoming approved bookings"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                        {tab === "pending"
                            ? "New requests from members will appear here."
                            : "Approved bookings that are still ahead will appear here."}
                    </p>
                </div>
            )}

            {list.length > 0 && (
                <ul className="space-y-3">
                    {list.map((r) => (
                        <ReservationCard
                            key={r.id}
                            reservation={r}
                            competing={competing.get(r.id) ?? 0}
                            onApproved={() => {
                                setNotice(`Approved ${r.resourceName} for ${r.userName}.`);
                                refresh();
                            }}
                            onReject={() => setTarget({ kind: "reject", booking: r })}
                            onCancel={() => setTarget({ kind: "cancel", booking: r })}
                        />
                    ))}
                </ul>
            )}

            {target && (
                <ReasonDialog
                    key={`${target.kind}-${target.booking.id}`}
                    target={target}
                    onClose={() => setTarget(null)}
                    onDone={(message) => {
                        setNotice(message);
                        setTarget(null);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function ReservationCard({
    reservation: r,
    competing,
    onApproved,
    onReject,
    onCancel,
}: {
    reservation: Reservation;
    competing: number;
    onApproved: () => void;
    onReject: () => void;
    onCancel: () => void;
}) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function approve() {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            const response = await fetch(`/api/reservations/${r.id}/approve`, { method: "POST" });
            if (response.ok) {
                onApproved();
                return;
            }
            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Could not approve this request");
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    const outline =
        "h-10 rounded-lg border border-line px-3.5 text-sm font-medium outline-none transition hover:border-booked/40 hover:bg-booked-soft hover:text-booked-ink focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] max-sm:flex-1";

    return (
        <li className="reveal rounded-xl border border-line bg-surface p-4 transition-colors hover:border-ink/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-medium leading-snug">{r.resourceName}</h3>
                        <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase leading-4 tracking-wider ${
                                r.status === "pending" ? AVAILABILITY_PILL.pending : AVAILABILITY_PILL.free
                            }`}
                        >
                            {r.status === "pending" ? "Requested" : "Approved"}
                        </span>
                        {r.status === "pending" && competing > 0 && (
                            <span className="flex items-center gap-1.5 rounded-md bg-booked-soft px-2 py-0.5 text-xs font-medium text-booked-ink">
                                <Users size={14} aria-hidden />
                                Competes with {competing} other {competing === 1 ? "request" : "requests"}
                            </span>
                        )}
                    </div>

                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <User size={16} className="shrink-0 text-muted" aria-hidden />
                        <span className="font-medium">{r.userName}</span>
                        <span className="text-muted">
                            {r.userEmail}
                            {r.userPhone ? ` · ${r.userPhone}` : ""}
                        </span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                        <CalendarBlank size={16} weight="bold" className="shrink-0 text-primary" aria-hidden />
                        <span>
                            {day(r.startTime)}, {time(r.startTime)} to {time(r.endTime)}
                        </span>
                    </p>
                    <p className="flex items-start gap-2 text-sm text-muted">
                        <Note size={16} className="mt-0.5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words">{r.purpose}</span>
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted">
                        <Clock size={14} className="shrink-0" aria-hidden />
                        Requested {stamp(r.createdAt)}
                    </p>
                </div>

                <div className="flex shrink-0 gap-2 max-sm:w-full">
                    {r.status === "pending" ? (
                        <>
                            <button type="button" onClick={onReject} disabled={pending} className={outline}>
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={approve}
                                disabled={pending}
                                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-70 max-sm:flex-1"
                            >
                                {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                                {pending ? "Approving" : "Approve"}
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={onCancel} className={outline}>
                            Cancel booking
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                    <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
                    {error}
                </p>
            )}
        </li>
    );
}

/** One dialog for both reasons. Reject: reason optional. Cancel an approved booking: required. */
function ReasonDialog({
    target,
    onClose,
    onDone,
}: {
    target: Target;
    onClose: () => void;
    onDone: (message: string) => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [reason, setReason] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { kind, booking } = target;
    const isCancel = kind === "cancel";

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    async function confirm() {
        if (pending) return;

        const trimmed = reason.trim();
        if (isCancel && !trimmed) {
            setError("Give a reason. The member will see it.");
            return;
        }

        setPending(true);
        setError(null);
        try {
            const response = await fetch(`/api/reservations/${booking.id}/${isCancel ? "cancel" : "reject"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // an empty reason is not allowed by the API, so leave the field out instead
                body: JSON.stringify(trimmed ? { reason: trimmed } : {}),
            });
            if (response.ok) {
                onDone(
                    `${isCancel ? "Cancelled" : "Rejected"} ${booking.resourceName} for ${booking.userName}.`
                );
                return;
            }
            const body = await response.json().catch(() => ({}));
            setError(body.fields?.reason?.[0] ?? body.error ?? "Something went wrong");
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="reason-title"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget && !pending) e.currentTarget.close();
            }}
            className="m-auto w-[min(92vw,440px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
        >
            <div className="p-5">
                <h2 id="reason-title" className="text-lg font-semibold tracking-tight">
                    {isCancel ? "Cancel this booking?" : "Reject this request?"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                    {isCancel
                        ? "The slot is released and the member is told it was cancelled. A reason is required."
                        : "The member is told the request was rejected. Adding a reason helps them."}
                </p>

                <div className="mt-4 space-y-1 rounded-lg bg-background px-3 py-2.5 text-sm">
                    <p className="font-medium">
                        {booking.resourceName} <span className="font-normal text-muted">for {booking.userName}</span>
                    </p>
                    <p className="text-muted">
                        {day(booking.startTime)}, {time(booking.startTime)} to {time(booking.endTime)}
                    </p>
                </div>

                <label className="mt-4 block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                        Reason{isCancel ? "" : " (optional)"}
                    </span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={300}
                        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/70 hover:border-ink/25 focus:border-primary focus:ring-4 focus:ring-primary/15"
                        placeholder={isCancel ? "Why is this being cancelled?" : "Why is this being rejected?"}
                    />
                </label>

                <p role="alert" aria-live="polite" className="mt-2 min-h-5 text-sm text-booked">
                    {error}
                </p>

                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => dialogRef.current?.close()}
                        disabled={pending}
                        className="h-10 rounded-lg border border-line px-4 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                    >
                        Go back
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={pending}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-booked px-4 text-sm font-semibold text-white outline-none transition hover:bg-booked-ink focus-visible:ring-4 focus-visible:ring-booked/30 active:scale-[0.98] disabled:opacity-70"
                    >
                        {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                        {isCancel ? "Cancel booking" : "Reject request"}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
