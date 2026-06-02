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
import type { FilterRule, TableModeOptions } from '@/shared/table/table.types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { departmentApi } from '@/api/department.api';
import type { Department } from '@/model/department.types';
import { DEPARTMENT_LIST_PREFIX } from '../department.cache';
import { createDepartmentColumns } from './department.columns';
import { DepartmentTableToolbar } from './DepartmentTableToolbar';

export type DepartmentTableProps = {
  organizationId?: string;
  tableMode?: TableModeOptions;
};

const getRowId = (row: Department) => String(row.id);

export function DepartmentTable({ organizationId, tableMode }: DepartmentTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingDelete, setPendingDelete] = useState<Department | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const extraFilters = useMemo<FilterRule[] | undefined>(
    () => (organizationId ? [{ id: 'organizationId', value: organizationId }] : undefined),
    [organizationId],
  );

  const dc = useDataCollection<Department>({
    queryKey: [...DEPARTMENT_LIST_PREFIX, organizationId ?? 'all'],
    queryFn: departmentApi.search,
    getRowId,
    extraFilters,
    tableMode,
  });

  const goto = (pathname: string) =>
    navigate(withSearch(pathname, location.search));

  const goToEdit = (
    departmentId: string,
    openMode: 'dialog' | 'fullscreen' | undefined = undefined,
  ) => {
    const suffix = openMode === 'dialog' ? '/dialog' : '';
    goto(`/departments/${departmentId}/edit${suffix}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => departmentApi.delete(String(id)),
    onSuccess: (_void, id) => {
      const strId = String(id);
      dc.removeItem(strId);
      dc.setRowSelection((sel) => {
        if (!(strId in sel)) return sel;
        const { [strId]: _drop, ...rest } = sel;
        return rest;
      });
    },
  });

  const handleDelete = (item: Department) => setPendingDelete(item);

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
      createDepartmentColumns({
        onView: (item) => goto(`/departments/${item.id}`),
        onViewFullscreen: (item) =>
          goto(`/departments/${item.id}/dialog`),
        onEdit: (item, openMode) => goToEdit(String(item.id), openMode),
        onDelete: handleDelete,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search],
  );

  const table = useAppTable<Department>({ dc, columns, getRowId });

  const { isLoading, isError, error } = dc.query;
  const isEmpty = !isLoading && !isError && dc.items.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <DepartmentTableToolbar
        keyword={dc.globalFilter}
        selectedCount={dc.selectedIds.length}
        organizationId={organizationId}
        onKeywordChange={(value) => dc.setGlobalFilter(value)}
        onCreateDialog={() => goto('/departments/new/dialog')}
        onCreateFullscreen={() => goto('/departments/new')}
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
                          <ArrowUp
                            className="ml-1 h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                        )}
                        {sorted === 'desc' && (
                          <ArrowDown
                            className="ml-1 h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                        )}
                        {!sorted && (
                          <ArrowUpDown
                            className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40"
                            aria-hidden
                          />
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                Error: {error instanceof Error ? error.message : 'Unknown'}
              </TableCell>
            </TableRow>
          )}

          {isEmpty && (
            <TableRow>
              <TableCell
                colSpan={table.getAllLeafColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                No departments found.
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
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination table={table} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete department"
        description={
          pendingDelete ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                "{pendingDelete.name}"
              </span>
              ? This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmSingleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete departments"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {dc.selectedIds.length}
            </span>{' '}
            selected{' '}
            {dc.selectedIds.length === 1 ? 'department' : 'departments'}? This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete all"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
