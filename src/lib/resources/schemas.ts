import { z } from "zod";

export const createResourceSchema = z.object({
    categoryId: z.number().int().positive(),
    name: z.string().trim().min(1, "Name is required").max(100),
    location: z.string().trim().min(1, "Location is required").max(100),
    description: z.string().trim().max(500).optional(),
});

export const updateResourceSchema = z
    .object({
        name: z.string().trim().min(1).max(100).optional(),
        location: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().max(500).optional(),
        status: z.enum(["available", "under_maintenance", "retired"]).optional(),
        conditionNotes: z.string().trim().max(500).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Nothing to update");
