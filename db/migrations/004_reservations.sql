CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE reservation_events (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id  INTEGER NOT NULL REFERENCES reservations (id) ON DELETE RESTRICT,
    actor_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    event_type      TEXT NOT NULL,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
