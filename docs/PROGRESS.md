# PROGRESS.md

## CURRENT STATE

- **Stage:** Backend core complete. UI foundation and the Spaces page are built; booking, floor plan and admin screens are next.
- **Done:** D1-D21. Schema 001-007 + runner. Auth (register/login/logout/me, DB sessions). Resources API. Reservation lifecycle (create/approve/reject/cancel/list) as transactions. `npm run test:concurrency` PASSES: 50 parallel approvals -> 1x200, 49x409 (screenshot in `docs/concurrency-proof.png`); the script now deletes its own rows afterwards. Availability endpoint (`GET /api/availability?start&end`, D20). UI: app shell (sidebar / bottom tab bar), login and register, Spaces page with clock-dial time picker, summary tiles and category cards that open their resources inline.
- **In flight:** PR for `feat/ui-foundation` (merge it, then `git switch main; git pull; git switch -c feat/floor-plan`).
- **Next action:** floor plan with pins (D18, D21), then the booking panel/form, My bookings (cancel), Admin approvals, Admin reports.
- **Still to build:** floor-plan view with pins and a Plan/List toggle; booking form (POST /api/reservations from the UI) with a day timeline; My bookings; Admin approvals; reports queries (D11); teams (D15, migration 008); README with setup + known limitations; fresh-clone test; demo video; add `plan_x`/`plan_y` to the ER diagram; final UI polish pass.
- **Known limitations to list in README:** no rate limiting, no email verification/reset, registration reveals whether an email exists, quantity per resource not supported (D3), demo passwords in seed, single floor plan (D21), availability shows state but not who booked (D20).
- **ER diagram:** https://dbdiagram.io/d/Resource-Management-Sysytem-Database-Diagram-6acc45e327cfb7f1bcda3ba9 (source `docs/er-diagram.dbml`)
- **Working agreement:** bigger chunks, full code blocks; user can ask me to place files; user commits everything; explain what and why before writing code.
- **Deadline:** Thu 15 Oct 2026, 11:59 PM SLT (submit by Thursday afternoon)

---

## Session Log

### 2026-10-12 — Session 1
- Read the brief. Wrote `AI.md` (teaching rules, assessment constraints, open decisions).
- Found that `D:\projects` was the cs_ehr git repo, so this folder needed its own `.git` (resolved; the parent `.git` was removed).

### 2026-10-12 — Session 2
- Backend core finished and proven under concurrency (see above).
- Floor-plan illustration, six category illustrations and a login hero added under `public/`.
- Built the UI foundation and Spaces page. Visual system refined (D19). Fixed a Cache Components blocking-route error by moving cookie reads behind `<Suspense>`.
- Lint found a setState-in-effect; replaced with `useSyncExternalStore` for the browser-only initial time.
