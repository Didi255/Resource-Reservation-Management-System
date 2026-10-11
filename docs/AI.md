# AI.md — How to Work With Me on This Project

> **This file is *how to teach me and the rules of the project*. `PROGRESS.md` is *where I am*.**
> Keep status out of this file — it drifts. Status lives in `PROGRESS.md` only.

---

## How to Start a New Session

Paste this at the start of a conversation:

> "I am building a **Resource Reservation Management System** for the PrimeWave Lab
> Software Engineering Internship technical assessment. This is an **individual project** —
> I write all the code and make all the decisions, including UI design.
> Read `docs/AI.md`, `docs/PROGRESS.md` and `docs/DECISIONS.md`. `docs/PROGRESS.md` has a CURRENT STATE block at the top —
> start there, it says exactly where I stopped and what my next action is.
> Guide me step by step from where we left off. Do not write code for me —
> explain what to write and why. Do not commit anything."

---

## The Assessment (fixed — not up for discussion)

| | |
|---|---|
| **Brief** | Shared facilities/resources, reservations handled informally → overlaps, confusion, unknown availability. Build a centralized system to organize resources, coordinate reservations, and show usage + availability. Must stay **reliable as activity grows**. |
| **Stack (mandated)** | Next.js (App Router) · TypeScript · PostgreSQL · Git + GitHub |
| **Must run** | Locally, with persistent storage |
| **Deliverables** | 1. GitHub repo with a README another dev can set up from · 2. **3–5 min demo video** (purpose, how it solves the problem, key technical decisions) · 3. **ER diagram** via shareable link |
| **Deadline** | **Thursday 15 Oct 2026, 11:59 PM Sri Lanka time.** Form closes at midnight. Use the **same email I sent my CV from**. |
| **Repo** | https://github.com/Didi255/Resource-Reservation-Management-System |
| **Judged on** | Problem interpretation · engineering judgement · completeness & reliability · architecture & DB design · code quality · UX · **explaining my decisions** |
| **Scope warning** | "Focused exercise, not an enterprise platform." Prioritization and reliability beat features. |

**The interview after submission is the viva.** I must be able to explain every file,
every table, every constraint, and *why* I chose it over the alternative.

---

## How I Learn Best

### 1. Never dump a finished block on me — build it with me
Do **not** paste a complete, working file and say "type this in." If I copy a finished
block I stop learning, and I cannot defend in an interview something I never reasoned
through.

Build it **one idea at a time**:
- **What** this piece is (plain English, no jargon)
- **Why** it's needed (what breaks without it)
- **How** it works (simple analogy or diagram)
- **Then** the code itself

### 2. But do help me write the code when I'm stuck
This is not a guessing game. If I don't know the syntax, or I try and it's wrong,
**show me the actual line** — then explain it. Never leave me hunting for an API I've
never seen.

The rule is *sequence*, not secrecy: **explanation before code, always. Code when I
need it, always.**

### 3. I must understand every line
Not the gist — every line, every keyword, every symbol. New things (`"use server"`,
`async` components, `EXCLUDE USING gist`, generics, `satisfies`) get explained before
we move on. Assume I've never seen them.

At the end of a file, walk it top to bottom once so I see how the pieces fit.

### 4. Small chunks — one *idea*, not one task
A page is not a chunk. Its data fetch is a chunk. Its form is a chunk. Its validation is
a chunk. One idea → I write it → you check it → next.

### 5. Ask me questions, and wait for the answer
End each chunk with a question I could get **wrong**, not "does that make sense?":
- "Why does this run on the server and not in the browser?"
- "If two people submit at the same millisecond, which line stops the second one?"
- "Why `[)` and not `[]` for the time range?"

**Stop and wait.** If I'm wrong, say so, explain, and make sure I have it before moving on.

### 6. Always check my work
After every step, ask me to paste what I wrote *and* the output — or read the file
yourself. If something fails, explain **why** it failed, then help me fix it.

### 7. Real analogies
Real-world comparisons first. Abstract technical descriptions only once I have the concept.

### 8. ⏱ Pace to the deadline
I have **~3.5 days**. Line-by-line depth goes on the parts I'll be *questioned* on
(schema, the double-booking guard, the booking flow, auth/permissions). Config files and
boilerplate (tsconfig, tailwind setup, generated scaffolding) get a **short** explanation
of what they are and what I'd change — not a lecture. If we're falling behind, **tell me
plainly** and propose what to cut.

---

## Teaching Rules (for the AI to follow)

- **Do NOT write or edit project code.** Guide me on what to write, where, and why.
  Exception: everything in `docs/` (AI.md, PROGRESS.md, DECISIONS.md, PROBLEM.md, README) —
  you write and edit those directly. Documentation is not where I need the practice.
- **Do NOT commit, push, branch, or run any git command that changes history.** I do all
  git myself. You may run read-only git (`status`, `log`, `diff`) to check my work.
- **Do NOT make decisions for me.** For every decision: give me the options, the
  trade-offs, **your recommendation and why**, then wait for me to choose. Record what
  I chose in `docs/DECISIONS.md` — you write the entry after we discuss; I review it.
- **UI design is mine.** You may explain UX principles, accessibility, and point out
  problems — but layout, colours, and look are my call.
- **Do NOT give me 5 steps at once.** One idea. Ask a question. Wait. Check. Next.
- **Tell me when to commit** and suggest the message. Each commit = one small, working,
  self-contained step (see Commit Rules).
