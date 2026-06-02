export type SecRole = {
  name: string;
  displayName?: string;
  type: string;
};

export type SecPermission = {
  id?: number;
  authorityName: string;
  targetType: string;
  target: string;
  action: string;
  effect: string;
};

export type SecMenuDefinition = {
  id?: number;
  menuId: string;
  appName: string;
  menuName: string;
  label: string;
  description?: string;
  parentMenuId?: string;
  route?: string;
  icon?: string;
  ordering: number;
};

export type SecMenuPermissionAdmin = {
  id?: number;
  role: string;
  appName: string;
  menuId: string;
  effect: string;
};

export type SyncResult = {
  seeded: number;
  skipped: number;
};

export type SecCatalogEntry = {
  code: string;
  displayName: string;
  operations: string[];
  attributes: string[];
};

export type SyncNode = {
  menuId: string;
  appName: string;
  menuName: string;
  label: string;
  parentMenuId?: string;
  route?: string;
  icon?: string;
  ordering: number;
};

export type MenuPermissionResponse = {
  appName: string;
  allowedMenuIds: string[];
};
