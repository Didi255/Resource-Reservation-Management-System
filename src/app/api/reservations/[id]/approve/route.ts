import { requireAdmin } from "@/lib/auth/guards";
import { errorResponse, HttpError } from "@/lib/http";
import { approveReservation } from "@/lib/reservations/repo";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
    try {
        const admin = await requireAdmin();
        const id = Number((await context.params).id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, "Invalid reservation id");
        }

        try {
            const result = await approveReservation(id, admin.id);
            return Response.json({ reservation: result });
        } catch (error) {
            // Backstop: the DB constraint fired because some path skipped the check.
            if ((error as { code?: string }).code === "23P01") {
                throw new HttpError(409, "This time slot overlaps an approved reservation");
            }
            throw error;
        }
    } catch (error) {
        return errorResponse(error);
    }
}
