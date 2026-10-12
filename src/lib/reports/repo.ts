import pool from "@/lib/db";

export type ReportInput = { from: string; to: string; tz: string };

// Midnight at the start of `from` and midnight after `to`, in the viewer's timezone.
// Every report uses the same range, so it is one CTE repeated in each query.
const BOUNDS = `
    WITH bounds AS (
        SELECT ($1::date)::timestamp AT TIME ZONE $3::text      AS from_ts,
               (($2::date + 1))::timestamp AT TIME ZONE $3::text AS to_ts
    )`;

export async function getReports({ from, to, tz }: ReportInput) {
    const params = [from, to, tz];

    // 1. Utilisation: approved time clipped to the range, per resource.
    const utilisation = pool.query(
        `${BOUNDS}
         SELECT r.id,
                r.name,
                c.name AS category,
                COUNT(rv.id)::int AS bookings,
                -- LEAST and GREATEST ignore NULLs, so a resource with no bookings (all-NULL join row)
                -- would look booked for the whole range. FILTER keeps only real booking rows.
                COALESCE(SUM(EXTRACT(EPOCH FROM
                    (LEAST(rv.end_time, b.to_ts) - GREATEST(rv.start_time, b.from_ts))))
                    FILTER (WHERE rv.id IS NOT NULL) / 3600, 0)::float AS hours,
                (EXTRACT(EPOCH FROM (b.to_ts - b.from_ts)) / 3600)::float AS "rangeHours"
           FROM bounds b
          CROSS JOIN resources r
           JOIN categories c ON c.id = r.category_id
           LEFT JOIN reservations rv
                  ON rv.resource_id = r.id
                 AND rv.status = 'approved'
                 AND rv.start_time < b.to_ts
                 AND rv.end_time   > b.from_ts
          WHERE r.status <> 'retired'
          GROUP BY r.id, c.name, b.from_ts, b.to_ts
          ORDER BY hours DESC, r.name`,
        params
    );

    // 2. Requests by category and status, for bookings that start in the range.
    const byCategory = pool.query(
        `${BOUNDS}
         SELECT c.name AS category,
                COUNT(*) FILTER (WHERE rv.status = 'pending')::int   AS pending,
                COUNT(*) FILTER (WHERE rv.status = 'approved')::int  AS approved,
                COUNT(*) FILTER (WHERE rv.status = 'rejected')::int  AS rejected,
                COUNT(*) FILTER (WHERE rv.status = 'cancelled')::int AS cancelled
           FROM bounds b
          CROSS JOIN categories c
           LEFT JOIN resources r ON r.category_id = c.id
           LEFT JOIN reservations rv
                  ON rv.resource_id = r.id
                 AND rv.start_time >= b.from_ts
                 AND rv.start_time <  b.to_ts
          GROUP BY c.name
          ORDER BY c.name`,
        params
    );

    // 3. Peak times: approved bookings by hour of day and by weekday (1 = Monday).
    const byHour = pool.query(
        `${BOUNDS}
         SELECT EXTRACT(HOUR FROM rv.start_time AT TIME ZONE $3::text)::int AS hour,
                COUNT(*)::int AS bookings
           FROM bounds b
           JOIN reservations rv
             ON rv.status = 'approved'
            AND rv.start_time >= b.from_ts
            AND rv.start_time <  b.to_ts
          GROUP BY 1`,
        params
    );

    const byWeekday = pool.query(
        `${BOUNDS}
         SELECT EXTRACT(ISODOW FROM rv.start_time AT TIME ZONE $3::text)::int AS weekday,
                COUNT(*)::int AS bookings
           FROM bounds b
           JOIN reservations rv
             ON rv.status = 'approved'
            AND rv.start_time >= b.from_ts
            AND rv.start_time <  b.to_ts
          GROUP BY 1`,
        params
    );

    // Weekday and hour together, for the heatmap. Only cells with bookings come back.
    const heatmap = pool.query(
        `${BOUNDS}
         SELECT EXTRACT(ISODOW FROM rv.start_time AT TIME ZONE $3::text)::int AS weekday,
                EXTRACT(HOUR FROM rv.start_time AT TIME ZONE $3::text)::int   AS hour,
                COUNT(*)::int AS bookings
           FROM bounds b
           JOIN reservations rv
             ON rv.status = 'approved'
            AND rv.start_time >= b.from_ts
            AND rv.start_time <  b.to_ts
          GROUP BY 1, 2`,
        params
    );

    const [u, c, h, w, hm] = await Promise.all([utilisation, byCategory, byHour, byWeekday, heatmap]);

    const hourMap = new Map<number, number>(h.rows.map((r) => [r.hour, r.bookings]));
    const weekdayMap = new Map<number, number>(w.rows.map((r) => [r.weekday, r.bookings]));

    return {
        utilisation: u.rows.map((r) => ({
            id: r.id as number,
            name: r.name as string,
            category: r.category as string,
            bookings: r.bookings as number,
            hours: Math.round((r.hours as number) * 10) / 10,
            // booked hours as a share of every hour in the range
            utilisation: r.rangeHours > 0 ? Math.round(((r.hours as number) / r.rangeHours) * 1000) / 10 : 0,
        })),
        byCategory: c.rows as {
            category: string;
            pending: number;
            approved: number;
            rejected: number;
            cancelled: number;
        }[],
        // every hour and weekday is present, including the ones with no bookings
        byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, bookings: hourMap.get(hour) ?? 0 })),
        byWeekday: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, bookings: weekdayMap.get(i + 1) ?? 0 })),
        heatmap: hm.rows as { weekday: number; hour: number; bookings: number }[],
    };
}
