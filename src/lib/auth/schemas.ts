import {z} from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1),
});
