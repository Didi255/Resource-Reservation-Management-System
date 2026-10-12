import bcrypt from "bcryptjs";
import pg from "pg";

const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

await client.connect();

const adminHash = await bcrypt.hash("admin12345", 12);
const memberHash = await bcrypt.hash("member12345", 12);

await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin', 'admin@example.com', $1, 'admin'),
            ('Demo Member', 'member@example.com', $2, 'member')
     ON CONFLICT (email) DO NOTHING`,
    [adminHash, memberHash]
);

await client.query(
    `INSERT INTO categories (name)
     VALUES ('Meeting Rooms'), ('Equipment'), ('Vehicles')
     ON CONFLICT (name) DO NOTHING`
);

await client.query(
    `INSERT INTO resources (category_id, name, location)
     SELECT c.id, v.name, v.location
       FROM (VALUES
              ('Meeting Rooms', 'Boardroom',      'Floor 3'),
              ('Meeting Rooms', 'Conference Room A', 'Floor 1'),
              ('Equipment',     'Projector 1',    'IT Store'),
              ('Equipment',     'Projector 2',    'IT Store'),
              ('Vehicles',      'Company Van',    'Parking B')
            ) AS v(category, name, location)
       JOIN categories c ON c.name = v.category
     ON CONFLICT (category_id, name) DO NOTHING`
);

console.log("seeded");
await client.end();
