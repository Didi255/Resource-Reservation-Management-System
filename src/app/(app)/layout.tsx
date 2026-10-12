import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
            <Shell>{children}</Shell>
        </Suspense>
    );
}

async function Shell({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const items: NavItem[] = [
        { href: "/spaces", label: "Spaces", icon: "plan" },
        { href: "/resources", label: "Resources", icon: "list" },
        { href: "/bookings", label: "My bookings", icon: "bookings" },
    ];

    return (
        <AppShell items={items} userName={user.name} role={user.role}>
            {children}
        </AppShell>
    );
}

