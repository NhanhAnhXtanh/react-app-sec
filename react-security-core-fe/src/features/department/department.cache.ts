import type { QueryClient } from '@tanstack/react-query';
import {
  parseListUrlState,
  type UrlStateDefaults,
} from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { Department } from '@/model/department.types';

const LIST_PREFIX = ['departments', 'list'] as const;
const BY_ID_PREFIX = ['departments', 'byId'] as const;

const DEFAULTS: UrlStateDefaults = {
  defaultPageSize: 10,
  defaultSorting: [],
};

export function readOrganizationIdFilter(
  searchParams: URLSearchParams,
): string | undefined {
  const v = searchParams.get('organizationId');
  return v ? v : undefined;
}

/** Build the same fullKey useDataCollection registers for the list query. */
export function getDepartmentListKey(
  searchParams: URLSearchParams,
): readonly unknown[] {
  const organizationId = readOrganizationIdFilter(searchParams);
  const url = parseListUrlState(searchParams, DEFAULTS);
  const params: PageRequest = {
    pageIndex: url.pageIndex,
    pageSize: url.pageSize,
    sorting: url.sorting.map((s) => ({ id: s.id, desc: s.desc })),
    filters: [
      ...url.filters.map((f) => ({ id: f.id, value: f.value })),
      ...(organizationId ? [{ id: 'organizationId', value: organizationId }] : []),
    ],
    keyword: url.keyword || undefined,
  };
  return [...LIST_PREFIX, organizationId ?? 'all', params];
}

export function getDepartmentByIdKey(id: number | string): readonly unknown[] {
  return [...BY_ID_PREFIX, String(id)];
}

export function appendDepartmentToList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Department,
): void {
  qc.setQueryData<PageResponse<Department>>(
    getDepartmentListKey(searchParams),
    (old) =>
      old ? { items: [...old.items, item], total: old.total + 1 } : old,
  );
}

export function replaceDepartmentInList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Department,
): void {
  qc.setQueryData<PageResponse<Department>>(
    getDepartmentListKey(searchParams),
    (old) => {
      if (!old) return old;
      return {
        items: old.items.map((it) => (it.id === item.id ? item : it)),
        total: old.total,
      };
    },
  );
  qc.setQueryData<Department>(getDepartmentByIdKey(item.id), item);
}

export function removeDepartmentFromList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  id: number | string,
): void {
  qc.setQueryData<PageResponse<Department>>(
    getDepartmentListKey(searchParams),
    (old) => {
      if (!old) return old;
      return {
        items: old.items.filter((it) => String(it.id) !== String(id)),
        total: Math.max(0, old.total - 1),
      };
    },
  );
}

export const DEPARTMENT_LIST_PREFIX = LIST_PREFIX;
export const DEPARTMENT_BY_ID_PREFIX = BY_ID_PREFIX;
