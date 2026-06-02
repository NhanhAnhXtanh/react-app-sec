import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { apiSearch, apiGet, apiPost, apiPut, apiDelete } from '@/shared/api/rest';
import type { Organization } from '@/model/organization.types';

const BASE = '/api/organizations';

export const organizationApi = {
  search(params: PageRequest): Promise<PageResponse<Organization>> {
    return apiSearch<Organization>(BASE, params);
  },

  getById(id: string | number): Promise<Organization> {
    return apiGet<Organization>(`${BASE}/${id}`);
  },

  create(body: Partial<Organization>): Promise<Organization> {
    return apiPost<Organization>(BASE, body);
  },

  update(id: string | number, body: Partial<Organization>): Promise<Organization> {
    return apiPut<Organization>(`${BASE}/${id}`, { ...body, id });
  },

  delete(id: string | number): Promise<void> {
    return apiDelete(`${BASE}/${id}`);
  },
};
