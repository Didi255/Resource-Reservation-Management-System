import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Server-side guard for admin pages. The cookie read has to sit behind a Suspense boundary
 * (Cache Components), so every admin page wraps this in <Suspense>. The API enforces the
 * role as well; this only stops a member seeing an empty admin screen.
 */
export async function AdminOnly({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (user?.role !== "admin") redirect("/spaces");
    return children;
}
