import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { errorResponse, HttpError, parseBody } from "@/lib/http";
import { getResource, updateResource } from "@/lib/resources/repo";
import { updateResourceSchema } from "@/lib/resources/schemas";

type Context = { params: Promise<{ id: string }> };

async function readId(context: Context): Promise<number> {
    const { id } = await context.params;
    const value = Number(id);
    if (!Number.isInteger(value) || value <= 0) {
        throw new HttpError(400, "Invalid resource id");
    }
    return value;
}

export async function GET(_request: Request, context: Context) {
    try {
        await requireUser();
        const resource = await getResource(await readId(context));
        if (!resource) throw new HttpError(404, "Resource not found");
        return Response.json({ resource });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PATCH(request: Request, context: Context) {
    try {
        await requireAdmin();
        const id = await readId(context);
        const input = await parseBody(request, updateResourceSchema);

        try {
            const resource = await updateResource(id, input);
            if (!resource) throw new HttpError(404, "Resource not found");
            return Response.json({ resource });
        } catch (error) {
            if ((error as { code?: string }).code === "23505") {
                throw new HttpError(409, "That category already has a resource with this name");
            }
            throw error;
        }
    } catch (error) {
        return errorResponse(error);
    }
}
