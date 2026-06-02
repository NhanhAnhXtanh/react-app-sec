import { httpGet, httpJson } from '@/shared/api/http';
import type { Schema, QueryResult } from '@/features/metadata/sourcecontrol/dbcontrol/types';
import type { MetaSync, SyncResult } from '@/model/metasync.types';

const BASE = '/api/meta-sources';

// ─── API Config DTOs (mirrors backend com.react.spring.dto.meta.connect) ───

export type ApiAuthType = 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY';
export type ApiKeyPlacement = 'HEADER' | 'QUERY';
export type ApiBodyType = 'NONE' | 'JSON' | 'FORM_DATA' | 'URL_ENCODED' | 'RAW';

export type ApiHeaderDTO = {
  id?: string;
  key: string;
  value: string;
  required?: boolean;
  canEdit?: boolean;
  description?: string;
};

export type ApiQueryParamDTO = {
  id?: string;
  key: string;
  value: string;
  required?: boolean;
  canEdit?: boolean;
  description?: string;
};

export type ApiAuthConfigDTO = {
  id?: string;
  authType: ApiAuthType;
  username?: string;
  password?: string;
  bearerToken?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyPlacement?: ApiKeyPlacement;
};

export type ApiFormDataFieldDTO = {
  id?: string;
  key: string;
  value: string;
  type?: string;
  description?: string;
};

export type ApiUrlEncodedFieldDTO = {
  id?: string;
  key: string;
  value: string;
  description?: string;
};

export type ApiBodyConfigDTO = {
  id?: string;
  bodyType: ApiBodyType;
  rawContent?: string;
  formDataFields?: ApiFormDataFieldDTO[];
  urlEncodedFields?: ApiUrlEncodedFieldDTO[];
};

export type ApiConfigDTO = {
  id?: string;
  method: string;
  endpointPath: string;
  headers?: ApiHeaderDTO[];
  auth?: ApiAuthConfigDTO;
  body?: ApiBodyConfigDTO;
  queryParams?: ApiQueryParamDTO[];
};

export type RestProxyRequest = {
  config: ApiConfigDTO;
};

export type RestProxyHeader = {
  key: string;
  value: string;
};

export type RestProxyResult = {
  status: number;
  headers: RestProxyHeader[];
  body: string;
  durationMs: number;
};

export const metaSourceConnectApi = {
  fetchSchema(id: string): Promise<Schema> {
    return httpGet<Schema>(`${BASE}/${encodeURIComponent(id)}/schema`);
  },

  syncSource(id: string): Promise<SyncResult> {
    return httpJson<SyncResult>(`${BASE}/${encodeURIComponent(id)}/sync`, 'POST', undefined);
  },

  listMetaSyncs(id: string): Promise<MetaSync[]> {
    return httpGet<MetaSync[]>(`${BASE}/${encodeURIComponent(id)}/meta-syncs`);
  },

  executeQuery(id: string, sql: string): Promise<QueryResult> {
    return httpJson<QueryResult>(
      `${BASE}/${encodeURIComponent(id)}/query`,
      'POST',
      { sql },
    );
  },

  restProxy(id: string, config: ApiConfigDTO): Promise<RestProxyResult> {
    return httpJson<RestProxyResult>(
      `${BASE}/${encodeURIComponent(id)}/rest-proxy`,
      'POST',
      { config },
    );
  },
};
