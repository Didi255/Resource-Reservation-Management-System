import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { errorResponse, HttpError } from "@/lib/http";
import { listAvailability } from "@/lib/resources/repo";

const querySchema = z
    .object({
        start: z.iso.datetime({ offset: true }),
        end: z.iso.datetime({ offset: true }),
    })
    .refine((v) => new Date(v.end) > new Date(v.start), {
        message: "End must be after start",
        path: ["end"],
    });

export async function GET(request: Request) {
    try {
        await requireUser();

        const params = new URL(request.url).searchParams;
        const parsed = querySchema.safeParse({
            start: params.get("start"),
            end: params.get("end"),
        });
        if (!parsed.success) {
            throw new HttpError(400, "Invalid input", z.flattenError(parsed.error).fieldErrors);
        }

        const resources = await listAvailability(parsed.data.start, parsed.data.end);
        return Response.json({ resources });
    } catch (error) {
        return errorResponse(error);
    }
}
