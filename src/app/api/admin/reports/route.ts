import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { errorResponse, HttpError } from "@/lib/http";
import { getReports } from "@/lib/reports/repo";

const MAX_DAYS = 366;

const querySchema = z
    .object({
        from: z.iso.date(),
        to: z.iso.date(),
        // an IANA zone name such as Asia/Colombo; the database rejects anything it does not know
        tz: z.string().regex(/^[A-Za-z0-9_+\-/]{1,64}$/, "Invalid timezone").default("UTC"),
    })
    .refine((v) => v.to >= v.from, { message: "End date must not be before the start date", path: ["to"] })
    .refine((v) => (Date.parse(v.to) - Date.parse(v.from)) / 86_400_000 < MAX_DAYS, {
        message: `Choose a range of at most ${MAX_DAYS} days`,
        path: ["to"],
    });

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const params = new URL(request.url).searchParams;
        const parsed = querySchema.safeParse({
            from: params.get("from"),
            to: params.get("to"),
            tz: params.get("tz") ?? undefined,
        });
        if (!parsed.success) {
            throw new HttpError(400, "Invalid input", z.flattenError(parsed.error).fieldErrors);
        }

        try {
            const report = await getReports(parsed.data);
            return Response.json({ range: parsed.data, ...report });
        } catch (error) {
            // 22023: invalid_parameter_value, raised for an unknown time zone name
            if ((error as { code?: string }).code === "22023") {
                throw new HttpError(400, "Unknown timezone", { tz: ["Unknown timezone"] });
            }
            throw error;
        }
    } catch (error) {
        return errorResponse(error);
    }
}
