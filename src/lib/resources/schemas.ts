import { z } from "zod";

const percent = z.number().int().min(0).max(100);

/** Both coordinates or neither, and null clears a position. */
function bothOrNone(value: { planX?: number | null; planY?: number | null }) {
    const xGiven = value.planX !== undefined;
    const yGiven = value.planY !== undefined;
    if (xGiven !== yGiven) return false;
    return (value.planX === null) === (value.planY === null);
}

const PLAN_MESSAGE = "Set both the horizontal and vertical position, or neither";

export const createResourceSchema = z
    .object({
        categoryId: z.number().int().positive(),
        name: z.string().trim().min(1, "Name is required").max(100),
        location: z.string().trim().min(1, "Location is required").max(100),
        description: z.string().trim().max(500).optional(),
        planX: percent.nullable().optional(),
        planY: percent.nullable().optional(),
    })
    .refine(bothOrNone, { message: PLAN_MESSAGE, path: ["planX"] });

export const updateResourceSchema = z
    .object({
        name: z.string().trim().min(1).max(100).optional(),
        location: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().max(500).optional(),
        status: z.enum(["available", "under_maintenance", "retired"]).optional(),
        conditionNotes: z.string().trim().max(500).optional(),
        planX: percent.nullable().optional(),
        planY: percent.nullable().optional(),
    })
    .refine(bothOrNone, { message: PLAN_MESSAGE, path: ["planX"] })
    .refine((value) => Object.keys(value).length > 0, "Nothing to update");
