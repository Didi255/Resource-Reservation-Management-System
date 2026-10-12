import { cookies } from "next/headers";
import pool from "@/lib/db";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/crypto";


const COOKIE_NAME = "session";
const SESSION_HOURS =8;

export type CurrentUser = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "member";

};

export async function createSession(userId:number): Promise<void>{
    await pool.query("DELETE FROM sessions WHERE expires_at < now()");
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_HOURS *60*60*1000);

    await pool.query(
        "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES($1, $2, $3)",
        [userId, hashSessionToken(token), expiresAt]
    );

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiresAt
    });
}

export async function getCurrentUser(): Promise<CurrentUser | null>{
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if(!token){
        return null;
    }

    const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
          FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [hashSessionToken(token)]
    );

    return result.rows[0] || null;

}

export async function destroySession(): Promise<void>{
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if(token){
        await pool.query(
            "DELETE FROM sessions WHERE token_hash = $1",
            [hashSessionToken(token)]
        );
        cookieStore.delete(COOKIE_NAME);
    }
}