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
     VALUES ('Meeting Rooms'), ('Workspaces'), ('Studios & Labs'),
            ('Equipment'), ('Vehicles'), ('Parking')
     ON CONFLICT (name) DO NOTHING`
);

await client.query(
    `INSERT INTO resources (category_id, name, location, description)
     SELECT c.id, v.name, v.location, v.description
       FROM (VALUES
              ('Meeting Rooms',  'Boardroom',         'Main Floor',  'Seats 12. Wall display and video conferencing.'),
              ('Meeting Rooms',  'Conference Room A', 'Main Floor',  'Seats 6. Wall display.'),
              ('Meeting Rooms',  'Huddle Room',       'Main Floor',  'Seats 4. Quick catch-ups.'),
              ('Meeting Rooms',  'Training Room',     'Main Floor',  'Seats 20 in classroom layout. Projector screen.'),
              ('Workspaces',     'Hot Desk 1',        'Open Area',   'Standing desk, dual monitors.'),
              ('Workspaces',     'Hot Desk 2',        'Open Area',   'Standard desk, monitor.'),
              ('Workspaces',     'Hot Desk 3',        'Open Area',   'Standard desk, monitor.'),
              ('Workspaces',     'Focus Pod 1',       'Open Area',   'Soundproof booth for calls and deep work.'),
              ('Workspaces',     'Focus Pod 2',       'Open Area',   'Soundproof booth for calls and deep work.'),
              ('Studios & Labs', 'Recording Studio',  'Main Floor',  'Acoustic treatment, microphones, mixing desk.'),
              ('Studios & Labs', 'Innovation Lab',    'Main Floor',  '3D printer, prototyping tools, whiteboard walls.'),
              ('Equipment',      'Projector 1',       'IT Store',    'Portable HD projector with HDMI.'),
              ('Equipment',      'Projector 2',       'IT Store',    'Portable HD projector with HDMI.'),
              ('Equipment',      'Laptop 1',          'IT Store',    'Loan laptop with standard software.'),
              ('Equipment',      'Laptop 2',          'IT Store',    'Loan laptop with standard software.'),
              ('Equipment',      'Camera Kit',        'IT Store',    'Mirrorless camera, tripod and lighting.'),
              ('Vehicles',       'Company Van',       'Parking B',   '9-seater van. Driver must hold a valid licence.'),
              ('Vehicles',       'Pool Car',          'Parking B',   '5-seater sedan for local trips.'),
              ('Parking',        'Parking Bay P1',    'Parking A',   'Reserved bay near the entrance.'),
              ('Parking',        'Parking Bay P2',    'Parking A',   'Reserved bay near the entrance.')
            ) AS v(category, name, location, description)
       JOIN categories c ON c.name = v.category
     ON CONFLICT (category_id, name)
     DO UPDATE SET location = EXCLUDED.location, description = EXCLUDED.description`
);

// Pin positions on public/floorplan.webp, in percent of image width/height (D18).
await client.query(
    `UPDATE resources r
        SET plan_x = v.x, plan_y = v.y
       FROM (VALUES
              ('Boardroom',         26, 26),
              ('Conference Room A', 51, 23),
              ('Huddle Room',       66, 29),
              ('Training Room',     14, 60),
              ('Recording Studio',  83, 43),
              ('Innovation Lab',    77, 66),
              ('Hot Desk 1',        57, 63),
              ('Hot Desk 2',        47, 43),
              ('Hot Desk 3',        34, 60),
              ('Focus Pod 1',       42, 84),
              ('Focus Pod 2',       57, 84)
            ) AS v(name, x, y)
      WHERE r.name = v.name`
);

console.log("seeded");
await client.end();
