import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/api/rest';
import type {
  SecRole, SecPermission, SecMenuDefinition,
  SecMenuPermissionAdmin, SyncResult, SyncNode, SecCatalogEntry,
  MenuPermissionResponse,
} from '@/model/security.types';

const ROLES_BASE = '/api/admin/sec/roles';
const PERMISSIONS_BASE = '/api/admin/sec/permissions';
const MENU_DEFS_BASE = '/api/admin/sec/menu-definitions';
const MENU_PERMS_BASE = '/api/admin/sec/menu-permissions';
const MENU_PERMS_CURRENT_BASE = '/api/security/menu-permissions';

export const secRoleApi = {
  list(): Promise<SecRole[]> {
    return apiGet<SecRole[]>(ROLES_BASE);
  },
  getByName(name: string): Promise<SecRole> {
    return apiGet<SecRole>(`${ROLES_BASE}/${encodeURIComponent(name)}`);
  },
  create(role: SecRole): Promise<SecRole> {
    return apiPost<SecRole>(ROLES_BASE, role);
  },
  update(role: SecRole): Promise<SecRole> {
    return apiPut<SecRole>(`${ROLES_BASE}/${encodeURIComponent(role.name)}`, role);
  },
  delete(name: string): Promise<void> {
    return apiDelete(`${ROLES_BASE}/${encodeURIComponent(name)}`);
  },
};

export const secPermissionApi = {
  listByRole(authorityName: string): Promise<SecPermission[]> {
    return apiGet<SecPermission[]>(
      `${PERMISSIONS_BASE}?authorityName=${encodeURIComponent(authorityName)}`,
    );
  },
  create(permission: SecPermission): Promise<SecPermission> {
    return apiPost<SecPermission>(PERMISSIONS_BASE, permission);
  },
  delete(id: number): Promise<void> {
    return apiDelete(`${PERMISSIONS_BASE}/${id}`);
  },
};

export const secMenuDefinitionApi = {
  list(appName = 'security-core'): Promise<SecMenuDefinition[]> {
    return apiGet<SecMenuDefinition[]>(`${MENU_DEFS_BASE}?appName=${encodeURIComponent(appName)}`);
  },
  listAll(): Promise<SecMenuDefinition[]> {
    return apiGet<SecMenuDefinition[]>(MENU_DEFS_BASE);
  },
  getById(id: number): Promise<SecMenuDefinition> {
    return apiGet<SecMenuDefinition>(`${MENU_DEFS_BASE}/${id}`);
  },
  create(def: SecMenuDefinition): Promise<SecMenuDefinition> {
    return apiPost<SecMenuDefinition>(MENU_DEFS_BASE, def);
  },
  update(id: number, def: SecMenuDefinition): Promise<SecMenuDefinition> {
    return apiPut<SecMenuDefinition>(`${MENU_DEFS_BASE}/${id}`, def);
  },
  delete(id: number): Promise<void> {
    return apiDelete(`${MENU_DEFS_BASE}/${id}`);
  },
  sync(nodes: SyncNode[]): Promise<SyncResult> {
    return apiPost<SyncResult>(`${MENU_DEFS_BASE}/sync`, nodes);
  },
};

export const secMenuPermissionApi = {
  listByRole(role: string, appName?: string): Promise<SecMenuPermissionAdmin[]> {
    const params = new URLSearchParams({ role });
    if (appName) params.set('appName', appName);
    return apiGet<SecMenuPermissionAdmin[]>(`${MENU_PERMS_BASE}?${params}`);
  },
  create(perm: SecMenuPermissionAdmin): Promise<SecMenuPermissionAdmin> {
    return apiPost<SecMenuPermissionAdmin>(MENU_PERMS_BASE, perm);
  },
  delete(id: number): Promise<void> {
    return apiDelete(`${MENU_PERMS_BASE}/${id}`);
  },
};

export const secCatalogApi = {
  list(): Promise<SecCatalogEntry[]> {
    return apiGet<SecCatalogEntry[]>('/api/admin/sec/catalog');
  },
};

export const currentUserMenuPermissionApi = {
  getAllowed(appName = 'security-core'): Promise<MenuPermissionResponse> {
    return apiGet<MenuPermissionResponse>(
      `${MENU_PERMS_CURRENT_BASE}?appName=${encodeURIComponent(appName)}`,
    );
  },
};
