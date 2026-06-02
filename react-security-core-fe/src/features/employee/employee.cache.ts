import type { QueryClient } from '@tanstack/react-query';
import { parseListUrlState, type UrlStateDefaults } from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { Employee } from '@/model/employee.types';

const LIST_PREFIX = ['employees', 'list'] as const;
const BY_ID_PREFIX = ['employees', 'byId'] as const;

const DEFAULTS: UrlStateDefaults = { defaultPageSize: 10, defaultSorting: [] };

export function getEmployeeListKey(searchParams: URLSearchParams): readonly unknown[] {
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

export function getEmployeeByIdKey(id: string | number): readonly unknown[] {
  return [...BY_ID_PREFIX, String(id)];
}

export function appendEmployeeToList(qc: QueryClient, searchParams: URLSearchParams, item: Employee): void {
  qc.setQueryData<PageResponse<Employee>>(
    getEmployeeListKey(searchParams),
    (old) => (old ? { items: [...old.items, item], total: old.total + 1 } : old),
  );
}

export function replaceEmployeeInList(qc: QueryClient, searchParams: URLSearchParams, item: Employee): void {
  qc.setQueryData<PageResponse<Employee>>(
    getEmployeeListKey(searchParams),
    (old) => {
      if (!old) return old;
      return { items: old.items.map((it) => (it.id === item.id ? item : it)), total: old.total };
    },
  );
  qc.setQueryData<Employee>(getEmployeeByIdKey(item.id), item);
}

export const EMPLOYEE_LIST_PREFIX = LIST_PREFIX;
export const EMPLOYEE_BY_ID_PREFIX = BY_ID_PREFIX;
