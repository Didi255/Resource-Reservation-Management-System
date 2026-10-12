# Decisions

## D1: Commit AI.md to the repo, under docs/
- **Date:** 2026-10-12
- **Options considered:** commit at root / gitignore / commit under docs/
- **Chosen:** commit under docs
- **Why:** The brief allows AI tools, and the file documents how I learned and decided things, so publishing it is honest and backed up
- **Trade-off accepted:** publishing it means reviewers see my gaps and teaching rules.

## D2: Feature branches with PRs for code; docs-only changes go straight to `main`
- **Date:** 2026-10-12
- **Options considered:** one long-lived `dev` branch / feature branches with PRs into `main` / `dev` plus feature branches
- **Chosen:** feature branches with PRs into `main` for code. Docs-only changes are committed directly to `main`.
- **Why:** Each PR is a reviewable unit and `main` always works. Reviewers can browse the merged PRs as a story, and the PR descriptions double as a decision log. A staging `dev` branch adds a layer of merging that a solo project doesn't need. Documentation changes are low-risk, so a branch and PR for them is ceremony without benefit.
- **Trade-off accepted:** a few extra commands per feature, and docs commits reach `main` without a separate review step. Acceptable on a solo project.


## D3: Problem interpretation and scope
- **Date:** 2026-10-12
- **Options considered:** (a) build every idea: approval, categories with access levels, quantities, auto-allocation, cancel requests; (b) a small, provably-correct core with an approval workflow; (c) no approval, instant booking.
- **Chosen:** (b). Full reasoning and the scope tiers are in `docs/PROBLEM.md`.
- **Why:** The brief rewards prioritization and reliability over features, and there are ~3.5 days. The one thing the business cannot tolerate is a double booking, so that is guaranteed by the database and everything else is sized around it. Approval stays because it is the "human in the loop" the organization wants.
- **Trade-off accepted:** No quantity-per-resource (units are separate resources in a category), no auto-allocation, no email, no recurring bookings. These are named in the README as known limitations rather than half-built.


## D4: Prevent double booking with an exclusion constraint (A) plus a row lock in the transaction (B)
- **Date:** 2026-10-12
- **Options considered:** (A) exclusion constraint / (B) `SELECT … FOR UPDATE` on the resource, then check, then write / (C) `SERIALIZABLE` isolation with retry. Also considered and rejected: "check then insert in a transaction" alone — under Postgres's default `READ COMMITTED` two concurrent transactions both see "no overlap" and both commit.
- **Chosen:** A + B.
- **Why:** The exclusion constraint (`EXCLUDE USING gist (resource_id WITH =, tstzrange(start, end) WITH &&) WHERE status = 'approved'`) makes an overlapping approved pair unrepresentable, so the guarantee holds even if application code is wrong. The row lock serializes approvals per resource so the pre-check is accurate and the common conflict path returns a clear 409 instead of relying on catching an exception. A constraint violation (`23P01`) is still caught and mapped to 409 as a backstop.
- **Trade-off accepted:** More to explain than a plain check (GiST index, `btree_gist` extension, range types, lock ordering). Approvals on the same resource are serialized — fine at this scale. B is not needed for correctness, only for clearer behaviour.


## D5: Raw SQL with the `pg` driver and plain `.sql` migrations
- **Date:** 2026-10-12
- **Options considered:** (A) raw SQL with `pg` / (B) query builder (Drizzle, Kysely) / (C) ORM (Prisma).
- **Chosen:** A — simple.
- **Why:** The data layer is small (about five tables), and what is being judged — constraints, transactions, locking — is visible only in SQL I wrote myself. Exclusion constraints and range types are awkward or unsupported in ORMs, so a tool would end up bypassed anyway. Keeping SQL plain keeps the project explainable.
- **Trade-off accepted:** More typing, no generated result types (typed by hand at the repo boundary), and a small migration runner to maintain.


