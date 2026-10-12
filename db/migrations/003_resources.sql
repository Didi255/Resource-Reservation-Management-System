CREATE TABLE resources (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id     INTEGER NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    name            TEXT NOT NULL,
    location        TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'under_maintenance', 'retired')),
    condition_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT resources_name_unique_per_category UNIQUE (category_id, name)
);
