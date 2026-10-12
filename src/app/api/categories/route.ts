import { requireUser } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/http";
import { listCategories } from "@/lib/resources/repo";

export async function GET() {
    try {
        await requireUser();
        return Response.json({ categories: await listCategories() });
    } catch (error) {
        return errorResponse(error);
    }
}
