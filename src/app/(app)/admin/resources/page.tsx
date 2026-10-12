import { Suspense } from "react";
import { AdminOnly } from "@/components/admin-only";
import { AdminResources } from "@/components/admin-resources";

export const metadata = { title: "Manage resources" };

export default function ManageResourcesPage() {
    return (
        <Suspense fallback={null}>
            <AdminOnly>
                <AdminResources />
            </AdminOnly>
        </Suspense>
    );
}
