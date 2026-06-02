export type ConnectorFieldType = 'text' | 'number' | 'password' | 'url';

export type ConnectorField = {
  key: string;
  label: string;
  type: ConnectorFieldType;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  secret?: boolean;
};

export type ConnectorSchema = {
  type: string;
  label: string;
  fields: ConnectorField[];
};

export type SourceTypeDef = {
  type: string;
  label: string;
  connectors: ConnectorSchema[];
};

const HOST: ConnectorField = {
  key: 'host',
  label: 'Host',
  type: 'text',
  required: true,
  placeholder: 'localhost',
};
const USERNAME: ConnectorField = { key: 'username', label: 'Username', type: 'text' };
const PASSWORD: ConnectorField = {
  key: 'password',
  label: 'Password',
  type: 'password',
  secret: true,
};
const DATABASE: ConnectorField = {
  key: 'database',
  label: 'Database',
  type: 'text',
  required: true,
};
const port = (def: number): ConnectorField => ({
  key: 'port',
  label: 'Port',
  type: 'number',
  required: true,
  placeholder: String(def),
  min: 1,
  max: 65535,
});

export const SOURCE_TYPES: SourceTypeDef[] = [
  {
    type: 'DATABASE',
    label: 'Database',
    connectors: [
      {
        type: 'POSTGRES',
        label: 'PostgreSQL',
        fields: [HOST, port(5432), DATABASE, USERNAME, PASSWORD],
      },
      {
        type: 'MONGODB',
        label: 'MongoDB',
        fields: [
          {
            key: 'connectionUri',
            label: 'Connection URI',
            type: 'text',
            required: true,
            placeholder: 'mongodb://user:pass@host:27017',
            secret: true,
          },
          DATABASE,
        ],
      },
      {
        type: 'MYSQL',
        label: 'MySQL',
        fields: [HOST, port(3306), DATABASE, USERNAME, PASSWORD],
      },
    ],
  },
  {
    type: 'API',
    label: 'API',
    connectors: [
      {
        type: 'REST',
        label: 'REST',
        fields: [
          {
            key: 'baseUrl',
            label: 'Base URL',
            type: 'url',
            required: true,
            placeholder: 'https://api.example.com',
          },
          {
            key: 'authToken',
            label: 'Auth token (Bearer)',
            type: 'password',
            secret: true,
          },
        ],
      },
      {
        type: 'GRAPHQL',
        label: 'GraphQL',
        fields: [
          {
            key: 'endpoint',
            label: 'Endpoint',
            type: 'url',
            required: true,
            placeholder: 'https://api.example.com/graphql',
          },
          {
            key: 'authToken',
            label: 'Auth token (Bearer)',
            type: 'password',
            secret: true,
          },
        ],
      },
    ],
  },
  {
    type: 'FILE',
    label: 'File',
    connectors: [
      {
        type: 'CSV',
        label: 'CSV',
        fields: [
          {
            key: 'path',
            label: 'Path / URL',
            type: 'text',
            required: true,
            placeholder: '/data/file.csv hoặc https://...',
          },
          {
            key: 'delimiter',
            label: 'Delimiter',
            type: 'text',
            placeholder: ',',
          },
        ],
      },
      {
        type: 'JSON',
        label: 'JSON',
        fields: [
          {
            key: 'path',
            label: 'Path / URL',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
  },
];

export function findSourceType(type: string | null | undefined): SourceTypeDef | undefined {
  if (!type) return undefined;
  return SOURCE_TYPES.find((s) => s.type === type);
}

export function findConnector(
  sourceType: string | null | undefined,
  connectorType: string | null | undefined,
): ConnectorSchema | undefined {
  const st = findSourceType(sourceType);
  if (!st || !connectorType) return undefined;
  return st.connectors.find((c) => c.type === connectorType);
}

export function validateField(
  field: ConnectorField,
  raw: string,
): string | undefined {
  const v = raw?.trim() ?? '';
  if (!v) return field.required ? `${field.label} là bắt buộc` : undefined;

  if (field.type === 'number') {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n))
      return `${field.label} phải là số nguyên`;
    if (field.min != null && n < field.min)
      return `${field.label} phải ≥ ${field.min}`;
    if (field.max != null && n > field.max)
      return `${field.label} phải ≤ ${field.max}`;
  }
  if (field.type === 'url') {
    try {
      new URL(v);
    } catch {
      return `${field.label} phải là URL hợp lệ (vd: https://...)`;
    }
  }
  return undefined;
}

export function buildConnectorConfig(
  schema: ConnectorSchema | undefined,
  values: Record<string, string>,
): string | undefined {
  if (!schema) return undefined;
  const out: Record<string, string | number> = {};
  for (const f of schema.fields) {
    const v = values[f.key]?.trim() ?? '';
    if (!v) continue;
    out[f.key] = f.type === 'number' ? Number(v) : v;
  }
  return Object.keys(out).length === 0 ? undefined : JSON.stringify(out);
}

export function parseConnectorConfig(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
