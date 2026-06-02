import { useCallback, useMemo, useState } from 'react';
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import type {
  FilterRule,
  PageRequest,
  PageResponse,
  ResolvedTableMode,
  SortRule,
  TableModeOptions,
} from '@/shared/table/table.types';
import {
  applyUpdater,
  parseListUrlState,
  writeListUrlState,
  type UrlStateDefaults,
} from './urlState';

export type UseDataCollectionOptions<T> = {
  queryKey: unknown[];
  queryFn: (params: PageRequest) => Promise<PageResponse<T>>;
  getRowId: (row: T) => string;
  initialPageSize?: number;
  initialSorting?: SortingState;
  extraFilters?: FilterRule[];
  tableMode?: TableModeOptions;
};

export type DataCollection<T> = {
  query: UseQueryResult<PageResponse<T>>;
  items: T[];
  total: number;

  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;

  sorting: SortingState;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;

  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;

  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;

  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;

  selectedIds: string[];
  selectedItems: T[];

  tableMode: ResolvedTableMode;
  params: PageRequest;
  fullKey: unknown[];

  getRowId: (row: T) => string;

  /** Cache mutators — update current page without refetching. */
  appendItem: (item: T) => void;
  prependItem: (item: T) => void;
  replaceItem: (item: T) => void;
  removeItem: (id: string) => void;
};

const DEFAULT_MODE: ResolvedTableMode = {
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
};

const EMPTY_SORTING: SortingState = [];

export function useDataCollection<T>(
  options: UseDataCollectionOptions<T>,
): DataCollection<T> {
  const {
    queryKey,
    queryFn,
    getRowId,
    initialPageSize = 10,
    initialSorting = EMPTY_SORTING,
    extraFilters,
    tableMode,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const defaults = useMemo<UrlStateDefaults>(
    () => ({
      defaultPageSize: initialPageSize,
      defaultSorting: initialSorting,
    }),
    [initialPageSize, initialSorting],
  );

  const urlState = useMemo(
    () => parseListUrlState(searchParams, defaults),
    [searchParams, defaults],
  );

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: urlState.pageIndex, pageSize: urlState.pageSize }),
    [urlState.pageIndex, urlState.pageSize],
  );
  const sorting = urlState.sorting;
  const columnFilters = urlState.filters;
  const globalFilter = urlState.keyword;

  const writePartial = useCallback(
    (patch: (prev: ReturnType<typeof parseListUrlState>) => Partial<ReturnType<typeof parseListUrlState>>) => {
      setSearchParams(
        (prev) => {
          const current = parseListUrlState(prev, defaults);
          const merged = { ...current, ...patch(current) };
          return writeListUrlState(prev, merged, defaults);
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const setPagination = useCallback<
    React.Dispatch<React.SetStateAction<PaginationState>>
  >(
    (updater) => {
      writePartial((current) => {
        const next = applyUpdater(
          { pageIndex: current.pageIndex, pageSize: current.pageSize },
          updater,
        );
        return { pageIndex: next.pageIndex, pageSize: next.pageSize };
      });
    },
    [writePartial],
  );

  const setSorting = useCallback<
    React.Dispatch<React.SetStateAction<SortingState>>
  >(
    (updater) => {
      writePartial((current) => ({
        sorting: applyUpdater(current.sorting, updater),
        pageIndex: 0,
      }));
    },
    [writePartial],
  );

  const setColumnFilters = useCallback<
    React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  >(
    (updater) => {
      writePartial((current) => ({
        filters: applyUpdater(current.filters, updater),
        pageIndex: 0,
      }));
    },
    [writePartial],
  );

  const setGlobalFilter = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (updater) => {
      writePartial((current) => ({
        keyword: applyUpdater(current.keyword, updater),
        pageIndex: 0,
      }));
    },
    [writePartial],
  );

  // rowSelection is transient UI state — stays in useState (not URL).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const resolvedMode: ResolvedTableMode = {
    ...DEFAULT_MODE,
    ...tableMode,
  };

  const params = useMemo<PageRequest>(() => {
    const merged: FilterRule[] = [
      ...columnFilters.map<FilterRule>((f) => ({ id: f.id, value: f.value })),
      ...(extraFilters ?? []),
    ];
    const sortingRules: SortRule[] = sorting.map((s) => ({
      id: s.id,
      desc: s.desc,
    }));
    return {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting: sortingRules,
      filters: merged,
      keyword: globalFilter || undefined,
    };
  }, [pagination, sorting, columnFilters, globalFilter, extraFilters]);

  const fullKey = useMemo(() => [...queryKey, params], [queryKey, params]);

  const query = useQuery<PageResponse<T>>({
    queryKey: fullKey,
    queryFn: () => queryFn(params),
    placeholderData: (previous) => previous,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const selectedItems = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const idSet = new Set(selectedIds);
    return items.filter((item) => idSet.has(getRowId(item)));
  }, [items, selectedIds, getRowId]);

  const updateCache = useCallback(
    (updater: (old: PageResponse<T>) => PageResponse<T>) => {
      queryClient.setQueryData<PageResponse<T>>(fullKey, (old) => {
        if (!old) return old;
        return updater(old);
      });
    },
    [queryClient, fullKey],
  );

  const appendItem = useCallback(
    (item: T) =>
      updateCache((old) => ({
        items: [...old.items, item],
        total: old.total + 1,
      })),
    [updateCache],
  );

  const prependItem = useCallback(
    (item: T) =>
      updateCache((old) => ({
        items: [item, ...old.items],
        total: old.total + 1,
      })),
    [updateCache],
  );

  const replaceItem = useCallback(
    (item: T) => {
      const id = getRowId(item);
      updateCache((old) => ({
        items: old.items.map((it) => (getRowId(it) === id ? item : it)),
        total: old.total,
      }));
    },
    [updateCache, getRowId],
  );

  const removeItem = useCallback(
    (id: string) =>
      updateCache((old) => ({
        items: old.items.filter((it) => getRowId(it) !== id),
        total: Math.max(0, old.total - 1),
      })),
    [updateCache, getRowId],
  );

  return {
    query,
    items,
    total,

    pagination,
    setPagination,

    sorting,
    setSorting,

    columnFilters,
    setColumnFilters,

    globalFilter,
    setGlobalFilter,

    rowSelection,
    setRowSelection,

    selectedIds,
    selectedItems,

    tableMode: resolvedMode,
    params,
    fullKey,

    getRowId,

    appendItem,
    prependItem,
    replaceItem,
    removeItem,
  };
}
