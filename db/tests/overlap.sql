INSERT INTO users (name, email, password_hash, role) VALUES ('Test User', 't@x.com', 'x', 'member');
INSERT INTO categories (name) VALUES ('Rooms');
INSERT INTO resources (category_id, name, location) VALUES (1, 'Room A', 'Floor 1');

-- 1. approved 14:00-15:00            -> OK
INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose, status)
VALUES (1, 1, '2026-11-01 14:00+05:30', '2026-11-01 15:00+05:30', 'first', 'approved');

-- 2. approved 14:30-15:30 (overlap)  -> MUST FAIL (23P01)
INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose, status)
VALUES (1, 1, '2026-11-01 14:30+05:30', '2026-11-01 15:30+05:30', 'overlap', 'approved');

-- 3. pending 14:30-15:30             -> OK (only approved rows are checked)
INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose, status)
VALUES (1, 1, '2026-11-01 14:30+05:30', '2026-11-01 15:30+05:30', 'pending', 'pending');

-- 4. approved 15:00-16:00            -> OK (back-to-back, half-open range)
INSERT INTO reservations (resource_id, user_id, start_time, end_time, purpose, status)
VALUES (1, 1, '2026-11-01 15:00+05:30', '2026-11-01 16:00+05:30', 'back to back', 'approved');
