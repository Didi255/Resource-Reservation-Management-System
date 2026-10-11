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
