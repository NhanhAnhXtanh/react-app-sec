import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { httpGet } from './http';

/**
 * Spring Data's Page<T> shape — what /api/* paged endpoints return. Translated into the
 * template's PageResponse<T> at the api boundary so feature code stays unchanged.
 */
export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

/** Build query string for Spring Pageable: `page`, `size`, `sort=field,dir`, plus `keyword`. */
export function buildSpringSearchParams(params: PageRequest): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('page', String(params.pageIndex));
  sp.set('size', String(params.pageSize));

  if (params.keyword) {
    sp.set('keyword', params.keyword);
  }

  for (const s of params.sorting ?? []) {
    sp.append('sort', `${s.id},${s.desc ? 'desc' : 'asc'}`);
  }

  for (const f of params.filters ?? []) {
    if (f.value !== undefined && f.value !== null && f.value !== '') {
      sp.append(f.id, String(f.value));
    }
  }

  return sp;
}

export function fromSpringPage<T>(page: SpringPage<T>): PageResponse<T> {
  return { items: page.content, total: page.totalElements };
}

export async function springSearch<T>(
  baseUrl: string,
  params: PageRequest,
): Promise<PageResponse<T>> {
  const page = await httpGet<SpringPage<T>>(
    `${baseUrl}?${buildSpringSearchParams(params)}`,
  );
  return fromSpringPage(page);
}
