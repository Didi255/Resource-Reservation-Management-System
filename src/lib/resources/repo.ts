import pool from "@/lib/db";

export type Resource = {
    id: number;
    name: string;
    location: string;
    description: string | null;
    status: "available" | "under_maintenance" | "retired";
    conditionNotes: string | null;
    categoryId: number;
    categoryName: string;
    planX: number | null;
    planY: number | null;
};

const SELECT_RESOURCE = `
    SELECT r.id, r.name, r.location, r.description, r.status,
           r.condition_notes AS "conditionNotes",
           r.category_id     AS "categoryId",
           c.name            AS "categoryName",
           r.plan_x          AS "planX",
           r.plan_y          AS "planY"
      FROM resources r
      JOIN categories c ON c.id = r.category_id
`;

export async function listResources(): Promise<Resource[]> {
    const result = await pool.query(`${SELECT_RESOURCE} ORDER BY c.name, r.name`);
    return result.rows;
}

export async function getResource(id: number): Promise<Resource | null> {
    const result = await pool.query(`${SELECT_RESOURCE} WHERE r.id = $1`, [id]);
    return result.rows[0] ?? null;
}

export async function createResource(input: {
    categoryId: number;
    name: string;
    location: string;
    description?: string;
}): Promise<Resource> {
    const result = await pool.query(
        `INSERT INTO resources (category_id, name, location, description)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.categoryId, input.name, input.location, input.description ?? null]
    );
    return (await getResource(result.rows[0].id)) as Resource;
}

export async function updateResource(
    id: number,
    input: {
        name?: string;
        location?: string;
        description?: string;
        status?: string;
        conditionNotes?: string;
    }
): Promise<Resource | null> {
    const result = await pool.query(
        `UPDATE resources
            SET name            = COALESCE($2, name),
                location        = COALESCE($3, location),
                description     = COALESCE($4, description),
                status          = COALESCE($5, status),
                condition_notes = COALESCE($6, condition_notes)
          WHERE id = $1
          RETURNING id`,
        [
            id,
            input.name ?? null,
            input.location ?? null,
            input.description ?? null,
            input.status ?? null,
            input.conditionNotes ?? null,
        ]
    );
    if (result.rowCount === 0) return null;
    return getResource(id);
}

export type Availability = "free" | "booked" | "pending" | "maintenance";

export async function listAvailability(
    start: string,
    end: string
): Promise<(Resource & { availability: Availability })[]> {
    const result = await pool.query(
        `SELECT x.*,
                CASE
                    WHEN x.status <> 'available' THEN 'maintenance'
                    WHEN EXISTS (
                        SELECT 1 FROM reservations v
                         WHERE v.resource_id = x.id AND v.status = 'approved'
                           AND v.start_time < $2 AND v.end_time > $1
                    ) THEN 'booked'
                    WHEN EXISTS (
                        SELECT 1 FROM reservations v
                         WHERE v.resource_id = x.id AND v.status = 'pending'
                           AND v.start_time < $2 AND v.end_time > $1
                    ) THEN 'pending'
                    ELSE 'free'
                END AS availability
           FROM (${SELECT_RESOURCE}) x
          WHERE x.status <> 'retired'
          ORDER BY x."categoryName", x.name`,
        [start, end]
    );
    return result.rows;
}
