import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { httpDelete, httpGet, httpJson } from '@/shared/api/http';
import { buildSpringSearchParams, fromSpringPage, type SpringPage } from '@/shared/api/spring';
import type { MetaSync } from '@/model/metasync.types';
import type { MetaSet } from '@/model/metaset.types';

export type MetaSyncExtractPayload = {
  targetMetaSetId?: string;
  name?: string;
  description?: string;
  organizationId?: string | null;
  domainId?: string | null;
  classification?: string;
  tier?: string;
};

const BASE = '/api/meta-syncs';

export type MetaSyncFilters = {
  dataSourceId?: string;
  organizationId?: string;
  domainId?: string;
};

export const metaSyncApi = {
  search(params: PageRequest, filters?: MetaSyncFilters): Promise<PageResponse<MetaSync>> {
    const sp = buildSpringSearchParams(params);
    if (filters?.dataSourceId) sp.set('dataSourceId', filters.dataSourceId);
    if (filters?.organizationId) sp.set('organizationId', filters.organizationId);
    if (filters?.domainId) sp.set('domainId', filters.domainId);
    if (params.keyword) sp.set('keyword', params.keyword);
    return httpGet<SpringPage<MetaSync>>(`${BASE}?${sp}`).then(fromSpringPage);
  },

  getById(id: string): Promise<MetaSync> {
    return httpGet<MetaSync>(`${BASE}/${encodeURIComponent(id)}`);
  },

  getByCode(code: string): Promise<MetaSync> {
    return httpGet<MetaSync>(`${BASE}/by-code/${encodeURIComponent(code)}`);
  },

  create(body: Partial<MetaSync>): Promise<MetaSync> {
    return httpJson<MetaSync>(BASE, 'POST', body);
  },

  update(id: string, body: Partial<MetaSync>): Promise<MetaSync> {
    return httpJson<MetaSync>(`${BASE}/${encodeURIComponent(id)}`, 'PUT', body);
  },

  extractToMetaSet(id: string, body: MetaSyncExtractPayload): Promise<MetaSet> {
    return httpJson<MetaSet>(
      `${BASE}/${encodeURIComponent(id)}/extract-to-metaset`,
      'POST',
      body,
    );
  },

  delete(id: string): Promise<void> {
    return httpDelete(`${BASE}/${encodeURIComponent(id)}`);
  },
};
