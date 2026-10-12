# PROGRESS.md

## CURRENT STATE

- **Stage:** Backend core complete; UI next
- **Done:** D1-D16. Schema 001-006 + runner. Auth (register/login/logout/me, DB sessions). Resources API. Reservation lifecycle (create/approve/reject/cancel/list) as transactions. `npm run test:concurrency` PASSES: 50 parallel approvals -> 1x200, 49x409 (screenshot in `docs/concurrency-proof.png`).
- **In flight:** PR for `feat/reservations` (merge it, then `git switch main; git pull`)
- **Next action:** UI on `feat/ui-foundation`. Decide with the user: calendar style (week grid vs day list), navigation, colours. Screens needed: login/register, resource list + detail with availability, book form, my reservations (cancel), admin approvals, admin reports.
- **Still to build:** availability endpoint (booked ranges per resource), reports queries (D11), teams (D15, migration 007), README with setup + known limitations, fresh-clone test, demo video.
- **Known limitations to list in README:** no rate limiting, no email verification/reset, registration reveals whether an email exists, quantity per resource not supported (D3), demo passwords in seed.
- **ER diagram:** https://dbdiagram.io/d/Resource-Management-Sysytem-Database-Diagram-6acc45e327cfb7f1bcda3ba9 (source `docs/er-diagram.dbml`)
- **Working agreement:** bigger chunks, full code blocks; user can ask me to place files; user commits everything.
- **Deadline:** Thu 15 Oct 2026, 11:59 PM SLT (submit by Thursday afternoon)

---

## Session Log

### 2026-10-12 — Session 1
- Read the brief. Wrote `AI.md` (teaching rules, assessment constraints, open decisions).
- Found that `D:\projects` is the cs_ehr git repo — this folder needs its own `.git`.
