import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { httpDelete, httpGet, httpJson } from '@/shared/api/http';
import { springSearch } from '@/shared/api/spring';
import type { MetaSource } from '@/model/metasource.types';
import type { MetaSet } from '@/model/metaset.types';
import type { MetaSyncExtractPayload } from '@/api/metasync.api';

const BASE = '/api/meta-sources';

export const metaSourceApi = {
  search(params: PageRequest): Promise<PageResponse<MetaSource>> {
    return springSearch<MetaSource>(BASE, params);
  },

  listAll(): Promise<MetaSource[]> {
    return springSearch<MetaSource>(BASE, { pageIndex: 0, pageSize: 1000 }).then(
      (r) => r.items,
    );
  },

  getById(id: string): Promise<MetaSource> {
    return httpGet<MetaSource>(`${BASE}/${encodeURIComponent(id)}`);
  },

  getByCode(code: string): Promise<MetaSource> {
    return httpGet<MetaSource>(`${BASE}/by-code/${encodeURIComponent(code)}`);
  },

  create(body: Partial<MetaSource>): Promise<MetaSource> {
    return httpJson<MetaSource>(BASE, 'POST', body);
  },

  update(id: string, body: Partial<MetaSource>): Promise<MetaSource> {
    return httpJson<MetaSource>(`${BASE}/${encodeURIComponent(id)}`, 'PUT', body);
  },

  delete(id: string): Promise<void> {
    return httpDelete(`${BASE}/${encodeURIComponent(id)}`);
  },

  extractToMetaSet(id: string, body: MetaSyncExtractPayload): Promise<MetaSet[]> {
    return httpJson<MetaSet[]>(
      `${BASE}/${encodeURIComponent(id)}/extract-to-metaset`,
      'POST',
      body,
    );
  },
};
