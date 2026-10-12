CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE reservations (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resource_id  INTEGER NOT NULL REFERENCES resources (id) ON DELETE RESTRICT,
    user_id        INTEGER NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    purpose         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT reservations_end_after_start CHECK (end_time > start_time),
    CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status = 'approved')

);
