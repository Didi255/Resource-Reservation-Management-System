"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { AppNav, type NavItem } from "@/components/app-nav";

const KEY = "sidebar-collapsed";
const listeners = new Set<() => void>();

// The collapsed choice lives in localStorage so it survives a reload. Wrapped in try/catch
// because storage can be blocked (private windows, strict settings); then it just resets.
function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
}

function getSnapshot() {
    try {
        return localStorage.getItem(KEY) === "1";
    } catch {
        return false;
    }
}

function setCollapsed(value: boolean) {
    try {
        localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
        // storage unavailable: the toggle still works for this page view
    }
    listeners.forEach((listener) => listener());
}

export function AppShell({
    items,
    userName,
    role,
    children,
}: {
    items: NavItem[];
    userName: string;
    role: string;
    children: ReactNode;
}) {
    // false on the server, the saved value in the browser
    const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

    return (
        <div className="min-h-[100dvh]">
            <AppNav
                items={items}
                userName={userName}
                role={role}
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />
            <main
                className={`px-4 pb-24 pt-6 transition-[margin] duration-200 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 ${
                    collapsed ? "lg:ml-[72px]" : "lg:ml-60"
                }`}
            >
                {children}
            </main>
        </div>
    );
}
