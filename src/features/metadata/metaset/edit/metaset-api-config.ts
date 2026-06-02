import type {
  MetaSet,
  MetaSetApiOperation,
  MetaSetApiOperationType,
  MetaSetEndpointConfig,
  MetaSetApiSetting,
} from '@/model/metaset.types';

export type { MetaSetApiOperation } from '@/model/metaset.types';

export type MetaSetApiConfig = {
  operations: MetaSetApiOperation[];
  apiSetting: MetaSetApiSetting;
  endpointConfig: MetaSetEndpointConfig;
};

const OPERATION_PRIORITY: MetaSetApiOperationType[] = [
  'LIST',
  'DETAIL',
  'CREATE',
  'UPDATE',
  'DELETE',
  'CUSTOM',
];

export function defaultMetaSetApiConfig(): MetaSetApiConfig {
  return {
    operations: [
      {
        code: 'list',
        name: 'List',
        operationType: 'LIST',
        method: 'GET',
        endpoint: '/',
        responseMode: 'LIST',
        description: '',
        enabled: true,
      },
    ],
    apiSetting: {
      auth: {
        authType: 'NONE',
        apiKeyPlacement: 'HEADER',
      },
      headers: [],
      timeoutMs: 30000,
    },
    endpointConfig: {
      primaryOperationCode: 'list',
      primaryOperationType: 'LIST',
      basePath: '',
    },
  };
}

export function createMetaSetApiConfigFromParts(
  operations?: MetaSetApiOperation[] | null,
  apiSetting?: MetaSetApiSetting | null,
  endpointConfig?: MetaSetEndpointConfig | null,
): MetaSetApiConfig {
  const fallback = defaultMetaSetApiConfig();
  return {
    operations: Array.isArray(operations) && operations.length > 0
      ? operations.map((operation) => ({
          code: operation.code?.trim() || '',
          name: operation.name?.trim() || '',
          operationType: operation.operationType || 'LIST',
          method: operation.method || 'GET',
          endpoint: operation.endpoint?.trim() || '/',
          responseMode: operation.responseMode || 'LIST',
          description: operation.description?.trim() || '',
          enabled: operation.enabled ?? true,
        }))
      : fallback.operations,
    apiSetting: {
      auth: {
        authType: apiSetting?.auth?.authType || 'NONE',
        username: apiSetting?.auth?.username || '',
        password: apiSetting?.auth?.password || '',
        bearerToken: apiSetting?.auth?.bearerToken || '',
        apiKeyName: apiSetting?.auth?.apiKeyName || '',
        apiKeyValue: apiSetting?.auth?.apiKeyValue || '',
        apiKeyPlacement: apiSetting?.auth?.apiKeyPlacement || 'HEADER',
      },
      headers: Array.isArray(apiSetting?.headers)
        ? apiSetting.headers.map((header) => ({
            key: header.key?.trim() || '',
            value: header.value?.trim() || '',
          }))
        : [],
      timeoutMs: apiSetting?.timeoutMs && apiSetting.timeoutMs > 0
        ? apiSetting.timeoutMs
        : 30000,
    },
    endpointConfig: {
      basePath: endpointConfig?.basePath?.trim() || '',
      primaryOperationCode: endpointConfig?.primaryOperationCode?.trim() || '',
      primaryOperationType: endpointConfig?.primaryOperationType || 'LIST',
    },
  };
}

export function createMetaSetApiConfigFromMetaSet(item: MetaSet | null): MetaSetApiConfig {
  if (!item) {
    return defaultMetaSetApiConfig();
  }
  return createMetaSetApiConfigFromParts(item.operations, item.apiSetting, item.endpointConfig);
}

export function serializeMetaSetApiConfig(config: MetaSetApiConfig): string {
  return JSON.stringify(
    {
      operations: config.operations.map((operation) => ({
        code: operation.code?.trim() || null,
        name: operation.name?.trim() || null,
        operationType: operation.operationType,
        method: operation.method,
        endpoint: operation.endpoint.trim() || '/',
        responseMode: operation.responseMode,
        description: operation.description?.trim() || null,
        enabled: operation.enabled,
      })),
      apiSetting: {
        auth: {
          authType: config.apiSetting.auth.authType,
          username: config.apiSetting.auth.username?.trim() || null,
          password: config.apiSetting.auth.password?.trim() || null,
          bearerToken: config.apiSetting.auth.bearerToken?.trim() || null,
          apiKeyName: config.apiSetting.auth.apiKeyName?.trim() || null,
          apiKeyValue: config.apiSetting.auth.apiKeyValue?.trim() || null,
          apiKeyPlacement: config.apiSetting.auth.apiKeyPlacement || 'HEADER',
        },
        headers: config.apiSetting.headers
          .filter((header) => header.key.trim())
          .map((header) => ({
            key: header.key.trim(),
            value: header.value.trim(),
          })),
        timeoutMs: config.apiSetting.timeoutMs || 30000,
      },
      endpointConfig: {
        basePath: config.endpointConfig.basePath?.trim() || null,
        primaryOperationCode: config.endpointConfig.primaryOperationCode?.trim() || null,
        primaryOperationType: config.endpointConfig.primaryOperationType || null,
      },
    },
    null,
    2,
  );
}

export function getPrimaryMetaSetApiOperation(config: MetaSetApiConfig): MetaSetApiOperation | null {
  return getPrimaryMetaSetApiOperationFromParts(config.operations, config.endpointConfig);
}

export function getPrimaryMetaSetApiOperationFromParts(
  operations?: MetaSetApiOperation[] | null,
  endpointConfig?: MetaSetEndpointConfig | null,
): MetaSetApiOperation | null {
  const config = createMetaSetApiConfigFromParts(operations, undefined, endpointConfig);
  const enabledOperations = config.operations.filter((operation) => operation.enabled !== false);
  if (enabledOperations.length === 0) {
    return null;
  }

  const preferredCode = config.endpointConfig.primaryOperationCode?.trim();
  if (preferredCode) {
    const matchedByCode = enabledOperations.find((operation) => operation.code?.trim() === preferredCode);
    if (matchedByCode) {
      return matchedByCode;
    }
  }

  const preferredType = config.endpointConfig.primaryOperationType;
  if (preferredType) {
    const matchedByType = enabledOperations.find((operation) => operation.operationType === preferredType);
    if (matchedByType) {
      return matchedByType;
    }
  }

  for (const operationType of OPERATION_PRIORITY) {
    const matched = enabledOperations.find((operation) => operation.operationType === operationType);
    if (matched) {
      return matched;
    }
  }

  return enabledOperations[0] ?? null;
}

export function buildEndpointPathFromMetaSetApiConfig(config: MetaSetApiConfig): string | undefined {
  return buildEndpointPathFromMetaSetApiParts(config.operations, config.endpointConfig);
}

export function buildEndpointPathFromMetaSetApiParts(
  operations?: MetaSetApiOperation[] | null,
  endpointConfig?: MetaSetEndpointConfig | null,
): string | undefined {
  const primaryOperation = getPrimaryMetaSetApiOperationFromParts(operations, endpointConfig);
  const path = primaryOperation?.endpoint?.trim();
  return path ? path : undefined;
}
