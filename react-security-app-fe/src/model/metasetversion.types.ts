import type {
  MetaSetApiOperation,
  MetaSetApiSetting,
  MetaSetEndpointConfig,
} from './metaset.types';

export type MetaSetVersion = {
  id: string;
  dataSourceCode?: string | null;
  metaCode: string;
  versionNo: number;
  metasyncCode?: string | null;
  fieldData?: string | null;
  fieldHash?: string | null;
  exampleData?: string | null;
  endpointPath?: string | null;
  endpointConfig?: MetaSetEndpointConfig | null;
  apiSetting?: MetaSetApiSetting | null;
  operations?: MetaSetApiOperation[] | null;
  deleted?: boolean | null;
  changedStatus?: string | null;
  changedSummary?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
};
