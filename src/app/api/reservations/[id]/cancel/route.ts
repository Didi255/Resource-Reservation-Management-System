import { requireUser } from "@/lib/auth/guards";
import { errorResponse, HttpError, parseBody } from "@/lib/http";
import { cancelReservation } from "@/lib/reservations/repo";
import { reasonSchema } from "@/lib/reservations/schemas";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
    try {
        const user = await requireUser();
        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, "Invalid reservation id");
        }

        const { reason } = await parseBody(request, reasonSchema, { emptyOk: true });
        const result = await cancelReservation(id, user, reason);
        return Response.json({ reservation: result });
    } catch (error) {
        return errorResponse(error);
    }
}
