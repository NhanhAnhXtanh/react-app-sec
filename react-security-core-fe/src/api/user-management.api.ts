import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { apiSearch, apiGet, apiPost, apiPut, apiDelete } from '@/shared/api/rest';
import type { AdminUser } from '@/model/user.types';

const BASE = '/api/admin/users';

export const userManagementApi = {
  search(params: PageRequest): Promise<PageResponse<AdminUser>> {
    return apiSearch<AdminUser>(BASE, params);
  },

  getByLogin(login: string): Promise<AdminUser> {
    return apiGet<AdminUser>(`${BASE}/${encodeURIComponent(login)}`);
  },

  create(body: Partial<AdminUser>): Promise<AdminUser> {
    return apiPost<AdminUser>(BASE, body);
  },

  update(body: Partial<AdminUser>): Promise<AdminUser> {
    return apiPut<AdminUser>(BASE, body);
  },

  delete(login: string): Promise<void> {
    return apiDelete(`${BASE}/${encodeURIComponent(login)}`);
  },

  getAuthorities(): Promise<string[]> {
    return apiGet<{ name: string }[]>('/api/authorities').then((list) => list.map((a) => a.name));
  },
};
