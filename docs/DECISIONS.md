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
