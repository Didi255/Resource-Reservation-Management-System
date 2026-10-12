"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";
type FieldErrors = Record<string, string[] | undefined>;

const COPY = {
    login: {
        title: "Welcome back",
        subtitle: "Sign in to book rooms, desks, equipment and vehicles.",
        submit: "Sign in",
        endpoint: "/api/auth/login",
        switchText: "New here?",
        switchLink: "Create an account",
        switchHref: "/register",
    },
    register: {
        title: "Create your account",
        subtitle: "Members can request bookings. An admin approves them.",
        submit: "Create account",
        endpoint: "/api/auth/register",
        switchText: "Already have an account?",
        switchLink: "Sign in",
        switchHref: "/login",
    },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
    const copy = COPY[mode];
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldErrors>({});
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setFields({});
        setPending(true);

        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
            const response = await fetch(copy.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/spaces");
                router.refresh();
                return;
            }

            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Something went wrong");
            setFields(body.fields ?? {});
        } catch {
            setError("Could not reach the server. Try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-2 text-muted">{copy.subtitle}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
                {mode === "register" && (
                    <Field label="Full name" name="name" autoComplete="name" errors={fields.name} />
                )}
                <Field label="Email" name="email" type="email" autoComplete="email" errors={fields.email} />
                {mode === "register" && (
                    <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" errors={fields.phone} />
                )}
                <Field
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    errors={fields.password}
                />

                {error && (
                    <p role="alert" className="rounded-lg bg-booked-soft px-3 py-2 text-sm text-booked-ink">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
                >
                    {pending ? "Please wait..." : copy.submit}
                </button>
            </form>

            <p className="mt-6 text-sm text-muted">
                {copy.switchText}{" "}
                <Link href={copy.switchHref} className="font-medium text-primary hover:underline">
                    {copy.switchLink}
                </Link>
            </p>
        </div>
    );
}

function Field({
    label,
    name,
    type = "text",
    autoComplete,
    errors,
}: {
    label: string;
    name: string;
    type?: string;
    autoComplete?: string;
    errors?: string[];
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium">{label}</span>
            <input
                name={name}
                type={type}
                autoComplete={autoComplete}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {errors?.[0] && <span className="mt-1 block text-sm text-booked">{errors[0]}</span>}
        </label>
    );
}
