import { z } from "zod";

export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public fields?: Record<string, string[] | undefined>
    ) {
        super(message);
    }
}

export async function parseBody<T>(
    request: Request,
    schema: z.ZodType<T>,
    options: { emptyOk?: boolean } = {}
): Promise<T> {
    const raw = await request.json().catch(() => null);
    const body = raw === null && options.emptyOk ? {} : raw;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        throw new HttpError(400, "Invalid input", z.flattenError(parsed.error).fieldErrors);
    }
    return parsed.data;
}


export function errorResponse(error: unknown): Response {
    if (error instanceof HttpError) {
        return Response.json(
            { error: error.message, fields: error.fields },
            { status: error.status }
        );
    }
    console.error(error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
}
