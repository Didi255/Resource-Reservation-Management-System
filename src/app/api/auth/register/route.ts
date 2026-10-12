import { z } from "zod";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            { error: "Invalid input", fields: z.flattenError(parsed.error).fieldErrors },
            { status: 400 }
        );
    }

    const { name, email, phone, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    try {
        const result = await pool.query(
            "INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
            [name, email, phone ?? null, passwordHash]
        );
        await createSession(result.rows[0].id);
        return Response.json({ ok: true }, { status: 201 });
    } catch (error) {
        if ((error as { code?: string }).code === "23505") {
            return Response.json({ error: "That email is already registered" }, { status: 409 });
        }
        console.error("Register failed:", error);
        return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
}



