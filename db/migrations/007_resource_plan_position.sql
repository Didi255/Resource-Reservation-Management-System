-- Position of a resource's pin on the floor-plan illustration (D18).
-- Percent of the image width/height, 0-100. NULL means "not shown on the plan".
-- Both set or both NULL, so a pin can never be half placed.
ALTER TABLE resources
    ADD COLUMN plan_x SMALLINT,
    ADD COLUMN plan_y SMALLINT,
    ADD CONSTRAINT resources_plan_x_range CHECK (plan_x BETWEEN 0 AND 100),
    ADD CONSTRAINT resources_plan_y_range CHECK (plan_y BETWEEN 0 AND 100),
    ADD CONSTRAINT resources_plan_both_or_none CHECK ((plan_x IS NULL) = (plan_y IS NULL));
