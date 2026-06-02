export type MetaSetStatus = 'DRAFT' | 'PUBLISHED' | 'DISCONTINUED' | string;

export type MetaSetApiAuthType = 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY';
export type MetaSetApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type MetaSetApiOperationType = 'LIST' | 'DETAIL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'CUSTOM';
export type MetaSetApiResponseMode = 'LIST' | 'DETAIL' | 'VOID' | 'CUSTOM';

export type MetaSetApiHeader = {
  key: string;
  value: string;
};

export type MetaSetApiAuth = {
  authType: MetaSetApiAuthType;
  username?: string | null;
  password?: string | null;
  bearerToken?: string | null;
  apiKeyName?: string | null;
  apiKeyValue?: string | null;
  apiKeyPlacement?: 'HEADER' | 'QUERY' | null;
};

export type MetaSetApiOperation = {
  code?: string | null;
  name?: string | null;
  operationType: MetaSetApiOperationType;
  method: MetaSetApiMethod;
  endpoint: string;
  responseMode: MetaSetApiResponseMode;
  description?: string | null;
  enabled?: boolean | null;
};

export type MetaSetApiSetting = {
  auth: MetaSetApiAuth;
  headers: MetaSetApiHeader[];
  timeoutMs: number;
};

export type MetaSetEndpointConfig = {
  basePath?: string | null;
  primaryOperationCode?: string | null;
  primaryOperationType?: MetaSetApiOperationType | string | null;
};

export type MetaSet = {
  id: string;
  code: string;
  metaCode?: string | null;
  name: string;
  description?: string | null;
  metaSourceId: string;
  metaSourceCode?: string | null;
  metaSourceName?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  domainId?: string | null;
  domainName?: string | null;
  classification?: string | null;
  tier?: string | null;
  status: MetaSetStatus;
  publishedAt?: string | null;
  publishedBy?: string | null;
  publishedComment?: string | null;
  discontinuedAt?: string | null;
  discontinuedBy?: string | null;
  discontinuedComment?: string | null;
  lastSyncedAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncedVersion?: number | null;
  exampleData?: string | null;
  endpointPath?: string | null;
  endpointConfig?: MetaSetEndpointConfig | null;
  apiSetting?: MetaSetApiSetting | null;
  operations?: MetaSetApiOperation[] | null;
  currentVersionId?: string | null;
  currentVersionNo?: number | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
  tags?: { id: string; name: string }[] | null;
};
