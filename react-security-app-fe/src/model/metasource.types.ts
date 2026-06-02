export type MetaSource = {
  id: string;
  code: string;
  name: string;
  sourceType: string;
  connectorType?: string | null;
  description?: string | null;
  enabled: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  domainId?: string | null;
  domainName?: string | null;
  connectorConfig?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
};
