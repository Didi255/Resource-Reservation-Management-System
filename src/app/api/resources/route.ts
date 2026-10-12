import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { errorResponse, HttpError, parseBody } from "@/lib/http";
import { createResource, listResources } from "@/lib/resources/repo";
import { createResourceSchema } from "@/lib/resources/schemas";

export async function GET() {
    try {
        await requireUser();
        return Response.json({ resources: await listResources() });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        await requireAdmin();
        const input = await parseBody(request, createResourceSchema);

        try {
            const resource = await createResource(input);
            return Response.json({ resource }, { status: 201 });
        } catch (error) {
            const code = (error as { code?: string }).code;
            if (code === "23505") {
                throw new HttpError(409, "That category already has a resource with this name");
            }
            if (code === "23503") {
                throw new HttpError(400, "Category does not exist");
            }
            throw error;
        }
    } catch (error) {
        return errorResponse(error);
    }
}
