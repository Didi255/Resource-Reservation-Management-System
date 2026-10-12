import { Suspense } from "react";
import { AdminApprovals } from "@/components/admin-approvals";
import { AdminOnly } from "@/components/admin-only";

export const metadata = { title: "Approvals" };

export default function ApprovalsPage() {
    return (
        <Suspense fallback={null}>
            <AdminOnly>
                <AdminApprovals />
            </AdminOnly>
        </Suspense>
    );
}
