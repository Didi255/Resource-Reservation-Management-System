"use client";

import { CircleNotch, Eye, EyeSlash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";
type FieldErrors = Record<string, string[] | undefined>;

const COPY = {
    login: {
        title: "Welcome back",
        subtitle: "Sign in to book rooms, desks, equipment, and vehicles.",
        submit: "Sign in",
        pending: "Signing in",
        endpoint: "/api/auth/login",
        switchText: "New here?",
        switchLink: "Create an account",
        switchHref: "/register",
    },
    register: {
        title: "Create your account",
        subtitle: "Members can request bookings. An admin approves them.",
        submit: "Create account",
        pending: "Creating account",
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
        if (pending) return; // one request at a time

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
                return; // stay in the pending state while the page changes
            }

            const body = await response.json().catch(() => ({}));
            setError(body.error ?? "Something went wrong");
            setFields(body.fields ?? {});
        } catch {
            setError("Could not reach the server. Try again.");
        }
        setPending(false);
    }

    return (
        <div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{copy.title}</h1>
            <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-muted sm:text-base">{copy.subtitle}</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
                {mode === "register" && (
                    <Field label="Full name" name="name" autoComplete="name" errors={fields.name} />
                )}
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    errors={fields.email}
                />
                {mode === "register" && (
                    <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" errors={fields.phone} />
                )}
                <PasswordField
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    errors={fields.password}
                />

                {/* one reserved line, so an error appearing does not move the button */}
                <p role="alert" aria-live="polite" className="min-h-5 text-sm text-booked">
                    {error}
                </p>

                <button
                    type="submit"
                    disabled={pending}
                    className="flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white outline-none transition hover:bg-primary-hover focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {pending && <CircleNotch size={18} weight="bold" className="animate-spin" aria-hidden />}
                    {pending ? copy.pending : copy.submit}
                </button>
            </form>

            <p className="mt-6 text-sm text-muted">
                {copy.switchText}{" "}
                <Link
                    href={copy.switchHref}
                    className="rounded font-medium text-primary outline-none hover:text-primary-hover hover:underline focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                    {copy.switchLink}
                </Link>
            </p>
        </div>
    );
}

const INPUT =
    "h-12 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 hover:border-ink/25 focus:border-primary focus:ring-4 focus:ring-primary/15";

function Field({
    label,
    name,
    type = "text",
    autoComplete,
    placeholder,
    errors,
}: {
    label: string;
    name: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    errors?: string[];
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium">{label}</span>
            <input
                name={name}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                aria-invalid={errors?.[0] ? true : undefined}
                className={INPUT}
            />
            {errors?.[0] && <span className="mt-1.5 block text-sm text-booked">{errors[0]}</span>}
        </label>
    );
}

function PasswordField({ autoComplete, errors }: { autoComplete: string; errors?: string[] }) {
    const [visible, setVisible] = useState(false);

    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <div className="relative">
                <input
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    aria-invalid={errors?.[0] ? true : undefined}
                    className={`${INPUT} pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    aria-pressed={visible}
                    className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                    {visible ? <EyeSlash size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
            </div>
            {errors?.[0] && <span className="mt-1.5 block text-sm text-booked">{errors[0]}</span>}
        </label>
    );
}
