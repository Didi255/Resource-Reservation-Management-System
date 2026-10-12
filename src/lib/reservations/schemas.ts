import { z } from "zod";

export const createReservationSchema = z
    .object({
        resourceId: z.number().int().positive(),
        startTime: z.iso.datetime({ offset: true }),
        endTime: z.iso.datetime({ offset: true }),
        purpose: z.string().trim().min(1, "Purpose is required").max(300),
    })
    .refine((v) => new Date(v.endTime) > new Date(v.startTime), {
        message: "End must be after start",
        path: ["endTime"],
    })
    .refine((v) => new Date(v.startTime) > new Date(), {
        message: "Start must be in the future",
        path: ["startTime"],
    });

export const reasonSchema = z.object({
    reason: z.string().trim().min(1).max(300).optional(),
});

export const statusFilterSchema = z.enum(["pending", "approved", "rejected", "cancelled"]);
