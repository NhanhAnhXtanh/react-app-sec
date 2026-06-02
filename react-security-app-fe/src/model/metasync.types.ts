export type FieldItem = {
  id: string;
  code: string;
  name: string;
  dataType: string;
  path: string;
  path_parent: string | null;
  description: string | null;
  isNull: boolean;
  isPrimaryKey: boolean;
  comment: string | null;
};

export type SyncResult = {
  created: number;
  skipped: number;
  items: MetaSync[];
  syncMode?: 'ONLINE' | 'OFFLINE' | string | null;
  message?: string | null;
};

export type MetaSync = {
  id: string;
  code: string;
  status?: string | null;
  dataSourceId?: string | null;
  dataSourceCode?: string | null;
  metaCode?: string | null;
  metaName?: string | null;
  fieldData: string;
  fieldHash: string;
  deleted?: boolean | null;
  isActive?: boolean | null;
  versionNo: number;
  changedStatus: string;
  changedSummary: string;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
};
