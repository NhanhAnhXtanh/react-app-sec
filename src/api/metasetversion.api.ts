import { httpDelete, httpGet, httpJson } from '@/shared/api/http';
import type { MetaSetVersion } from '@/model/metasetversion.types';

const BASE = '/api/meta-set-versions';

export const metaSetVersionApi = {
  listByMetaCode(metaCode: string): Promise<MetaSetVersion[]> {
    return httpGet<MetaSetVersion[]>(
      `${BASE}?metaCode=${encodeURIComponent(metaCode)}`,
    );
  },

  getById(id: string): Promise<MetaSetVersion> {
    return httpGet<MetaSetVersion>(`${BASE}/${encodeURIComponent(id)}`);
  },

  create(body: Partial<MetaSetVersion>): Promise<MetaSetVersion> {
    return httpJson<MetaSetVersion>(BASE, 'POST', body);
  },

  delete(id: string): Promise<void> {
    return httpDelete(`${BASE}/${encodeURIComponent(id)}`);
  },
};
