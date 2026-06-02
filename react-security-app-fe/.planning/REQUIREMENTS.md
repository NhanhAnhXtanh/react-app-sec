# Requirements (ingested from Requirement.txt)

Source: repository root `Requirement.txt`. Status legend: **Met** | **Partial** | **Spec differs (intentional)** | **Not done**

## A. Table framework (Jmix-inspired)

| ID | Requirement | Status | Notes |
|----|-------------|--------|--------|
| A1 | `useDataCollection<T>`: React Query, pagination, sorting, column/global filters, row selection, `selectedIds` / `selectedItems`, `tableMode`, `params`; **no** `useReactTable` inside | **Met** | `src/shared/datacollection/useDataCollection.ts` |
| A2 | `useAppTable<T>`: bind DC + `ColumnDef`, manual pagination/sort/filter, return table instance | **Met** | `src/shared/table/useAppTable.ts` |
| A3 | `CompanyTable` / `DepartmentTable`: call both hooks, columns, mutations, toolbar, **manual** `<table>`, `TablePagination` | **Met** | Under `src/features/*/list/` + shared pagination |
| A4 | Screens orchestrate only; **no** generic `DataTable<T>` at screen | **Met** | `CompanyScreen`, `DepartmentScreen` |
| A5 | Types: `PageRequest`, `PageResponse<T>`, `TableModeOptions`; `Company`, `Department` | **Met** | `src/shared/table/table.types.ts`, feature `*.types.ts` |
| A6 | APIs: `search`, `create`, `update`, `delete`; mock OK | **Met** | `company.api.ts`, `department.api.ts` |
| A7 | `useDataCollection` return shape + `useQuery` with `placeholderData`, default manual modes | **Met** | Extended with `fullKey`, URL sync |
| A8 | `TablePagination` with Prev/Next, current page, page size, total | **Met** | `src/shared/table/TablePagination.tsx` |
| A9 | Company module: columns (select, code, name, taxCode, status, actions), toolbar props as spec | **Met** | Column actions extended (view, edit dialog/fullscreen, delete) |
| A10 | Department module: `companyId` filter via `columnFilters`, queryKey includes company scope | **Met** | `DepartmentTable` + `companyId` prop |
| A11 | Manual table render: `flexRender`, sorting handlers, visible cells, selection | **Met** | Feature tables |

## B. Forms, cache UX, Zustand (supplement)

| ID | Requirement | Status | Notes |
|----|-------------|--------|--------|
| B1 | Form modes `create` \| `edit` \| `view`; presentation `dialog` \| `fullscreen` | **Met** | Via nested routes + `CompanyFormRoute` / `DepartmentFormRoute` |
| B2 | TanStack Form for entity forms; validation (code, name, companyId for department) | **Met** | Feature form components |
| B3 | After create/update/delete: **no** immediate refetch; use `appendItem` / `replaceItem` / `removeItem` | **Met** | Mutations use DC cache helpers |
| B4 | Closing form preserves list: page, filters, sort, keyword | **Met** | List state in URL (`urlState` + `withSearch`) |
| B5 | Zustand **per-feature** stores for `EntityFormState` and open/close | **Spec differs (intentional)** | Replaced by **React Router nested routes** + `<Outlet />`; forms preserve search query. Zustand not in `package.json`. |
| B6 | `CompanyFormHost` / `DepartmentFormHost` as overlay; table not unmounted | **Partial** | Equivalent: list stays mounted; forms render in outlet overlay (`CompanyFormRoute` pattern) |
| B7 | File layout exactly as spec (`company.store.ts` at feature root, tables not under `list/`) | **Spec differs (intentional)** | Logical parity; physical folders differ (`list/`, `CompanyFormRoute`, `company.cache.ts`) |

## C. Quality gates

| ID | Requirement | Status | Notes |
|----|-------------|--------|--------|
| C1 | TypeScript strict-friendly; avoid careless `any` | **Met** | Ongoing in new code |
| C2 | Single `useReactTable` path via `useAppTable` in feature tables | **Met** | |
| C3 | `getRowId` uses business id | **Met** | |
| C4 | Mutations update cache via DC helpers; avoid blanket invalidate after local UX mutations | **Met** | |
| C5 | Shadcn optional | **Not done** | Tailwind only today |

## D. Mock API

Search must support at minimum: keyword, pagination, simple sorting, `companyId` filter for departments — **Met** in mock implementations (verify when changing APIs).

---
*Last ingested: project initialization from Requirement.txt for GSD context.*
