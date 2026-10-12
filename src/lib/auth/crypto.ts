import bcrypt from 'bcryptjs';
import {createHash, randomBytes} from "node:crypto";

export async function hashPassword(password: string): Promise<string>{
    return bcrypt.hash(password,12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean>{
    return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string{
    return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string{
    return createHash('sha256').update(token).digest('hex');
}
