// Demo data: people, resource states and a spread of reservations, so every screen has
// something realistic to show. It RESETS reservations and their history first, so running it
// again always gives the same picture. Never run this against real data.
//
//   npm run seed        (once: base users, categories, resources)
//   npm run seed:demo   (this script)
//
// Dates are relative to today in DEMO_TZ (default Asia/Colombo), so nothing goes stale.

import bcrypt from "bcryptjs";
import pg from "pg";

if (process.env.NODE_ENV === "production") {
    console.error("Refusing to reset reservations when NODE_ENV is production.");
    process.exit(1);
}

const TZ = process.env.DEMO_TZ ?? "Asia/Colombo";

const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
await client.connect();

const admin = await client.query("SELECT id FROM users WHERE email = 'admin@example.com'");
if (admin.rowCount === 0) {
    console.error("Base data is missing. Run `npm run seed` first.");
    await client.end();
    process.exit(1);
}
const adminId = admin.rows[0].id;

// ---- people ---------------------------------------------------------------------------------
const PEOPLE = [
    ["Priya Nair", "priya.nair@demo.example.com", "+94 77 410 2288"],
    ["Marcus Okafor", "marcus.okafor@demo.example.com", "+94 71 556 0193"],
    ["Lena Fischer", "lena.fischer@demo.example.com", null],
    ["Tariq Hassan", "tariq.hassan@demo.example.com", "+94 76 902 4417"],
    ["Sofia Alvarez", "sofia.alvarez@demo.example.com", null],
    ["Kavindu Perera", "kavindu.perera@demo.example.com", "+94 70 233 8671"],
];

