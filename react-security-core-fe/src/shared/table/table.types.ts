export type SortRule = {
  id: string;
  desc: boolean;
};

export type FilterRule = {
  id: string;
  value: unknown;
};

export type PageRequest = {
  pageIndex: number;
  pageSize: number;
  sorting?: SortRule[];
  filters?: FilterRule[];
  keyword?: string;
};

export type PageResponse<T> = {
  items: T[];
  total: number;
};

export type TableModeOptions = {
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
};

export type ResolvedTableMode = Required<TableModeOptions>;
