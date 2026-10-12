# PROGRESS.md

## CURRENT STATE

- **Stage:** Schema merged (PR #2); auth next, on branch `feat/auth`
- **Last done:** D1-D14 decided. Migrations 001-005 and the runner (`npm run migrate`) are merged; the overlap constraint is proven by `db/tests/overlap.sql`. The folder is being moved out of `D:\projects` to `D:esource-reservation-system` (after the move run `docker compose up -d` then `npm run migrate`).
- **Next action:** write `db/migrations/006_sessions.sql`; `npm install bcryptjs` and `-D @types/bcryptjs`; `src/lib/auth/crypto.ts` (hashPassword, verifyPassword, generateSessionToken, hashSessionToken); then register / login / logout routes and `getCurrentUser()`.
- **Open question for the user:** why is a fast hash (SHA-256) fine for session tokens but not for passwords?
- **Working agreement:** bigger chunks, full code blocks to paste with a short explanation; the slow line-by-line pace is kept only for the booking transaction.
- **ER diagram:** https://dbdiagram.io/d/Resource-Management-Sysytem-Database-Diagram-6acc45e327cfb7f1bcda3ba9 (source: `docs/er-diagram.dbml`; add the `sessions` table there)
- **Blockers:** none
- **Deadline:** Thu 15 Oct 2026, 11:59 PM SLT

---

## Session Log

### 2026-10-12 — Session 1
- Read the brief. Wrote `AI.md` (teaching rules, assessment constraints, open decisions).
- Found that `D:\projects` is the cs_ehr git repo — this folder needs its own `.git`.
