import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminApprovals } from "@/components/admin-approvals";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Approvals" };

// The cookie read has to sit behind Suspense (Cache Components), so the guard is its own component.
async function AdminOnly({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();
    if (user?.role !== "admin") redirect("/spaces");
    return children;
}

export default function ApprovalsPage() {
    return (
        <Suspense fallback={null}>
            <AdminOnly>
                <AdminApprovals />
            </AdminOnly>
        </Suspense>
    );
}
