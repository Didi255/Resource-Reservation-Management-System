import { z } from "zod";
import pool from "@/lib/db";
import { verifyPassword } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            { error: "Invalid input", fields: z.flattenError(parsed.error).fieldErrors },
            { status: 400 }
        );
    }

    const { email, password } = parsed.data;
    const result = await pool.query(
        "SELECT id, password_hash FROM users WHERE email = $1",
        [email]
    );
    const user = result.rows[0];

    const valid = user && (await verifyPassword(password, user.password_hash));
    if (!valid) {
        return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id);
    return Response.json({ ok: true });
}
