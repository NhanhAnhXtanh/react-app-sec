export type SchemaField = {
  name: string;
  type: string;
  nullable?: boolean | null;
  pk?: boolean | null;
  fk?: { table: string; field: string } | null;
};

export type SchemaTable = {
  name: string;
  fields: SchemaField[];
};

export type Schema = {
  tables: SchemaTable[];
};

export type QueryResult = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  count: number;
  latencyMs: number;
};
