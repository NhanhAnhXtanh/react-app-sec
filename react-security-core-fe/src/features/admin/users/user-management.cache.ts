import type { QueryClient } from '@tanstack/react-query';
import { parseListUrlState, type UrlStateDefaults } from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { AdminUser } from '@/model/user.types';

const LIST_PREFIX = ['admin', 'users', 'list'] as const;
const BY_LOGIN_PREFIX = ['admin', 'users', 'byLogin'] as const;

const DEFAULTS: UrlStateDefaults = { defaultPageSize: 10, defaultSorting: [] };

export function getUserListKey(searchParams: URLSearchParams): readonly unknown[] {
  const url = parseListUrlState(searchParams, DEFAULTS);
  const params: PageRequest = {
    pageIndex: url.pageIndex,
    pageSize: url.pageSize,
    sorting: url.sorting.map((s) => ({ id: s.id, desc: s.desc })),
    filters: url.filters.map((f) => ({ id: f.id, value: f.value })),
    keyword: url.keyword || undefined,
  };
  return [...LIST_PREFIX, params];
}

export function getUserByLoginKey(login: string): readonly unknown[] {
  return [...BY_LOGIN_PREFIX, login];
}

export function replaceUserInList(qc: QueryClient, searchParams: URLSearchParams, item: AdminUser): void {
  qc.setQueryData<PageResponse<AdminUser>>(
    getUserListKey(searchParams),
    (old) => {
      if (!old) return old;
      return { items: old.items.map((it) => (it.login === item.login ? item : it)), total: old.total };
    },
  );
  if (item.login) qc.setQueryData<AdminUser>(getUserByLoginKey(item.login), item);
}

export const USER_LIST_PREFIX = LIST_PREFIX;
