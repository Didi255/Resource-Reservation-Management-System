# PROGRESS.md

## CURRENT STATE

- **Stage:** Feature complete. Only the submission deliverables remain.
- **Done:** D1-D22 (D15 teams was prototyped and dropped). Schema 001-007 + runner. Auth (register/login/logout/me, DB sessions). Resources API with categories and floor-plan positions. Reservation lifecycle (create/approve/reject/cancel/list, `mine=1`) as transactions. Availability endpoint. Admin reports (utilisation, requests by category, peak times with heatmap). UI: app shell with collapsible sidebar, login and register, Spaces (floor plan with push pins), Resources (category cards), My bookings (cancel with confirmation), Admin approvals, Manage resources (retire, place on plan), Reports (tabs, donut, stacked bars, heatmap).
- **Proof:** `npm run test:concurrency` PASSES: 50 parallel approvals -> 1x200, 49x409, one approved row, no 5xx (`docs/concurrency-proof.png`). `db/tests/overlap.sql` checks the constraint in plain SQL.
- **Demo data:** `npm run seed` (base) then `npm run seed:demo` (about 40 reservations, six extra members). Demo resets reservations.
- **Bug found and fixed on the way:** the utilisation report counted unbooked resources as fully booked, because `LEAST`/`GREATEST` ignore NULLs on a LEFT JOIN. Found by checking the numbers against raw data.
- **Demo video:** https://youtu.be/v9bT7-5eBdk (recorded, uploaded, linked from the README).
- **Fresh-clone test:** passed (clone, install, migrate, seed, seed:demo, dev, lint, tsc, concurrency test).
- **Next action:** final repo check, then submit the Google Form with the same email as the CV.
- **Still to do:** update the ER diagram on dbdiagram.io from `docs/er-diagram.dbml` (now includes `plan_x`/`plan_y`, `retired`), demo video (3-5 minutes), submit the Google Form with the same email as the CV.
- **ER diagram:** https://dbdiagram.io/d/Resource-Management-Sysytem-Database-Diagram-6acc45e327cfb7f1bcda3ba9 (source `docs/er-diagram.dbml`)
- **Known limitations:** listed in the README.
- **Deadline:** Thu 15 Oct 2026, 11:59 PM SLT (submit by Thursday afternoon)

---

## Session Log

### 2026-10-12 — Session 1
- Read the brief. Wrote `AI.md` (teaching rules, assessment constraints, open decisions).
- Found that `D:\projects` was the cs_ehr git repo, so this folder needed its own `.git` (resolved; the parent `.git` was removed).

### 2026-10-12 and 2026-10-13 — Session 2
- Backend core finished and proven under concurrency.
- Built the whole UI: shell, auth pages, plan, list, bookings, admin approvals, resource management, reports. Visual system refined (D19).
- Fixed a Cache Components blocking-route error by moving cookie reads behind `<Suspense>`.
- Prototyped teams (D15), then removed them as over-engineered.
- Wrote the README, demo seed and this progress file.
