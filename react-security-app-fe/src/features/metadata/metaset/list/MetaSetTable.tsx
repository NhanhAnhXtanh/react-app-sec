import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataCollection } from '@/shared/datacollection/useDataCollection';
import { useAppTable } from '@/shared/table/useAppTable';
import { TableLoadingSkeleton } from '@/shared/table/TableLoadingSkeleton';
import { TablePagination } from '@/shared/table/TablePagination';
import { withSearch } from '@/shared/router/withSearch';
import { ConfirmDialog } from '@/shared/form/ConfirmDialog';
import type { TableModeOptions } from '@/shared/table/table.types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { metaSetApi } from '@/api/metaset.api';
import type { MetaSet } from '@/model/metaset.types';
import { META_SET_LIST_PREFIX } from '../metaset.cache';
import { createMetaSetColumns } from './metaset.columns';
import { MetaSetTableToolbar } from './MetaSetTableToolbar';

export type MetaSetTableProps = {
  tableMode?: TableModeOptions;
};

const getRowId = (row: MetaSet) => row.id;

export function MetaSetTable({ tableMode }: MetaSetTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingDelete, setPendingDelete] = useState<MetaSet | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const dc = useDataCollection<MetaSet>({
    queryKey: [...META_SET_LIST_PREFIX],
    queryFn: metaSetApi.search,
    getRowId,
    tableMode,
  });

  const goto = (pathname: string) =>
    navigate(withSearch(pathname, location.search));

  const goToEdit = (
    rowId: string,
    openMode: 'dialog' | 'fullscreen' | undefined = undefined,
  ) => {
    const suffix = openMode === 'dialog' ? '/dialog' : '';
    goto(`/meta-sets/${rowId}/edit${suffix}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaSetApi.delete(id),
    onSuccess: (_void, id) => {
      dc.removeItem(id);
      dc.setRowSelection((sel) => {
        if (!(id in sel)) return sel;
        const { [id]: _drop, ...rest } = sel;
        return rest;
      });
    },
  });

  const handleDelete = (item: MetaSet) => setPendingDelete(item);

  const confirmSingleDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  const handleDeleteSelected = () => {
    if (dc.selectedIds.length === 0) return;
    setBulkDeleteOpen(true);
  };

  const handleEditSelected = () => {
    if (dc.selectedIds.length !== 1) return;
    goToEdit(dc.selectedIds[0], 'fullscreen');
  };

  const confirmBulkDelete = async () => {
    for (const id of [...dc.selectedIds]) {
      await deleteMutation.mutateAsync(id);
    }
    setBulkDeleteOpen(false);
  };

  const columns = useMemo(
    () =>
      createMetaSetColumns({
        onView: (item) => goto(`/meta-sets/${item.id}`),
        onViewFullscreen: (item) => goto(`/meta-sets/${item.id}/dialog`),
        onEdit: (item, openMode) => goToEdit(item.id, openMode),
        onDelete: handleDelete,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search],
  );

  const table = useAppTable<MetaSet>({ dc, columns, getRowId });

  const { isLoading, isError, error } = dc.query;
  const isEmpty = !isLoading && !isError && dc.items.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <MetaSetTableToolbar
        keyword={dc.globalFilter}
        selectedCount={dc.selectedIds.length}
        onKeywordChange={(value) => dc.setGlobalFilter(value)}
        filters={dc.columnFilters}
        onFilterChange={(id, value) => {
          dc.setColumnFilters((prev) => {
            const next = prev.filter((f) => f.id !== id);
            if (value !== '') {
              next.push({ id, value });
            }
            return next;
          });
        }}
        onCreateDialog={() => goto('/meta-sets/new/dialog')}
        onEditSelected={handleEditSelected}
        onDeleteSelected={handleDeleteSelected}
      />

      <Table className="rounded-md border-0">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : canSort ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sorted === 'asc' && (
                          <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        {sorted === 'desc' && (
                          <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        {!sorted && (
                          <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading && <TableLoadingSkeleton table={table} />}

          {isError && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="h-24 text-center text-destructive"
              >
                Lỗi: {error instanceof Error ? error.message : 'Unknown'}
              </TableCell>
            </TableRow>
          )}

          {isEmpty && (
            <TableRow>
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                Chưa có MetaSet nào.
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            !isError &&
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination table={table} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xoá MetaSet"
        description={
          pendingDelete ? (
            <>
              Xoá{' '}
              <span className="font-medium text-foreground">
                "{pendingDelete.name}"
              </span>
              ? Hành động này không hoàn tác được.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmSingleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Xoá nhiều MetaSet"
        description={
          <>
            Xoá{' '}
            <span className="font-medium text-foreground">
              {dc.selectedIds.length}
            </span>{' '}
            MetaSet đã chọn? Hành động này không hoàn tác được.
          </>
        }
        confirmLabel="Xoá tất cả"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
