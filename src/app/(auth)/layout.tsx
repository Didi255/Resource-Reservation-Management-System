import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="grid min-h-[100dvh] lg:grid-cols-2">
            {/* Form side */}
            <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-10">
                <div className="w-full max-w-[420px]">
                    <div className="mb-10 text-lg font-semibold tracking-tight">
                        <span className="text-primary">Reserve</span>Hub
                    </div>
                    {children}
                </div>
            </section>

            {/* Illustration side: white, so the picture's own white background disappears into it */}
            <aside className="hidden flex-col items-center justify-center gap-8 bg-surface px-12 py-16 lg:flex">
                <Image
                    src="/art/login-hero.webp"
                    alt="Isometric illustration of a glass meeting room"
                    width={1000}
                    height={1000}
                    priority
                    className="h-auto w-full max-w-[440px]"
                />
                <div className="max-w-sm text-center">
                    <p className="text-lg font-semibold tracking-tight">
                        See what&apos;s available. Book with confidence.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        Find a space, submit your booking, and get confirmation from an admin, without double
                        bookings.
                    </p>
                </div>
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
