import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { apiSearch, apiGet, apiPost, apiPut, apiDelete } from '@/shared/api/rest';
import type { Department } from '@/model/department.types';

const BASE = '/api/departments';

export const departmentApi = {
  search(params: PageRequest): Promise<PageResponse<Department>> {
    return apiSearch<Department>(BASE, params);
  },

  getById(id: string): Promise<Department> {
    return apiGet<Department>(`${BASE}/${encodeURIComponent(id)}`);
  },

  create(body: Partial<Department>): Promise<Department> {
    return apiPost<Department>(BASE, body);
  },

  update(id: string, body: Partial<Department>): Promise<Department> {
    return apiPut<Department>(`${BASE}/${encodeURIComponent(id)}`, body);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`${BASE}/${encodeURIComponent(id)}`);
  },
};
