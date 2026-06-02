# Project context — Tanstack Table template

## Purpose

Reusable **data table framework** inspired by Jmix:

- **DataCollection** (`useDataCollection<T>`) owns server state, list UI state, and React Query; it does **not** call TanStack Table.
- **AppTable** (`useAppTable<T>`) adapts a DataCollection into a TanStack Table instance (manual pagination/sorting/filtering).
- **Feature tables** (`CompanyTable`, `DepartmentTable`) compose hooks, columns, mutations, toolbar, **manual** `<table>` markup, and pagination — no generic `DataTable<T>` used directly from screens.
- **Screens** provide layout and routing outlets only; no TanStack Table logic in screens.

Canonical mantra: *DataCollection holds data state; AppTable binds TanStack Table; feature tables own the table UI.*

## Tech stack

- React 18+, TypeScript, Vite  
- `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-form`  
- `react-router-dom` (data APIs / nested routes)  
- Tailwind CSS  
- Express mock server optional (`npm run dev` runs client + server per `package.json`)

Shadcn is **optional** per requirements and is **not** required for core behavior.

## Architectural decision: form UX (Requirement.txt vs this repo)

**Requirement.txt (supplement)** recommends **Zustand** per feature (`company.store.ts`, `department.store.ts`) and form hosts driven by that store.

**This codebase** uses **URL-synchronized list state** (`useSearchParams` + `urlState`) and **nested routes** with `<Outlet />` for create/edit/view in **dialog** or **fullscreen** (`routes.tsx`, `*FormRoute` components). That preserves page size, page index, sort, filters, and keyword when navigating to/from forms (`withSearch`), without unmounting the list.

We treat this as an **intentional equivalent** to “overlay + preserve list state”: shareable URLs, less global client state. **Zustand is not installed.** If product later mandates literal parity with the Zustand spec, add stores and migrate navigation actions from routes to store-driven overlays as a dedicated phase.

## Repository layout (high level)

- `src/shared/datacollection/` — `useDataCollection`, URL list state helpers  
- `src/shared/table/` — `useAppTable`, `TablePagination`, `table.types.ts`  
- `src/features/company/` | `department/` — APIs, types, tables under `list/`, forms, form routes, cache key helpers  

## Related documents

- `.planning/REQUIREMENTS.md` — traceability to `Requirement.txt`  
- `.planning/ROADMAP.md` — phased follow-up  
- `.planning/research/REQUIREMENT-INGEST.md` — short snapshot for research folder  
