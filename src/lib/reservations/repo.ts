import { withTransaction } from "@/lib/db";
import { HttpError } from "@/lib/http";

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
