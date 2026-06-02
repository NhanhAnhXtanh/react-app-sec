import type { QueryClient } from '@tanstack/react-query';
import {
  parseListUrlState,
  type UrlStateDefaults,
} from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { MetaSource } from '@/model/metasource.types';

const LIST_PREFIX = ['meta-sources', 'list'] as const;
const BY_ID_PREFIX = ['meta-sources', 'byId'] as const;

const DEFAULTS: UrlStateDefaults = {
  defaultPageSize: 10,
  defaultSorting: [],
};

export function getMetaSourceListKey(
  searchParams: URLSearchParams,
): readonly unknown[] {
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

export function getMetaSourceByIdKey(id: string): readonly unknown[] {
  return [...BY_ID_PREFIX, id];
}

export function appendMetaSourceToList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: MetaSource,
): void {
  qc.setQueryData<PageResponse<MetaSource>>(
    getMetaSourceListKey(searchParams),
    (old) =>
      old ? { items: [...old.items, item], total: old.total + 1 } : old,
  );
}

export function replaceMetaSourceInList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: MetaSource,
): void {
  qc.setQueryData<PageResponse<MetaSource>>(
    getMetaSourceListKey(searchParams),
    (old) => {
      if (!old) return old;
      return {
        items: old.items.map((it) => (it.id === item.id ? item : it)),
        total: old.total,
      };
    },
  );
  qc.setQueryData<MetaSource>(getMetaSourceByIdKey(item.id), item);
}

export const META_SOURCE_LIST_PREFIX = LIST_PREFIX;
export const META_SOURCE_BY_ID_PREFIX = BY_ID_PREFIX;
