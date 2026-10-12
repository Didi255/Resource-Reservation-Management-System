import { Suspense } from "react";
import { AdminOnly } from "@/components/admin-only";
import { AdminReports } from "@/components/admin-reports";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
    return (
        <Suspense fallback={null}>
            <AdminOnly>
                <AdminReports />
            </AdminOnly>
        </Suspense>
    );
}
