"use client";

import { CalendarBlank, CheckCircle, MapTrifold, SignOut, SquaresFour, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = { href: string; label: string; icon: "plan" | "list" | "bookings" | "approvals" };

const ICONS: Record<NavItem["icon"], Icon> = {
    plan: MapTrifold,
    list: SquaresFour,
    bookings: CalendarBlank,
    approvals: CheckCircle,
};

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
            <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
                <div className="px-3 pb-6 text-lg font-semibold tracking-tight">
                    <span className="text-primary">Reserve</span>Hub
                </div>

                <nav className="flex flex-1 flex-col gap-0.5">
                    {items.map((item) => {
                        const active = pathname.startsWith(item.href);
                        const Icon = ICONS[item.icon];
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    active
                                        ? "bg-primary-soft font-medium text-primary"
                                        : "text-muted hover:bg-background hover:text-ink"
                                }`}
                            >
                                <Icon size={18} weight={active ? "fill" : "regular"} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-line px-3 pt-4">
                    <p className="truncate text-sm font-medium">{userName}</p>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted">{role}</p>
                    <button
                        onClick={logout}
                        className="-ml-2 mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-ink"
                    >
                        <SignOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Phone: bottom tab bar */}
            <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = ICONS[item.icon];
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                                active ? "text-primary" : "text-muted"
                            }`}
                        >
                            <Icon size={20} weight={active ? "fill" : "regular"} />
                            {item.label}
                        </Link>
                    );
                })}
                <button
                    onClick={logout}
                    className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted"
                >
                    <SignOut size={20} />
                    Sign out
                </button>
            </nav>
        </>
    );
}
