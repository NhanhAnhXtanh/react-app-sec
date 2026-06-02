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
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { employeeApi } from '@/api/employee.api';
import type { Employee } from '@/model/employee.types';
import { EMPLOYEE_LIST_PREFIX } from '../employee.cache';
import { createEmployeeColumns } from './employee.columns';
import { EmployeeTableToolbar } from './EmployeeTableToolbar';

const getRowId = (row: Employee) => String(row.id);

export function EmployeeTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const dc = useDataCollection<Employee>({
    queryKey: [...EMPLOYEE_LIST_PREFIX],
    queryFn: employeeApi.search,
    getRowId,
  });

  const goto = (pathname: string) => navigate(withSearch(pathname, location.search));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeApi.delete(id),
    onSuccess: (_void, id) => {
      dc.removeItem(String(id));
      dc.setRowSelection((sel) => {
        if (!(String(id) in sel)) return sel;
        const { [String(id)]: _drop, ...rest } = sel;
        return rest;
      });
    },
  });

  const confirmSingleDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
  };

  const confirmBulkDelete = async () => {
    for (const id of [...dc.selectedIds]) await deleteMutation.mutateAsync(Number(id));
    setBulkDeleteOpen(false);
  };

  const columns = useMemo(
    () => createEmployeeColumns({
      onView: (item) => goto(`/employees/${item.id}/dialog`),
      onEdit: (item) => goto(`/employees/${item.id}/edit`),
      onDelete: setPendingDelete,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search],
  );

  const table = useAppTable<Employee>({ dc, columns, getRowId });
  const { isLoading, isError, error } = dc.query;
  const isEmpty = !isLoading && !isError && dc.items.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <EmployeeTableToolbar
        keyword={dc.globalFilter}
        selectedCount={dc.selectedIds.length}
        onKeywordChange={(v) => dc.setGlobalFilter(v)}
        onCreateDialog={() => goto('/employees/new/dialog')}
        onCreateFullscreen={() => goto('/employees/new')}
        onEditSelected={() => { if (dc.selectedIds.length === 1) goto(`/employees/${dc.selectedIds[0]}/edit`); }}
        onDeleteSelected={() => { if (dc.selectedIds.length > 0) setBulkDeleteOpen(true); }}
      />

      <Table className="rounded-md border-0">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : canSort ? (
                      <Button type="button" variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {sorted === 'desc' && <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {!sorted && <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">{flexRender(header.column.columnDef.header, header.getContext())}</div>
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
            <TableRow><TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-destructive">Error: {error instanceof Error ? error.message : 'Unknown'}</TableCell></TableRow>
          )}
          {isEmpty && (
            <TableRow><TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">No employees found.</TableCell></TableRow>
          )}
          {!isLoading && !isError && table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination table={table} />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete employee"
        description={pendingDelete ? <>Delete <span className="font-medium">{[pendingDelete.firstName, pendingDelete.lastName].filter(Boolean).join(' ') || `#${pendingDelete.id}`}</span>?</> : null}
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmSingleDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete employees"
        description={<>Delete <span className="font-medium">{dc.selectedIds.length}</span> selected employee(s)?</>}
        confirmLabel="Delete all"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
