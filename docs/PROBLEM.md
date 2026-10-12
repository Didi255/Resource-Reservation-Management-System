# Problem Interpretation

## The problem in one paragraph

An organization shares facilities and equipment. Reservations are arranged through informal
messages and paper records, so people double-book, nobody is sure what is free, and nobody
can see how resources are actually used. The organization wants one place where resources
are listed, reservations are requested and approved, and availability and usage are visible —
and which stays correct as the number of bookings grows.

## What I'm optimizing for

Of the three pains in the brief (scheduling confusion, overlapping reservations, uncertainty
about availability), **overlapping reservations is the one that must be impossible, not just
unlikely.** The other two are solved by having a single source of truth and a clear
availability view. "Reliable as day-to-day activities grow" is read as: *two people clicking
at the same moment must never both get the same resource.* That guarantee is enforced by the
database, not only by application code.

## Users and roles

| Role | Can do |
|---|---|
| **Member** | Browse resources, see availability, request a reservation, see own reservations, cancel own reservation (before the cut-off) |
| **Admin** | Everything a member can, plus: create/edit/deactivate resources and categories, approve or reject requests, cancel any reservation **with a required reason**, see usage overview |

## Core concepts

- **Resource** — one bookable thing (a meeting room, a projector, a vehicle). Belongs to a
  **category**. Has a name, description, location, and an active flag.
- **Reservation** — a request by a member to use one resource for a time range
  (`start` inclusive, `end` exclusive), with a purpose.
- **Status lifecycle** — `pending` → `approved` | `rejected`; `pending`/`approved` →
  `cancelled`.
- **Rule that must always hold:** two **approved** reservations for the same resource never
  overlap in time.

## Scope tiers

### Must have (the project is not done without these)
1. Admin and member accounts, login, role checks enforced on the server
2. Resource and category management (admin)
3. Request a reservation (member), with validation (end after start, not in the past, resource active)
4. Approve / reject (admin); approving fails cleanly if it would overlap an approved booking
5. **Overlap prevention guaranteed by the database**, proven with a concurrency test
6. Availability view per resource (what is booked, what is free)
7. My reservations, with cancel
8. Admin cancellation with mandatory reason

### Should have (if Must is solid by Day 3)
9. **Admin reports dashboard** over a date range: utilization per resource, requests by status and category, peak times (one SQL query each)
10. Filter/search resources by category and by "free during this time"
11. Pending-conflict warning for admin (other requests competing for the same slot)

### Should have, added after reading the brief again
- **Teams (D15):** the scenario says resources are used by "individuals and teams". A user may belong to one team; the admin approval list and a usage-by-team report show it. Built after the core flow works.

### Could have (only with time left)
12. Category-based access (some member groups can only book some categories)

### Deliberately out of scope (and why)
| Not built | Reason |
|---|---|
| **Quantity per resource** ("5 projectors") | Counting overlapping units can't be enforced by a simple database constraint, and needs careful locking. Instead, each physical unit is its own resource inside a category. Documented as a known trade-off. |
| **Auto-allocation** | The brief's problem is coordination, not optimization. The human-in-the-loop approval already covers the safe version of it. |
| **Email/SMS notifications** | Needs external services; adds setup burden for reviewers; not core to the problem. In-app status is shown instead. |
| **Recurring reservations** | Real complexity (exceptions, partial conflicts) for a feature a "focused exercise" doesn't need. |
| **Cancel *requests* by members** | Simplified to: members cancel directly until a cut-off before start; after that, they contact an admin. Same intent, no extra workflow. |
| **Payments, SSO, multi-organization, mobile app** | Unrelated to the stated problem. |

## Assumptions (stated, so they can be challenged)

- One organization, one time zone (Asia/Colombo). Times are stored as absolute instants
  (`timestamptz`) and shown in that zone.
- Only **approved** reservations block a slot. Pending ones are visible to admins but don't
  reserve anything.
- Members cannot edit a reservation; they cancel and re-request.
- Cancellation cut-off for members: a configurable number of hours before start (default 24).
