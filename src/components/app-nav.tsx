"use client";

import {
    CalendarBlank,
    CheckCircle,
    MapTrifold,
    SidebarSimple,
    SignOut,
    SquaresFour,
    type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type NavItem = { href: string; label: string; icon: "plan" | "list" | "bookings" | "approvals" };

const ICONS: Record<NavItem["icon"], Icon> = {
    plan: MapTrifold,
    list: SquaresFour,
    bookings: CalendarBlank,
    approvals: CheckCircle,
};

export function AppNav({
    items,
    userName,
    role,
    collapsed,
    onToggle,
}: {
    items: NavItem[];
    userName: string;
    role: string;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <>
            {/* Desktop: sidebar, full width or an icon rail */}
            <aside
                className={`fixed inset-y-0 left-0 hidden flex-col border-r border-line bg-surface py-5 transition-[width] duration-200 lg:flex ${
                    collapsed ? "w-[72px] px-2" : "w-60 px-3"
                }`}
            >
                <div className={`pb-6 text-xl font-semibold tracking-tight ${collapsed ? "text-center" : "px-3"}`}>
                    {collapsed ? (
                        <span className="text-primary" aria-label="ReserveHub">
                            R
                        </span>
                    ) : (
                        <>
                            <span className="text-primary">Reserve</span>Hub
                        </>
                    )}
                </div>

                <nav className="flex flex-1 flex-col gap-1">
                    {items.map((item) => {
                        const active = pathname.startsWith(item.href);
                        const Icon = ICONS[item.icon];
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                aria-label={collapsed ? item.label : undefined}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center rounded-lg py-2.5 text-base transition-colors ${
                                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                                } ${
                                    active
                                        ? "bg-primary-soft font-medium text-primary"
                                        : "text-muted hover:bg-background hover:text-ink"
                                }`}
                            >
                                <Icon size={22} weight={active ? "fill" : "regular"} className="shrink-0" />
                                {!collapsed && item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-line pt-4">
                    {!collapsed && (
                        <div className="px-3">
                            <p className="truncate text-base font-medium">{userName}</p>
                            <p className="font-mono text-xs uppercase tracking-wider text-muted">{role}</p>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        title={collapsed ? "Sign out" : undefined}
                        aria-label="Sign out"
                        className={`mt-3 flex w-full items-center rounded-lg py-2.5 text-base text-muted transition-colors hover:bg-background hover:text-ink ${
                            collapsed ? "justify-center" : "gap-3 px-3"
                        }`}
                    >
                        <SignOut size={22} className="shrink-0" />
                        {!collapsed && "Sign out"}
                    </button>

                    <button
                        onClick={onToggle}
                        aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
                        aria-pressed={collapsed}
                        title={collapsed ? "Show sidebar" : undefined}
                        className={`mt-1 flex w-full items-center rounded-lg py-2.5 text-base text-muted transition-colors hover:bg-background hover:text-ink ${
                            collapsed ? "justify-center" : "gap-3 px-3"
                        }`}
                    >
                        <SidebarSimple size={22} weight={collapsed ? "regular" : "fill"} className="shrink-0" />
                        {!collapsed && "Hide sidebar"}
                    </button>
                </div>
            </aside>

            {/* Phone and tablet: bottom tab bar */}
            <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = ICONS[item.icon];
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[13px] font-medium ${
                                active ? "text-primary" : "text-muted"
                            }`}
                        >
                            <Icon size={22} weight={active ? "fill" : "regular"} />
                            {item.label}
                        </Link>
                    );
                })}
                <button
                    onClick={logout}
                    className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[13px] font-medium text-muted"
                >
                    <SignOut size={22} />
                    Sign out
                </button>
            </nav>
        </>
    );
}
