import pool, { withTransaction } from "@/lib/db";
import { HttpError } from "@/lib/http";
import type { CurrentUser } from "@/lib/auth/session";

export async function approveReservation(reservationId: number, adminId: number) {
    return withTransaction(async (client) => {
        // 1. Which resource is this for? (no lock yet)
        const first = await client.query(
            "SELECT resource_id FROM reservations WHERE id = $1",
            [reservationId]
        );
        if (first.rowCount === 0) throw new HttpError(404, "Reservation not found");
        const resourceId: number = first.rows[0].resource_id;

        // 2. Lock the resource row. Concurrent approvals for it now queue up here.
        const resource = await client.query(
            "SELECT status FROM resources WHERE id = $1 FOR UPDATE",
            [resourceId]
        );

        // 3. Re-read the reservation under lock: this is the current truth.
        const current = await client.query(
            "SELECT status, start_time, end_time FROM reservations WHERE id = $1 FOR UPDATE",
            [reservationId]
        );
        const reservation = current.rows[0];

        // 4. State-machine and resource rules
        if (reservation.status !== "pending") {
            throw new HttpError(409, "Only pending reservations can be approved");
        }
        if (resource.rows[0].status !== "available") {
            throw new HttpError(409, "This resource is not available for booking");
        }

        // 5. Friendly overlap pre-check
        const overlap = await client.query(
            `SELECT 1
               FROM reservations
              WHERE resource_id = $1
                AND status = 'approved'
                AND tstzrange(start_time, end_time) && tstzrange($2, $3)
              LIMIT 1`,
            [resourceId, reservation.start_time, reservation.end_time]
        );
        if ((overlap.rowCount ?? 0) > 0) {
            throw new HttpError(409, "This time slot overlaps an approved reservation");
        }

        // 6. The write
        await client.query(
            "UPDATE reservations SET status = 'approved' WHERE id = $1",
            [reservationId]
        );

        // 7. The history, in the same transaction
        await client.query(
            `INSERT INTO reservation_events (reservation_id, actor_id, event_type)
             VALUES ($1, $2, 'approved')`,
            [reservationId, adminId]
        );

        return { id: reservationId, status: "approved" };
    });
}


const CANCEL_CUTOFF_HOURS = 24;

export async function createReservation(
    userId: number,
    input: { resourceId: number; startTime: string; endTime: string; purpose: string }
) {
    return withTransaction(async (client) => {
        const resource = await client.query(
            "SELECT status FROM resources WHERE id = $1 FOR UPDATE",
            [input.resourceId]
        );
        if (resource.rowCount === 0) throw new HttpError(404, "Resource not found");
        if (resource.rows[0].status !== "available") {
            throw new HttpError(409, "This resource is not available for booking");
        }

        const overlap = await client.query(
            `SELECT 1
               FROM reservations
              WHERE resource_id = $1
                AND status = 'approved'
                AND tstzrange(start_time, end_time)
                    && tstzrange($2::timestamptz, $3::timestamptz)
              LIMIT 1`,
            [input.resourceId, input.startTime, input.endTime]
        );
        if ((overlap.rowCount ?? 0) > 0) {
            throw new HttpError(409, "That time is already booked");
        }

        const inserted = await client.query(
            `INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, status`,
            [input.resourceId, userId, input.startTime, input.endTime, input.purpose]
        );
        const reservation = inserted.rows[0];

        await client.query(
            `INSERT INTO reservation_events (reservation_id, actor_id, event_type)
             VALUES ($1, $2, 'requested')`,
            [reservation.id, userId]
        );

        return reservation;
    });
}

export async function rejectReservation(
    reservationId: number,
    adminId: number,
    reason?: string
) {
    return withTransaction(async (client) => {
        const current = await client.query(
            "SELECT status FROM reservations WHERE id = $1 FOR UPDATE",
            [reservationId]
        );
        if (current.rowCount === 0) throw new HttpError(404, "Reservation not found");
        if (current.rows[0].status !== "pending") {
            throw new HttpError(409, "Only pending reservations can be rejected");
        }

        await client.query(
            "UPDATE reservations SET status = 'rejected' WHERE id = $1",
            [reservationId]
        );
        await client.query(
            `INSERT INTO reservation_events (reservation_id, actor_id, event_type, reason)
             VALUES ($1, $2, 'rejected', $3)`,
            [reservationId, adminId, reason ?? null]
        );

        return { id: reservationId, status: "rejected" };
    });
}

export async function cancelReservation(
    reservationId: number,
    actor: CurrentUser,
    reason?: string
) {
    return withTransaction(async (client) => {
        const current = await client.query(
            "SELECT user_id, status, start_time FROM reservations WHERE id = $1 FOR UPDATE",
            [reservationId]
        );
        if (current.rowCount === 0) throw new HttpError(404, "Reservation not found");
        const reservation = current.rows[0];

        const isAdmin = actor.role === "admin";
        const isOwner = reservation.user_id === actor.id;
        if (!isAdmin && !isOwner) throw new HttpError(404, "Reservation not found");

        if (reservation.status !== "pending" && reservation.status !== "approved") {
            throw new HttpError(409, "This reservation can no longer be cancelled");
        }
        if (isAdmin && !reason) {
            throw new HttpError(400, "A reason is required", {
                reason: ["Reason is required"],
            });
        }
        if (!isAdmin && reservation.status === "approved") {
            const hoursLeft =
                (new Date(reservation.start_time).getTime() - Date.now()) / 36e5;
            if (hoursLeft < CANCEL_CUTOFF_HOURS) {
                throw new HttpError(
                    409,
                    `Approved reservations can only be cancelled ${CANCEL_CUTOFF_HOURS} hours before they start`
                );
            }
        }

        await client.query(
            "UPDATE reservations SET status = 'cancelled' WHERE id = $1",
            [reservationId]
        );
        await client.query(
            `INSERT INTO reservation_events (reservation_id, actor_id, event_type, reason)
             VALUES ($1, $2, 'cancelled', $3)`,
            [reservationId, actor.id, reason ?? null]
        );

        return { id: reservationId, status: "cancelled" };
    });
}

export async function listReservations(user: CurrentUser, status?: string) {
    const result = await pool.query(
        `SELECT rv.id,
                rv.start_time  AS "startTime",
                rv.end_time    AS "endTime",
                rv.purpose,
                rv.status,
                rv.created_at  AS "createdAt",
                r.id           AS "resourceId",
                r.name         AS "resourceName",
                u.id           AS "userId",
                u.name         AS "userName",
                u.email        AS "userEmail",
                u.phone        AS "userPhone"
           FROM reservations rv
           JOIN resources r ON r.id = rv.resource_id
           JOIN users u     ON u.id = rv.user_id
          WHERE ($1::boolean OR rv.user_id = $2)
            AND ($3::text IS NULL OR rv.status = $3)
          ORDER BY rv.start_time DESC`,
        [user.role === "admin", user.id, status ?? null]
    );
    return result.rows;
}
