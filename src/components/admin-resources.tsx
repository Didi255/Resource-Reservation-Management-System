"use client";

import { CheckCircle, CircleNotch, MapPin, Plus, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlanPicker } from "@/components/plan-picker";
import { AVAILABILITY_PILL } from "@/lib/availability";

type ResourceStatus = "available" | "under_maintenance" | "retired";

type Resource = {
    id: number;
    name: string;
    location: string;
    description: string | null;
    status: ResourceStatus;
    conditionNotes: string | null;
    categoryId: number;
    categoryName: string;
    planX: number | null;
    planY: number | null;
};

type Category = { id: number; name: string };

const STATUS: Record<ResourceStatus, { label: string; pill: string }> = {
    available: { label: "Available", pill: AVAILABILITY_PILL.free },
    under_maintenance: { label: "Maintenance", pill: AVAILABILITY_PILL.pending },
    retired: { label: "Retired", pill: AVAILABILITY_PILL.maintenance },
};

type Editing = { mode: "create" } | { mode: "edit"; resource: Resource };

export function AdminResources() {
    const [resources, setResources] = useState<Resource[] | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [showRetired, setShowRetired] = useState(false);
    const [editing, setEditing] = useState<Editing | null>(null);
    const [retiring, setRetiring] = useState<Resource | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            fetch("/api/resources", { signal: controller.signal }),
            fetch("/api/categories", { signal: controller.signal }),
        ])
            .then(async ([resourcesRes, categoriesRes]) => {
                const resourcesBody = await resourcesRes.json();
                const categoriesBody = await categoriesRes.json();
                if (!resourcesRes.ok) throw new Error(resourcesBody.error ?? "Could not load resources");
                if (!categoriesRes.ok) throw new Error(categoriesBody.error ?? "Could not load categories");
                setResources(resourcesBody.resources);
                setCategories(categoriesBody.categories);
                setError(null);
            })
            .catch((e) => {
                if (e.name !== "AbortError") setError(e.message);
            });

        return () => controller.abort();
    }, [refreshKey]);

    const refresh = () => setRefreshKey((k) => k + 1);

    const groups = useMemo(() => {
        const map = new Map<string, Resource[]>();
        for (const r of resources ?? []) {
            if (r.status === "retired" && !showRetired) continue;
            const list = map.get(r.categoryName) ?? [];
            list.push(r);
            map.set(r.categoryName, list);
        }
        return [...map.entries()];
    }, [resources, showRetired]);

    const retiredCount = (resources ?? []).filter((r) => r.status === "retired").length;

    async function restore(resource: Resource) {
        const response = await fetch(`/api/resources/${resource.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "available" }),
        });
        if (response.ok) {
            setNotice(`Restored ${resource.name}. It can be booked again.`);
            refresh();
        } else {
            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Could not restore this resource");
        }
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <header>
                    <p className="font-mono text-sm uppercase tracking-wider text-muted">Admin</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Manage <span className="text-primary">resources</span>
                    </h1>
                    <p className="mt-2 max-w-[65ch] text-base text-muted sm:text-lg">
                        Add rooms, equipment and vehicles, and retire the ones you no longer offer.
                    </p>
                </header>

                <button
                    type="button"
                    onClick={() => setEditing({ mode: "create" })}
                    className="flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98]"
                >
                    <Plus size={16} weight="bold" aria-hidden />
                    Add resource
                </button>
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

            {retiredCount > 0 && (
                <label className="flex w-fit items-center gap-2 text-sm text-muted">
                    <input
                        type="checkbox"
                        checked={showRetired}
                        onChange={(e) => setShowRetired(e.target.checked)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    Show retired ({retiredCount})
                </label>
            )}

            {resources === null && error === null && (
                <div className="space-y-3" aria-hidden>
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="skeleton h-[72px]" />
                    ))}
                </div>
            )}

            {resources !== null && groups.length === 0 && (
                <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-12 text-center">
                    <p className="font-medium">No resources yet</p>
                    <p className="mt-1 text-sm text-muted">Add the first room, desk, device or vehicle.</p>
                </div>
            )}

            {groups.map(([category, items]) => (
                <section key={category}>
                    <h2 className="mb-2 flex items-baseline gap-2 text-base font-semibold tracking-tight">
                        {category}
                        <span className="font-mono text-xs font-normal text-muted">{items.length}</span>
                    </h2>

                    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                        {items.map((r) => (
                            <li
                                key={r.id}
                                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className={`font-medium ${r.status === "retired" ? "text-muted" : ""}`}>
                                            {r.name}
                                        </p>
                                        <span
                                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium uppercase leading-4 tracking-wider ${STATUS[r.status].pill}`}
                                        >
                                            {STATUS[r.status].label}
                                        </span>
                                        {r.planX !== null && (
                                            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium uppercase leading-4 tracking-wider text-primary">
                                                On plan
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                                        <MapPin size={14} className="shrink-0" aria-hidden />
                                        {r.location}
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-2 max-sm:w-full">
                                    <button
                                        type="button"
                                        onClick={() => setEditing({ mode: "edit", resource: r })}
                                        className="h-10 rounded-lg border border-line px-3.5 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 max-sm:flex-1"
                                    >
                                        Edit
                                    </button>
                                    {r.status === "retired" ? (
                                        <button
                                            type="button"
                                            onClick={() => restore(r)}
                                            className="h-10 rounded-lg border border-line px-3.5 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 max-sm:flex-1"
                                        >
                                            Restore
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setRetiring(r)}
                                            className="h-10 rounded-lg border border-line px-3.5 text-sm font-medium outline-none transition hover:border-booked/40 hover:bg-booked-soft hover:text-booked-ink focus-visible:ring-2 focus-visible:ring-primary/40 max-sm:flex-1"
                                        >
                                            Retire
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {editing && (
                <ResourceDialog
                    key={editing.mode === "edit" ? `edit-${editing.resource.id}` : "create"}
                    editing={editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                    onSaved={(message) => {
                        setNotice(message);
                        setEditing(null);
                        refresh();
                    }}
                />
            )}

            {retiring && (
                <RetireDialog
                    key={retiring.id}
                    resource={retiring}
                    onClose={() => setRetiring(null)}
                    onDone={() => {
                        setNotice(`Retired ${retiring.name}. It no longer appears for booking.`);
                        setRetiring(null);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

const FIELD =
    "w-full rounded-lg border bg-surface px-3 text-sm outline-none transition placeholder:text-muted/70 hover:border-ink/25 focus:border-primary focus:ring-4 focus:ring-primary/15";

function ResourceDialog({
    editing,
    categories,
    onClose,
    onSaved,
}: {
    editing: Editing;
    categories: Category[];
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const existing = editing.mode === "edit" ? editing.resource : null;

    const [categoryId, setCategoryId] = useState<number | "">(existing?.categoryId ?? categories[0]?.id ?? "");
    const [name, setName] = useState(existing?.name ?? "");
    const [location, setLocation] = useState(existing?.location ?? "");
    const [description, setDescription] = useState(existing?.description ?? "");
    const [status, setStatus] = useState<ResourceStatus>(existing?.status ?? "available");
    const [conditionNotes, setConditionNotes] = useState(existing?.conditionNotes ?? "");
    const [planX, setPlanX] = useState<number | null>(existing?.planX ?? null);
    const [planY, setPlanY] = useState<number | null>(existing?.planY ?? null);

    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fields, setFields] = useState<Record<string, string[] | undefined>>({});

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;

        setPending(true);
        setError(null);
        setFields({});

        const body: Record<string, unknown> = {
            name,
            location,
            description,
        };
        if (existing) {
            body.status = status;
            body.conditionNotes = conditionNotes;
            body.planX = planX; // null with null clears the position
            body.planY = planY;
        } else {
            body.categoryId = categoryId;
            if (planX !== null && planY !== null) {
                body.planX = planX;
                body.planY = planY;
            }
        }

        try {
            const response = await fetch(existing ? `/api/resources/${existing.id}` : "/api/resources", {
                method: existing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (response.ok) {
                onSaved(existing ? `Saved ${name}.` : `Added ${name}.`);
                return;
            }
            const result = await response.json().catch(() => ({}));
            setError(result.error ?? "Something went wrong");
            setFields(result.fields ?? {});
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    const fieldError = (key: string) =>
        fields[key]?.[0] ? <span className="mt-1 block text-sm text-booked">{fields[key]?.[0]}</span> : null;
    const border = (key: string) => (fields[key]?.[0] ? "border-booked" : "border-line");
    const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="resource-title"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget && !pending) e.currentTarget.close();
            }}
            className="m-auto max-h-[92dvh] w-[min(94vw,560px)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
        >
            <form onSubmit={submit} noValidate className="space-y-4 p-5">
                <h2 id="resource-title" className="text-lg font-semibold tracking-tight">
                    {existing ? `Edit ${existing.name}` : "Add a resource"}
                </h2>

                {!existing ? (
                    <label className="block">
                        <span className={label}>Category</span>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            className={`h-11 ${FIELD} ${border("categoryId")}`}
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {fieldError("categoryId")}
                    </label>
                ) : (
                    <p className="text-sm text-muted">
                        Category: <span className="font-medium text-ink">{existing.categoryName}</span>
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className={label}>Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            className={`h-11 ${FIELD} ${border("name")}`}
                        />
                        {fieldError("name")}
                    </label>
                    <label className="block">
                        <span className={label}>Location</span>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            maxLength={100}
                            placeholder="Floor 2, East wing"
                            className={`h-11 ${FIELD} ${border("location")}`}
                        />
                        {fieldError("location")}
                    </label>
                </div>

                <label className="block">
                    <span className={label}>Description (optional)</span>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className={`resize-none py-2.5 ${FIELD} ${border("description")}`}
                    />
                    {fieldError("description")}
                </label>

                {existing && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className={label}>Status</span>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                                className={`h-11 ${FIELD} border-line`}
                            >
                                <option value="available">Available</option>
                                <option value="under_maintenance">Under maintenance</option>
                                <option value="retired">Retired</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className={label}>Condition notes (optional)</span>
                            <input
                                value={conditionNotes}
                                onChange={(e) => setConditionNotes(e.target.value)}
                                maxLength={500}
                                className={`h-11 ${FIELD} ${border("conditionNotes")}`}
                            />
                        </label>
                    </div>
                )}

                <div>
                    <span className={label}>Position on the floor plan (optional)</span>
                    <PlanPicker
                        x={planX}
                        y={planY}
                        onChange={(x, y) => {
                            setPlanX(x);
                            setPlanY(y);
                        }}
                    />
                    {fieldError("planX")}
                </div>

                <p role="alert" aria-live="polite" className="min-h-5 text-sm text-booked">
                    {error}
                </p>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => dialogRef.current?.close()}
                        disabled={pending}
                        className="h-10 rounded-lg border border-line px-4 text-sm font-medium outline-none transition hover:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={pending}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98] disabled:opacity-70"
                    >
                        {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                        {existing ? "Save changes" : "Add resource"}
                    </button>
                </div>
            </form>
        </dialog>
    );
}

function RetireDialog({
    resource,
    onClose,
    onDone,
}: {
    resource: Resource;
    onClose: () => void;
    onDone: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    async function retire() {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            const response = await fetch(`/api/resources/${resource.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "retired" }),
            });
            if (response.ok) {
                onDone();
                return;
            }
            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Could not retire this resource");
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="retire-title"
            onClose={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget && !pending) e.currentTarget.close();
            }}
            className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/30"
        >
            <div className="p-5">
                <h2 id="retire-title" className="text-lg font-semibold tracking-tight">
                    Retire {resource.name}?
                </h2>
                <p className="mt-2 text-sm text-muted">
                    It will no longer appear for booking. Its booking history is kept, and bookings that already
                    exist are not cancelled. You can restore it at any time.
                </p>

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
                        Keep it
                    </button>
                    <button
                        type="button"
                        onClick={retire}
                        disabled={pending}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-booked px-4 text-sm font-semibold text-white outline-none transition hover:bg-booked-ink focus-visible:ring-4 focus-visible:ring-booked/30 active:scale-[0.98] disabled:opacity-70"
                    >
                        {pending && <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />}
                        Retire resource
                    </button>
                </div>
            </div>
        </dialog>
    );
}
