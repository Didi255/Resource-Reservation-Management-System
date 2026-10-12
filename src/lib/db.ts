import { Pool,type PoolClient } from "pg";

const globalForPool = globalThis as unknown as { pool?: Pool };


const pool = 
    globalForPool.pool ??
    new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
});

if (process.env.NODE_ENV !== "production") globalForPool.pool = pool;

export default pool;


export async function withTransaction<T>(
    work: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await work(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
