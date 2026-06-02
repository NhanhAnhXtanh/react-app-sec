import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
} from '@tanstack/react-table';
import type { DataCollection } from '@/shared/datacollection/useDataCollection';

export type UseAppTableOptions<T> = {
  dc: DataCollection<T>;
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
};

export function useAppTable<T>(options: UseAppTableOptions<T>): Table<T> {
  const { dc, columns, getRowId } = options;

  const table = useReactTable<T>({
    data: dc.items,
    columns,
    state: {
      pagination: dc.pagination,
      sorting: dc.sorting,
      columnFilters: dc.columnFilters,
      globalFilter: dc.globalFilter,
      rowSelection: dc.rowSelection,
    },
    manualPagination: dc.tableMode.manualPagination,
    manualSorting: dc.tableMode.manualSorting,
    manualFiltering: dc.tableMode.manualFiltering,
    rowCount: dc.total,
    getRowId: (row) => getRowId(row),
    onPaginationChange: dc.setPagination,
    onSortingChange: dc.setSorting,
    onColumnFiltersChange: dc.setColumnFilters,
    onGlobalFilterChange: dc.setGlobalFilter,
    onRowSelectionChange: dc.setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: dc.tableMode.manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: dc.tableMode.manualFiltering
      ? undefined
      : getFilteredRowModel(),
    getPaginationRowModel: dc.tableMode.manualPagination
      ? undefined
      : getPaginationRowModel(),
    enableRowSelection: true,
  });

  return table;
}
