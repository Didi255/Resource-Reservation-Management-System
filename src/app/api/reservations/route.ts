import { requireUser } from "@/lib/auth/guards";
import { errorResponse, HttpError, parseBody } from "@/lib/http";
import { createReservation, listReservations } from "@/lib/reservations/repo";
import { createReservationSchema, statusFilterSchema } from "@/lib/reservations/schemas";

export async function GET(request: Request) {
    try {
        const user = await requireUser();
        const raw = new URL(request.url).searchParams.get("status");

        let status: string | undefined;
        if (raw !== null) {
            const parsed = statusFilterSchema.safeParse(raw);
            if (!parsed.success) throw new HttpError(400, "Invalid status filter");
            status = parsed.data;
        }

        return Response.json({ reservations: await listReservations(user, status) });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireUser();
        const input = await parseBody(request, createReservationSchema);

        try {
            const reservation = await createReservation(user.id, input);
            return Response.json({ reservation }, { status: 201 });
        } catch (error) {
            if ((error as { code?: string }).code === "23503") {
                throw new HttpError(404, "Resource not found");
            }
            throw error;
        }
    } catch (error) {
        return errorResponse(error);
    }
}
