import { requireAdmin } from "@/lib/auth/guards";
import { errorResponse, HttpError, parseBody } from "@/lib/http";
import { rejectReservation } from "@/lib/reservations/repo";
import { reasonSchema } from "@/lib/reservations/schemas";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
    try {
        const admin = await requireAdmin();
        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, "Invalid reservation id");
        }

        const { reason } = await parseBody(request, reasonSchema, { emptyOk: true });
        const result = await rejectReservation(id, admin.id, reason);
        return Response.json({ reservation: result });
    } catch (error) {
        return errorResponse(error);
    }
}
