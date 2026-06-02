import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { httpDelete, httpGet, httpJson } from '@/shared/api/http';
import { springSearch } from '@/shared/api/spring';
import type { MetaSet } from '@/model/metaset.types';

const BASE = '/api/meta-sets';

export type MetaSetActionPayload = {
  actor?: string;
  comment?: string;
};

export const metaSetApi = {
  search(params: PageRequest): Promise<PageResponse<MetaSet>> {
    return springSearch<MetaSet>(BASE, params);
  },

  listAll(): Promise<MetaSet[]> {
    return springSearch<MetaSet>(BASE, { pageIndex: 0, pageSize: 1000 }).then(
      (r) => r.items,
    );
  },

  listBySource(metaSourceId: string): Promise<MetaSet[]> {
    return httpGet<MetaSet[]>(`${BASE}/by-source/${encodeURIComponent(metaSourceId)}`);
  },

  listByMetasyncCode(metasyncCode: string): Promise<MetaSet[]> {
    return httpGet<MetaSet[]>(
      `${BASE}/by-metasync-code/${encodeURIComponent(metasyncCode)}`,
    );
  },

  getById(id: string): Promise<MetaSet> {
    return httpGet<MetaSet>(`${BASE}/${encodeURIComponent(id)}`);
  },

  getByCode(code: string): Promise<MetaSet> {
    return httpGet<MetaSet>(`${BASE}/by-code/${encodeURIComponent(code)}`);
  },

  create(body: Partial<MetaSet>): Promise<MetaSet> {
    return httpJson<MetaSet>(BASE, 'POST', body);
  },

  update(id: string, body: Partial<MetaSet>): Promise<MetaSet> {
    return httpJson<MetaSet>(`${BASE}/${encodeURIComponent(id)}`, 'PUT', body);
  },

  publish(id: string, body: MetaSetActionPayload): Promise<MetaSet> {
    return httpJson<MetaSet>(
      `${BASE}/${encodeURIComponent(id)}/publish`,
      'POST',
      body,
    );
  },

  discontinue(id: string, body: MetaSetActionPayload): Promise<MetaSet> {
    return httpJson<MetaSet>(
      `${BASE}/${encodeURIComponent(id)}/discontinue`,
      'POST',
      body,
    );
  },

  delete(id: string): Promise<void> {
    return httpDelete(`${BASE}/${encodeURIComponent(id)}`);
  },
};
