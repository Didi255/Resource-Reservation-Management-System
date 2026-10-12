// Concurrency proof: N overlapping pending requests for ONE resource and slot are approved
// at the same instant. Exactly one may win; the rest must be refused with 409; none may 500.
//
//   npm run test:concurrency            (dev server must be running)
//   N=50 RESOURCE_ID=4 npm run test:concurrency

import pg from "pg";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const N = Number(process.env.N ?? 50);
const RESOURCE_ID = Number(process.env.RESOURCE_ID ?? 3);

async function login(email, password) {
    const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`login failed for ${email}: ${response.status}`);
    // Keep only "name=value" of each cookie, which is what a browser sends back.
    return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
}

async function call(path, cookie, method = "GET", body) {
    const response = await fetch(`${BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {
        // non-JSON body; leave json null
    }
    return { status: response.status, json };
}

const admin = await login("admin@example.com", "admin12345");
const member = await login("member@example.com", "member12345");

// A random far-future day so repeated runs never collide with earlier ones.
const day = new Date(Date.UTC(2031, 0, 1));
day.setUTCDate(day.getUTCDate() + Math.floor(Math.random() * 3000));
const startTime = new Date(day.getTime() + 9 * 3600 * 1000).toISOString();
const endTime = new Date(day.getTime() + 10 * 3600 * 1000).toISOString();

console.log(`Creating ${N} pending requests for resource ${RESOURCE_ID}, ${startTime} to ${endTime}`);
const created = await Promise.all(
    Array.from({ length: N }, (_, i) =>
        call("/api/reservations", member, "POST", {
            resourceId: RESOURCE_ID,
            startTime,
            endTime,
            purpose: `concurrency test ${i + 1}`,
        })
    )
);
const ids = created.map((r) => r.json?.reservation?.id).filter(Boolean);
if (ids.length !== N) {
    console.error("Could not create all requests:", created.map((r) => r.status));
    process.exit(1);
}

console.log(`Approving all ${N} at the same instant...`);
const started = Date.now();
const results = await Promise.all(
    ids.map((id) => call(`/api/reservations/${id}/approve`, admin, "POST"))
);
const elapsed = Date.now() - started;

const tally = {};
for (const r of results) tally[r.status] = (tally[r.status] ?? 0) + 1;

const list = await call("/api/reservations?status=approved", admin);
const approvedInSlot = list.json.reservations.filter((r) => ids.includes(r.id)).length;

console.log("\nHTTP status counts:", tally);
console.log(`Approved rows in the database for this slot: ${approvedInSlot}`);
console.log(`Elapsed: ${elapsed} ms\n`);

// Remove this run's rows so the admin approvals list is not buried in test data.
// Set KEEP=1 to leave them in place for inspection.
async function cleanup() {
    if (process.env.KEEP === "1") {
        console.log("KEEP=1: leaving the test rows in place.");
        return;
    }
    if (!process.env.DB_HOST) {
        console.warn("DB_* variables not set, so the test rows were not cleaned up.");
        return;
    }
    const client = new pg.Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    await client.connect();
    try {
        await client.query("DELETE FROM reservation_events WHERE reservation_id = ANY($1)", [ids]);
        const removed = await client.query("DELETE FROM reservations WHERE id = ANY($1)", [ids]);
        console.log(`Cleaned up ${removed.rowCount} test reservations.`);
    } finally {
        await client.end();
    }
}
await cleanup();

const wins = tally[200] ?? 0;
const serverErrors = Object.keys(tally).filter((s) => Number(s) >= 500).length;

if (wins === 1 && approvedInSlot === 1 && serverErrors === 0) {
    console.log(`PASS: exactly 1 of ${N} concurrent approvals succeeded; ${N - 1} were refused with 409.`);
} else {
    console.error("FAIL: expected exactly 1 success, 1 approved row and no 5xx.");
    process.exit(1);
}
