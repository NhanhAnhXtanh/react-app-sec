# Roadmap

Milestone: **v0.1** — DataCollection + AppTable template with Company/Department features.

## Phase 1 — Stabilize and document (current)

**Goal:** Lock the implemented architecture, keep behavior aligned with `REQUIREMENTS.md` and `Requirement.txt`.

- Keep `useDataCollection` / `useAppTable` as the only table binding path.
- Document intentional deviation: **routes + URL state** instead of Zustand form stores (see `PROJECT.md`).
- Optional: audit mock APIs for keyword, pagination, sort, and `companyId` filter on departments.
- Optional: tighten TypeScript / lint on touched files.

**Depends on:** Nothing (baseline).

## Phase 2 — Optional enhancements

Pick based on product need (not all required):

1. **UI kit:** Add Shadcn/ui on Tailwind for dialogs, buttons, inputs — visual parity with typical admin templates.
2. **Spec parity:** Introduce Zustand feature stores + overlay-only form hosts **only if** stakeholders require exact match to original prompt (migration plan: mirror routes into store actions first).
3. **Backend:** Replace in-memory mock with real HTTP APIs; keep `PageRequest` / `PageResponse` contract.

## Phase 3 — Follow GSD execution

After `.planning/` is in place, use **`/gsd-plan-phase 1`** to produce executable `PLAN.md` tasks for Phase 1 items above.
