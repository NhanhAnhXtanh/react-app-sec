# Research snapshot: Requirement.txt

**Date:** 2026-05-02  
**Source:** `Requirement.txt` (repository root)

## Two-part spec

1. **Table layer:** `useDataCollection` + `useAppTable` + feature tables with manual `<table>`; no `DataTable<T>` on screens; mock `search`/`create`/`update`/`delete`.
2. **Form + cache layer:** TanStack Form; dialog/fullscreen; preserve list state on close; local cache updates via `appendItem` / `replaceItem` / `removeItem` without immediate refetch; original text suggests **Zustand** per feature.

## Implementation comparison (condensed)

| Area | Spec | Repo |
|------|------|------|
| DataCollection + cache helpers | Yes | Implemented + URL-backed list state |
| AppTable | Yes | Implemented |
| Feature tables | Yes | `list/CompanyTable`, `list/DepartmentTable` |
| Form shell | Zustand + host | **Nested routes + Outlet**, `withSearch` for list preservation |
| Shadcn | Optional | Not added |

## Conclusion

The codebase implements the **behavioral** goals of the supplement (overlay-style navigation, cache mutation, no refetch on success) using **routing + URL** instead of Zustand. See `PROJECT.md` for the decision record.
