import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppNav, type NavItem } from "@/components/app-nav";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <Shell>{children}</Shell>
        </Suspense>
    );
}

async function Shell({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const items: NavItem[] = [{ href: "/spaces", label: "Spaces", icon: "spaces" }];

    return (
        <div className="min-h-screen">
            <AppNav items={items} userName={user.name} role={user.role} />
            <main className="px-4 pb-24 pt-6 md:ml-64 md:px-8 md:pb-10">{children}</main>
        </div>
    );
}

