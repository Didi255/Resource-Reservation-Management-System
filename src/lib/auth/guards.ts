import { HttpError } from "@/lib/http";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";

export async function requireUser(): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Not signed in");
    return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
    const user = await requireUser();
    if (user.role !== "admin") throw new HttpError(403, "Admins only");
    return user;
}
