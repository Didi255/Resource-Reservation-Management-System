import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="grid min-h-[100dvh] lg:grid-cols-2">
            <section className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className="w-full max-w-sm">{children}</div>
            </section>
            <aside className="hidden flex-col items-center justify-center gap-6 bg-surface p-12 lg:flex">
                <Image
                    src="/art/login-hero.webp"
                    alt="Isometric illustration of a glass meeting room"
                    width={1000}
                    height={1000}
                    priority
                    className="h-auto w-full max-w-lg"
                />
                <p className="max-w-sm text-center text-muted">
                    See what is free, book it, and get an answer from an admin. No double bookings.
                </p>

            </aside>
            <Suspense>
                <RedirectIfSignedIn />
            </Suspense>
        </main>
    );
}

async function RedirectIfSignedIn() {
    if (await getCurrentUser()) redirect("/spaces");
    return null;
}
