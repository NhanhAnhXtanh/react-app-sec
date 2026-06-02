import type { PageRequest, PageResponse } from '@/shared/table/table.types';
import { springSearch } from '@/shared/api/spring';
import { httpGet } from '@/shared/api/http';
import { apiGet } from '@/shared/api/rest';
import { getAuthToken } from '@/store/auth.store';
import type { AdminUser } from '@/model/user.types';
import { authApi } from './auth.api';

const BASE = '/api/admin/users';

/** PUT/DELETE on the role endpoints return 204 with no body — plain fetch, no JSON parse. */
async function sendNoBody(url: string, method: 'PUT' | 'DELETE'): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok && res.status !== 204) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = (await res.json()) as { message?: string; error?: string };
      msg = b.message ?? b.error ?? msg;
    } catch {
      /* empty */
    }
    throw new Error(msg);
  }
}

function rolesUrl(login: string, authority?: string): string {
  const base = `${BASE}/${encodeURIComponent(login)}/roles`;
  return authority ? `${base}/${encodeURIComponent(authority)}` : base;
}

/** Reconcile a user's roles to exactly `desired`, assigning/revoking only the differences. */
async function setRoles(login: string, desired: string[]): Promise<void> {
  const current = await httpGet<string[]>(rolesUrl(login));
  const toAdd = desired.filter((r) => !current.includes(r));
  const toRemove = current.filter((r) => !desired.includes(r));
  for (const r of toAdd) await sendNoBody(rolesUrl(login, r), 'PUT');
  for (const r of toRemove) await sendNoBody(rolesUrl(login, r), 'DELETE');
}

/**
 * User administration mapped onto the consumer BE (username-only model).
 *  - list/detail: GET /api/admin/users[, /{login}]
 *  - roles:       PUT/DELETE /api/admin/users/{login}/roles/{authority}
 *  - role catalog: GET /api/admin/sec/roles (starter)
 *
 * The current BE does not expose admin profile-update or user-delete, so:
 *  - create = self-register the account then reconcile its roles;
 *  - update = reconcile roles only (profile fields are not persisted server-side);
 *  - delete = unsupported (surfaced as a clear error).
 */
export const userManagementApi = {
  search(params: PageRequest): Promise<PageResponse<AdminUser>> {
    return springSearch<AdminUser>(BASE, params);
  },

  getByLogin(login: string): Promise<AdminUser> {
    return httpGet<AdminUser>(`${BASE}/${encodeURIComponent(login)}`);
  },

  async create(body: Partial<AdminUser>): Promise<AdminUser> {
    const login = (body.login ?? '').toLowerCase();
    await authApi.register({
      username: login,
      email: body.email ?? '',
      password: body.password ?? 'changeit',
      firstName: body.firstName ?? undefined,
      lastName: body.lastName ?? undefined,
    });
    await setRoles(login, body.authorities ?? []);
    return this.getByLogin(login);
  },

  async update(body: Partial<AdminUser>): Promise<AdminUser> {
    const login = (body.login ?? '').toLowerCase();
    await setRoles(login, body.authorities ?? []);
    return this.getByLogin(login);
  },

  delete(_login: string): Promise<void> {
    return Promise.reject(
      new Error('Xóa user chưa được hỗ trợ bởi backend hiện tại (chỉ gán/thu hồi role).'),
    );
  },

  getAuthorities(): Promise<string[]> {
    return apiGet<{ name: string }[]>('/api/admin/sec/roles').then((list) =>
      list.map((a) => a.name),
    );
  },
};
