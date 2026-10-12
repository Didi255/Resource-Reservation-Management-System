"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = { href: string; label: string; icon: "spaces" | "bookings" | "approvals" };

const ICONS: Record<NavItem["icon"], string> = {
    spaces: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
    bookings: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    approvals: "M5 13l4 4L19 7",
};

const SIGN_OUT_ICON = "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9";

function Icon({ path }: { path: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d={path} />
        </svg>
    );
}

export function AppNav({ items, userName, role }: { items: NavItem[]; userName: string; role: string }) {
    const pathname = usePathname();
    const router = useRouter();

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <>
            {/* Desktop: sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface p-4 md:flex">
                <div className="px-2 py-3 text-lg font-semibold tracking-tight">
                    <span className="text-primary">Reserve</span>Hub
                </div>

                <nav className="mt-6 flex flex-1 flex-col gap-1">
                    {items.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                                    active ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-ink"
                                }`}
                            >
                                <Icon path={ICONS[item.icon]} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-line pt-4">
                    <p className="truncate px-2 text-sm font-medium">{userName}</p>
                    <p className="px-2 text-xs capitalize text-muted">{role}</p>
                    <button
                        onClick={logout}
                        className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition hover:bg-background hover:text-ink"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Phone: bottom tab bar */}
            <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
                {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                                active ? "text-primary" : "text-muted"
                            }`}
                        >
                            <Icon path={ICONS[item.icon]} />
                            {item.label}
                        </Link>
                    );
                })}
                <button
                    onClick={logout}
                    className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted"
                >
                    <Icon path={SIGN_OUT_ICON} />
                    Sign out
                </button>
            </nav>
        </>
    );
}
