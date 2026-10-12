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
};

const SELECT_RESOURCE = `
    SELECT r.id, r.name, r.location, r.description, r.status,
           r.condition_notes AS "conditionNotes",
           r.category_id     AS "categoryId",
           c.name            AS "categoryName"
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
