import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.join(process.cwd(), "db", "migrations");

const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

await client.connect();

await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
`);

const result = await client.query("SELECT filename FROM schema_migrations");
const applied = new Set(result.rows.map((row) => row.filename));

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(path.join(dir, file), "utf8");
    try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(`FAILED ${file}: ${error.message}`);
        process.exitCode = 1;
        break;
    }
}

await client.end();