const hash = await bcrypt.hash("member12345", 12);
for (const [name, email, phone] of PEOPLE) {
    await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'member')
         ON CONFLICT (email) DO NOTHING`,
        [name, email, phone, hash]
    );
}

// ---- resource states ------------------------------------------------------------------------
await client.query(
    `UPDATE resources
        SET status = 'under_maintenance',
            condition_notes = 'Laser cutter is being serviced until next week.'
      WHERE name = 'Innovation Lab'`
);
await client.query(
    `INSERT INTO resources (category_id, name, location, description, status, condition_notes)
     SELECT c.id, 'Conference Room B', 'Floor 2, West wing',
            'Closed after the floor renovation.', 'retired', 'Retired: room converted to storage.'
       FROM categories c WHERE c.name = 'Meeting Rooms'
     ON CONFLICT (category_id, name) DO UPDATE SET status = 'retired'`
);

// ---- reservations ---------------------------------------------------------------------------
// [resource, who, day offset from today, from, to, purpose, status, options]
// status: approved | pending | rejected | cancelled.  options: { reason, by: "admin" }
const M = "member@example.com";
const P = "priya.nair@demo.example.com";
const MA = "marcus.okafor@demo.example.com";
const L = "lena.fischer@demo.example.com";
const T = "tariq.hassan@demo.example.com";
const S = "sofia.alvarez@demo.example.com";
const K = "kavindu.perera@demo.example.com";

const ROWS = [
    // ---- now: so the plan shows red and amber at the default window ----
    ["Boardroom", MA, 0, "08:00", "20:00", "Leadership offsite", "approved"],
    ["Recording Studio", K, 0, "08:00", "20:00", "Studio day: podcast series", "approved"],
    ["Huddle Room", P, 0, "08:00", "20:00", "Interview block", "pending"],

    // ---- past: history for My bookings and the reports ----
    ["Boardroom", M, -8, "09:00", "10:00", "Weekly sync", "approved"],
    ["Camera Kit", K, -7, "09:00", "13:00", "Product photo shoot", "cancelled", { reason: "Shoot postponed to next month" }],
    ["Boardroom", P, -6, "09:00", "11:00", "Quarterly planning workshop", "approved"],
    ["Boardroom", MA, -6, "14:00", "15:30", "Sprint retrospective", "approved"],
    ["Conference Room A", L, -5, "10:00", "12:00", "Client onboarding call", "approved"],
    ["Huddle Room", T, -4, "13:00", "14:00", "Mentoring one-to-one", "approved"],
    ["Training Room", S, -4, "09:00", "17:00", "New hire training day", "approved"],
    ["Recording Studio", K, -3, "15:00", "17:00", "Podcast episode recording", "approved"],
    ["Projector 1", MA, -3, "09:00", "12:00", "Demo at partner office", "approved"],
    ["Parking Bay P1", M, -3, "08:00", "18:00", "Visitor parking", "approved"],
    ["Company Van", P, -2, "08:00", "18:00", "Site visit", "approved"],
    ["Hot Desk 1", L, -2, "08:30", "17:30", "Focus day", "approved"],
    ["Pool Car", T, -1, "07:00", "11:00", "Airport pickup", "approved"],
    ["Boardroom", S, -1, "11:00", "12:00", "Team lunch", "rejected", { reason: "The boardroom is held for the leadership team that day." }],

    // ---- upcoming, approved ----
    ["Boardroom", P, 1, "09:00", "10:30", "Roadmap review", "approved"],
    ["Boardroom", MA, 1, "13:00", "15:00", "Investor update prep", "approved"],
    ["Conference Room A", L, 1, "14:00", "15:00", "Design critique", "approved"],
    ["Focus Pod 1", P, 1, "09:00", "12:00", "Deep work on the proposal", "approved"],
    ["Huddle Room", M, 1, "11:00", "12:00", "Design pairing", "approved"],
    ["Parking Bay P2", M, 1, "08:00", "18:00", "Client visit", "approved"],
    ["Training Room", S, 2, "09:00", "12:00", "Onboarding session", "approved"],
    ["Recording Studio", K, 2, "10:00", "13:00", "Webinar recording", "approved"],
    ["Projector 1", T, 2, "09:00", "11:00", "Workshop equipment", "approved"],
    ["Company Van", MA, 3, "07:30", "17:00", "Supplier visit", "approved"],
    ["Hot Desk 2", L, 3, "08:00", "17:00", "Co-working day", "approved"],
    ["Laptop 1", S, 4, "09:00", "17:00", "Conference travel", "approved"],
    ["Boardroom", M, 5, "10:00", "11:00", "Team meeting", "approved"],

    // ---- upcoming, waiting for a decision (several compete for the same slot) ----
    ["Huddle Room", P, 2, "14:00", "15:00", "Quick sync with vendor", "pending"],
    ["Huddle Room", MA, 2, "14:00", "15:00", "Candidate interview", "pending"],
    ["Huddle Room", T, 2, "14:00", "15:00", "Pairing session", "pending"],
    ["Conference Room A", K, 4, "10:00", "11:00", "Sprint planning", "pending"],
    ["Conference Room A", S, 4, "10:00", "11:00", "Customer demo", "pending"],
    ["Training Room", L, 3, "10:00", "12:00", "Design systems workshop", "pending"],
    ["Company Van", S, 4, "09:00", "13:00", "Equipment move", "pending"],
    ["Pool Car", K, 4, "09:00", "12:00", "Bank errand", "pending"],
    ["Laptop 2", M, 1, "09:00", "18:00", "Offsite workshop", "pending"],
    ["Hot Desk 3", M, 2, "09:00", "17:00", "Quiet day to write", "pending"],

    // ---- upcoming, closed ----
    ["Recording Studio", T, 2, "14:00", "15:00", "Voice-over test", "rejected", { reason: "The studio is closed for acoustic treatment that afternoon." }],
    ["Boardroom", MA, 6, "09:00", "10:00", "Planning call", "cancelled", { reason: "Meeting moved online" }],
    ["Pool Car", K, 2, "08:00", "12:00", "Delivery run", "cancelled", { reason: "The car is needed for its service.", by: "admin" }],
];

// Start from a clean slate so the script can be run any number of times.
await client.query("TRUNCATE reservation_events, reservations RESTART IDENTITY");

const userIds = new Map();
const userRows = (await client.query("SELECT id, email FROM users")).rows;
for (const u of userRows) userIds.set(u.email, u.id);

const counts = {};

for (const [resource, who, day, from, to, purpose, status, options = {}] of ROWS) {
    const ownerId = userIds.get(who);
    if (!ownerId) throw new Error(`Unknown user ${who}`);

    // Past bookings were requested a few days earlier; upcoming ones a day or two ago.
    const requestedHoursAgo = day <= 0 ? -day * 24 + 72 : 6 + ((purpose.length * 7) % 40);

    const inserted = await client.query(
        `INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose, status, created_at)
         SELECT r.id,
                $1,
                (date_trunc('day', now() AT TIME ZONE $2) + ($3::int * interval '1 day') + $4::time) AT TIME ZONE $2,
                (date_trunc('day', now() AT TIME ZONE $2) + ($3::int * interval '1 day') + $5::time) AT TIME ZONE $2,
                $6, $7, now() - ($8::int * interval '1 hour')
           FROM resources r
          WHERE r.name = $9
          RETURNING id, created_at`,
        [ownerId, TZ, day, from, to, purpose, status, requestedHoursAgo, resource]
    );
    if (inserted.rowCount === 0) throw new Error(`Unknown resource ${resource}`);

    const { id, created_at: createdAt } = inserted.rows[0];
    const later = (minutes) => new Date(new Date(createdAt).getTime() + minutes * 60_000);

    const event = (actorId, type, reason, at) =>
        client.query(
            `INSERT INTO reservation_events (reservation_id, actor_id, event_type, reason, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, actorId, type, reason ?? null, at]
        );

    await event(ownerId, "requested", null, createdAt);
    if (status === "approved") await event(adminId, "approved", null, later(30));
    if (status === "rejected") await event(adminId, "rejected", options.reason, later(45));
    if (status === "cancelled") {
        await event(options.by === "admin" ? adminId : ownerId, "cancelled", options.reason, later(90));
    }

    counts[status] = (counts[status] ?? 0) + 1;
}

console.log(`Demo data ready (${ROWS.length} reservations, timezone ${TZ}):`, counts);
console.log("Sign in: admin@example.com / admin12345, or member@example.com / member12345");
await client.end();
