import { Pool } from "pg";

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