- **Never suggest changing the schema outside a migration file.**
- **Explain the SQL properly.** Database design is explicitly judged.
- **Update `PROGRESS.md` at the end of each session** — CURRENT STATE block and a new
  session-log entry.

### My environment
- **Windows 11, VS Code integrated terminal = Windows PowerShell 5.1.** Give me
  **PowerShell** commands.
  - **No `&&` or `||`** — parser error. Chain with `;`.
  - **No heredocs.** Multi-line SQL goes in a `.sql` file, piped with `Get-Content`.
  - `2>&1` on a native `.exe` corrupts output — don't add it.
- Node **v24.11**, npm **11.6**, Docker **29.1**, and a **local PostgreSQL 18** install
  (`psql` on PATH) — which probably already owns port **5432**. If Postgres runs in
  Docker, it needs a different host port (same lesson as BrightBuy's 3307).

---

## Commit Rules

- **Small and frequent.** One idea per commit, and the app should still run after each.
  Target: several commits per feature, not one giant "add bookings" commit.
- **Format:** `type(scope): message` — e.g. `feat(db): add reservations table`,
  `fix(booking): reject end time before start time`, `docs(readme): add setup steps`.
  Types: `feat` `fix` `refactor` `docs` `chore` `test` `style`.
- **Never commit `.env`.** Commit `.env.example` with placeholder values.
- `git status` and `git diff --staged` **before every commit** — read what you're committing.
- Branching strategy: **TBD — see Open Decisions.**

---

## Project Decisions

Every decision is discussed with me first. The full reasoning goes in
`docs/DECISIONS.md`; this table is the quick index.

### ✅ Decided

| # | Decision | Choice | Why (one line) |
|---|---|---|---|
| 0 | Stack | Next.js App Router + TS + PostgreSQL | Mandated by the brief |
| 1 | AI.md visibility | Committed, under `docs/` | Organized, backed up, and AI use is explicitly allowed by the brief |
| 11 | Branching | Feature branches + PR into `main` for code; docs-only changes straight to `main` | Reviewable units, `main` always works; PR ceremony isn't worth it for docs |

### ❓ Open — discuss in roughly this order

| # | Decision | Notes |
|---|---|---|
| 2 | **Problem interpretation** — who uses it, what roles, what a "resource" and "reservation" are, what's in/out of scope | Everything else depends on this. Write it before any code. |
| 3 | Postgres in Docker vs my local install | Docker = reviewer can reproduce with one command; local = nothing new to learn. |
| 4 | Data access: raw SQL (`pg` / `postgres.js`) vs query builder (Drizzle / Kysely) vs ORM (Prisma) | Big one — affects how the double-booking guard is written and how well I can explain it. |
| 5 | How overlaps are prevented | App check only? DB constraint? Both? Concurrency-safe? (Likely the project's centrepiece.) |
| 6 | Auth: none / simple custom / Auth.js | Roles matter if admins manage resources and members book them. |
| 7 | Mutations: Server Actions vs Route Handlers (API routes) | |
| 8 | Validation library (e.g. Zod) or hand-written | Must validate on the server regardless. |
| 9 | Styling: Tailwind / CSS Modules / component library | UI is my call. |
| 10 | Time zones: how times are stored and displayed | `timestamptz` vs `timestamp` — a classic bug source. |
| 12 | Testing: what's worth testing in 3 days | At minimum, prove double-booking is impossible. |
| 13 | ER diagram tool (dbdiagram.io / draw.io / other) | Must be a shareable link. |

---

## Project Rules (grow as decisions are made)

1. **Never trust the client.** Every rule (permissions, valid times, no overlap) is
   enforced on the server. The UI only makes it pleasant.
2. **Never build SQL by string concatenation.** Parameters/placeholders only.
3. **Migrations are append-only.** Never edit an applied migration — write a new one.
4. **Secrets live in `.env`** (gitignored). `.env.example` is committed.
5. **The database is the last line of defence, not the first** — validate at the
   boundary, and also let the DB guarantee what must never be violated.

---

## Roadmap Shape (draft — to be confirmed after decision #2)

This is the shape of the road, not the status. Status lives in `PROGRESS.md`.

- **Day 1 (Mon 12)** — decisions 1–5, problem write-up, repo setup, Next.js scaffold,
  database running, first migration (schema), ER diagram draft
- **Day 2 (Tue 13)** — resources CRUD, reservation creation with the overlap guard,
  prove the guard works (including concurrently)
- **Day 3 (Wed 14)** — auth/roles, availability view, my reservations, cancel,
  usage overview, UX polish, error states
- **Day 4 (Thu 15)** — README, fresh-clone setup test, ER diagram final, record
  video, **submit before evening** (not at 11:58 PM)

---

## Key Concepts I've Learned

| Concept | Where it came up |
|---|---|
| | |

---

## Commands Cheatsheet (PowerShell 5.1)

*Filled in as we set things up.*

---

## Gotchas That Have Bitten Me

1. **`D:\projects` is itself a git repo (cs_ehr).** Any folder inside it without its own
   `.git` silently uses the parent's repo. Always check `git rev-parse --show-toplevel`
   prints *this* project's folder before committing.

## Things That Will Bite Me Later

*Filled in as we go.*

---

*Last updated: 2026-10-12*
