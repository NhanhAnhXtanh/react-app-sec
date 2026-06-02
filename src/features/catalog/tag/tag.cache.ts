import type { QueryClient } from '@tanstack/react-query';
import {
  parseListUrlState,
  type UrlStateDefaults,
} from '@/shared/datacollection/urlState';
import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import type { Tag } from '@/model/catalog.types';

const LIST_PREFIX = ['tags', 'list'] as const;
const BY_ID_PREFIX = ['tags', 'byId'] as const;

const DEFAULTS: UrlStateDefaults = {
  defaultPageSize: 10,
  defaultSorting: [],
};

export function getTagListKey(
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

export function getTagByIdKey(id: string): readonly unknown[] {
  return [...BY_ID_PREFIX, id];
}

export function appendTagToList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Tag,
): void {
  qc.setQueryData<PageResponse<Tag>>(
    getTagListKey(searchParams),
    (old) =>
      old ? { items: [...old.items, item], total: old.total + 1 } : old,
  );
}

export function replaceTagInList(
  qc: QueryClient,
  searchParams: URLSearchParams,
  item: Tag,
): void {
  qc.setQueryData<PageResponse<Tag>>(
    getTagListKey(searchParams),
    (old) => {
      if (!old) return old;
      return {
        items: old.items.map((it) => (it.id === item.id ? item : it)),
        total: old.total,
      };
    },
  );
  qc.setQueryData<Tag>(getTagByIdKey(item.id), item);
}

export const TAG_LIST_PREFIX = LIST_PREFIX;
export const TAG_BY_ID_PREFIX = BY_ID_PREFIX;
