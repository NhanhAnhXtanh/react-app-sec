import type { QueryClient } from '@tanstack/react-query';
import { parseListUrlState, type UrlStateDefaults } from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { Organization } from '@/model/organization.types';

const LIST_PREFIX = ['organizations', 'list'] as const;
const BY_ID_PREFIX = ['organizations', 'byId'] as const;

const DEFAULTS: UrlStateDefaults = { defaultPageSize: 10, defaultSorting: [] };

export function getOrganizationListKey(searchParams: URLSearchParams): readonly unknown[] {
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

export function getOrganizationByIdKey(id: string | number): readonly unknown[] {
  return [...BY_ID_PREFIX, String(id)];
}

export function appendOrganizationToList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Organization,
): void {
  qc.setQueryData<PageResponse<Organization>>(
    getOrganizationListKey(searchParams),
    (old) => (old ? { items: [...old.items, item], total: old.total + 1 } : old),
  );
}

export function replaceOrganizationInList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Organization,
): void {
  qc.setQueryData<PageResponse<Organization>>(
    getOrganizationListKey(searchParams),
    (old) => {
      if (!old) return old;
      return {
        items: old.items.map((it) => (it.id === item.id ? item : it)),
        total: old.total,
      };
    },
  );
  qc.setQueryData<Organization>(getOrganizationByIdKey(item.id), item);
}

export const ORGANIZATION_LIST_PREFIX = LIST_PREFIX;
export const ORGANIZATION_BY_ID_PREFIX = BY_ID_PREFIX;
