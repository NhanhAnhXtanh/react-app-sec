import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';

export type ListUrlState = {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  filters: ColumnFiltersState;
  keyword: string;
};

export type UrlStateDefaults = {
  defaultPageSize: number;
  defaultSorting: SortingState;
};

export const URL_KEYS = ['page', 'size', 'sort', 'filter', 'kw'] as const;

export function parseListUrlState(
  sp: URLSearchParams,
  defaults: UrlStateDefaults,
): ListUrlState {
  const pageIndex = Math.max(0, Number(sp.get('page') ?? '0') || 0);
  const sizeRaw = sp.get('size');
  const pageSize =
    sizeRaw == null
      ? defaults.defaultPageSize
      : Math.max(1, Number(sizeRaw) || defaults.defaultPageSize);

  const sortRaw = sp.getAll('sort');
  const sorting: SortingState =
    sortRaw.length > 0
      ? sortRaw
          .map((s) => {
            const [id, dir = 'asc'] = s.split(':');
            return id ? { id, desc: dir === 'desc' } : null;
          })
          .filter((s): s is { id: string; desc: boolean } => s !== null)
      : defaults.defaultSorting;

  const filters: ColumnFiltersState = sp
    .getAll('filter')
    .map((f) => {
      const i = f.indexOf(':');
      if (i < 0) return null;
      return { id: f.slice(0, i), value: f.slice(i + 1) };
    })
    .filter((f): f is { id: string; value: string } => f !== null);

  const keyword = sp.get('kw') ?? '';

  return { pageIndex, pageSize, sorting, filters, keyword };
}

export function writeListUrlState(
  sp: URLSearchParams,
  state: ListUrlState,
  defaults: UrlStateDefaults,
): URLSearchParams {
  const next = new URLSearchParams(sp);

  for (const key of URL_KEYS) next.delete(key);

  if (state.pageIndex !== 0) next.set('page', String(state.pageIndex));
  if (state.pageSize !== defaults.defaultPageSize) {
    next.set('size', String(state.pageSize));
  }
  for (const s of state.sorting) {
    next.append('sort', `${s.id}:${s.desc ? 'desc' : 'asc'}`);
  }
  for (const f of state.filters) {
    if (f.value === '' || f.value === null || f.value === undefined) continue;
    next.append('filter', `${f.id}:${String(f.value)}`);
  }
  if (state.keyword) next.set('kw', state.keyword);

  return next;
}

/** Apply React-style updater (value or fn) — same shape useState uses. */
export function applyUpdater<T>(prev: T, updater: T | ((old: T) => T)): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(prev)
    : updater;
}
