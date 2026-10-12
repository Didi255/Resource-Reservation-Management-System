CREATE TABLE reservation_events (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id  INTEGER NOT NULL REFERENCES reservations (id) ON DELETE RESTRICT,
    actor_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    event_type      TEXT NOT NULL CHECK (event_type IN ('requested', 'approved', 'rejected', 'cancelled')),
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