## D6: PostgreSQL in Docker, pinned to major version 16, host port 5433
- **Date:** 2026-10-12
- **Options considered:** Docker / local Postgres install. Versions considered: 16, 18 (matches the developer's local install), `latest`.
- **Chosen:** Docker Compose, image `postgres:16`, host port 5433 mapped to container 5432.
- **Why:** One command gives a reviewer the identical database, which is what the README requirement asks for. Pinning the major version stops the environment from drifting. Version 16 is widely deployed and supports everything used (exclusion constraints, range types, `btree_gist`). Port 5433 avoids a clash with a local Postgres on 5432.
- **Trade-off accepted:** Docker Desktop must be running, and the developer's local Postgres 18 differs from the container (acceptable: the app only uses features available in 16).


## D7: Tailwind CSS for styling
- **Date:** 2026-10-12
- **Options considered:** Tailwind / CSS Modules / component library (shadcn/ui, MUI).
- **Chosen:** Tailwind CSS.
- **Why:** Fast to style consistently inside a 3-day window, and it keeps the look fully under my control (a component library would impose its own). It integrates with Next.js through the standard scaffold.
- **Trade-off accepted:** Utility classes make markup noisier, and there is a small learning cost compared with plain CSS.


## D8: One `resources` table with a category, not separate tables per kind
- **Date:** 2026-10-12
- **Options considered:** separate `facilities` and `equipment` tables / one `resources` table that references a `categories` table.
- **Chosen:** one `resources` table.
- **Why:** A reservation needs one honest foreign key to the thing booked. Two tables would force a polymorphic association (two nullable columns, or a type plus an unchecked id), which the database cannot enforce. The overlap guarantee from D4 would also have to be duplicated per table. With one table the rule lives in one place and a new kind of resource is a new row.
- **Trade-off accepted:** facilities and equipment cannot have different columns without nullable fields or a side table. That is acceptable because the system only needs name, description, location and an active flag for every kind.


## D9: Resource names are unique within a category
- **Date:** 2026-10-12
- **Options considered:** no uniqueness / `UNIQUE (category_id, name)`.
- **Chosen:** unique within a category.
- **Why:** Two identically named resources are exactly the "scheduling confusion" the brief describes, and the database can prevent it with one constraint. Resources get a surrogate integer id because names change.
- **Trade-off accepted:** admins must give each unit a distinct name ("Projector 1", "Projector 2").


## D10: Reservation history in a `reservation_events` table
- **Date:** 2026-10-12
- **Options considered:** four tables, with only the current status stored on `reservations` / a fifth table recording each state change with actor, time and reason.
- **Chosen:** add `reservation_events`.
- **Why:** It gives a real usage history, is the natural home for the mandatory cancellation reason, and makes approval a genuine multi-statement transaction (update status and insert event, atomically).
- **Trade-off accepted:** one more table to write and keep consistent; every status change must also write an event.


## D11: Admin reports are three SQL queries, not a reporting module
- **Date:** 2026-10-12
- **Options considered:** no reporting / three focused reports on a dashboard / a configurable analytics module.
- **Chosen:** three focused reports over a date range: utilization per resource, requests by status and category, peak times.
- **Why:** The brief asks for "a clear understanding of usage and availability". Each report is one query that demonstrates a different SQL technique, built only after the core booking flow is solid.
- **Trade-off accepted:** fixed reports, no export or custom filters. Utilization is the one to keep if time runs out.


## D12: `TEXT` + `CHECK` for enumerated values, two `timestamptz` columns for time ranges
- **Date:** 2026-10-12
- **Options considered:** native `ENUM` / `TEXT` with `CHECK`; one `tstzrange` column / `start_time` + `end_time`.
- **Chosen:** `TEXT` + `CHECK`, and two timestamp columns.
- **Why:** Same protection as an enum, but adding a value is a simple constraint change. Two columns are easier to read, validate and aggregate in reports; the exclusion constraint builds the range with `tstzrange(start_time, end_time)`.
- **Trade-off accepted:** the range is derived in the constraint rather than stored, so the constraint expression must match any range-based queries.


## D13: Resource `status` replaces an active flag; no `capacity` column
- **Date:** 2026-10-12
- **Options considered:** `is_active` boolean plus a separate condition column / one `status` column (`available`, `under_maintenance`, `retired`) plus `condition_notes`; and an informational `capacity` column / none.
- **Chosen:** single `status` column, free-text `condition_notes`, no `capacity`.
- **Why:** "usable?" and "condition?" are one question, and two columns could disagree. Capacity as concurrent use is the counting problem excluded by D3. As a plain seat count it solves none of the problems in the brief, would be empty for equipment, and is only useful with an attendees field and a filter that are out of scope. Seat counts can go in `description`.
- **Trade-off accepted:** no filtering or validation by room size. Adding a column later is a single migration.


## D14: Database-backed sessions with a hand-rolled login
- **Date:** 2026-10-12
- **Options considered:** (A) hand-rolled signed-cookie/JWT with a database role re-check / (B) Auth.js / (C) hand-rolled sessions stored in a `sessions` table.
- **Chosen:** C.
- **Why:** The role must be re-checked in the database on each request anyway, so a session lookup costs almost nothing extra. C gives real revocation (logout ends the session; deactivating a user can delete theirs) and is simpler to explain than signing and JWT claims. Passwords are bcrypt hashes, and only a SHA-256 hash of the session token is stored, so a leaked table cannot be used to log in. The cookie is `HttpOnly` and `SameSite=Lax`.
- **Trade-off accepted:** one more table and one query per request. Known limitations, stated in the README: no rate limiting, no email verification, no password reset.


## D15: Teams deferred to a should-have after the core flow
- **Date:** 2026-10-12
- **Options considered:** leave out / `teams` table with a nullable `users.team_id`, built after the core flow / many-to-many users-teams with "booking as" a team now.
- **Chosen:** `teams` plus `users.team_id` as migration 008 (007 is now used for floor-plan positions, D21) after the core booking flow works; until then a team booking is a member booking on the team's behalf.
- **Why:** The brief says resources are used by "individuals and teams", so usage by team is worth showing. The change is additive (one table, one nullable column), so deciding later costs no rework, and the core flow protects against the three stated problems.
- **Trade-off accepted:** if time runs out it stays a documented limitation. Members belong to at most one team.


## D16: Zod for request validation
- **Date:** 2026-10-12
- **Options considered:** hand-written checks / Zod.
- **Chosen:** Zod.
- **Why:** About eight routes accept input and the client cannot be trusted. One declared schema per route validates the body and produces the TypeScript type from the same definition, with fewer holes than repeated `if` chains.
- **Trade-off accepted:** one more dependency and a small amount to learn.


## D17: UI direction: light, blue and white, mobile-first, Inter
- **Date:** 2026-10-12
- **Options considered:** warm cream + black (SpaceIQ-style) / cool blue and white / purple accent; top pill tabs / left sidebar.
- **Chosen:** cool white background (#F4F7FE), white surfaces, deep navy text, one electric blue (#2563FF) as the brand, cyan (#38BDF8) only for focus and active-pin glow, and colour otherwise reserved for availability (green free, red booked, amber pending, grey maintenance). Inter typeface. Light theme only. A sidebar on desktop that becomes a bottom tab bar on phones.
- **Why:** The tool is used mostly by members on phones, so the layout is designed for narrow screens first. Colour carries meaning (availability), so the brand colour stays quiet. Colours are tokens in `globals.css`, so changing the brand is a one-line edit.
- **Trade-off accepted:** no dark mode. Blue is a safe, conventional choice over a more distinctive purple.
- **Update (2026-10-12):** typeface, palette and glow rules were refined in D19. Light theme, one blue accent, colour-for-meaning and the sidebar/tab-bar split still stand.


## D18: Floor plan is an illustration with positioned pins
- **Date:** 2026-10-12
- **Options considered:** schematic SVG blocks / one isometric illustration with clickable pins / hand-aligned hotspots over a real plan / 3D per-room models.
- **Chosen:** one generated isometric illustration as a backdrop, with a pin per spatial resource at `plan_x`, `plan_y` (percent). The pin colour shows availability at the selected time; clicking opens the booking panel. Resources without a position (equipment, vehicles, parking) are shown as cards with the same status colours. One generated illustration per category is used as card artwork.
- **Why:** The brief's core pain is uncertainty about availability, and a plan that changes colour with time answers that visually. Pins tolerate imperfect artwork, scale with the window, and need only two numeric columns. Resources not placed on the plan still work.
- **Trade-off accepted:** a single floor, artwork that depends on image generation (time-boxed to 30 minutes, with a flat SVG plan as fallback), and a plan that is secondary to the list on phones.



## D19: UI visual system refined: Geist, neutral palette, pastel status, Phosphor icons
- **Date:** 2026-10-12
- **Options considered:** keep D17 as written (Inter, cool-blue page, cyan glow) / a warm editorial monochrome / a neutral slate base with a single blue accent.
- **Chosen:** Geist and Geist Mono; neutral slate surfaces (page #F8FAFC, ink #0F172A, muted #64748B, border #E2E8F0); one blue accent (#2563EB); availability shown with soft pastel fills and a darker ink for the text; Phosphor icons; no glows or gradients except a blue ring on the selected category card. Sidebar from the lg breakpoint, bottom tab bar below it.
- **Why:** Interface text is mostly small numbers and labels, so a UI face with a matching mono for counts and times reads better than Inter. Pastel fills with dark ink keep status colours accessible and calm; the saturated colours are kept for pins. A single accent keeps blue meaning "action or selected".
- **Trade-off accepted:** supersedes the typeface, palette and cyan-glow parts of D17. Deliberately no perpetual or looping animation: this is a tool people scan quickly, so motion stays at quiet entrances and press feedback.


## D20: Availability is computed in SQL per time window and exposes state only
- **Date:** 2026-10-12
- **Options considered:** return every reservation and compute in the browser / one endpoint that returns a state per resource for a window.
- **Chosen:** `GET /api/availability?start&end` returns each non-retired resource with one state (maintenance, booked, pending, free), decided in a single query using the same half-open overlap rule as the exclusion constraint.
- **Why:** The browser needs one answer per resource, not other members' bookings. Doing it in the database avoids shipping reservation rows to every member and keeps the overlap rule in one place.
- **Trade-off accepted:** it reports that something is booked but not by whom or for how long; a day timeline for the booking panel will need a second, narrower endpoint.


## D21: Floor-plan position is two nullable percentage columns on resources
- **Date:** 2026-10-12
- **Options considered:** a separate `resource_positions` table / a JSON column / two columns on `resources`.
- **Chosen:** migration 007 adds `plan_x` and `plan_y` (SMALLINT, 0 to 100) to `resources`, with a check that both are set or both are empty.
- **Why:** Each resource has at most one position on one plan, so a second table adds a join for no benefit. Percentages stay valid at any image size, and the CHECK constraints stop half-placed pins at the database.
- **Trade-off accepted:** one floor only; a multi-floor plan would need a `floor` column or a table.
