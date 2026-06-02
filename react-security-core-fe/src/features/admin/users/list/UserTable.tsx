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
import { SearchInput } from '@/shared/form/SearchInput';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userManagementApi } from '@/api/user-management.api';
import type { AdminUser } from '@/model/user.types';
import { USER_LIST_PREFIX } from '../user-management.cache';
import { createUserColumns } from './user.columns';

const getRowId = (row: AdminUser) => row.login ?? String(row.id);

export function UserTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const dc = useDataCollection<AdminUser>({
    queryKey: [...USER_LIST_PREFIX],
    queryFn: userManagementApi.search,
    getRowId,
  });

  const goto = (pathname: string) => navigate(withSearch(pathname, location.search));

  const deleteMutation = useMutation({
    mutationFn: (login: string) => userManagementApi.delete(login),
    onSuccess: (_void, login) => {
      dc.removeItem(login);
      dc.setRowSelection((sel) => {
        if (!(login in sel)) return sel;
        const { [login]: _drop, ...rest } = sel;
        return rest;
      });
    },
  });

  const confirmDelete = () => {
    if (!pendingDelete?.login) return;
    deleteMutation.mutate(pendingDelete.login, { onSuccess: () => setPendingDelete(null) });
  };

  const columns = useMemo(
    () => createUserColumns({
      onEdit: (item) => goto(`/admin/users/${item.login}/edit`),
      onDelete: setPendingDelete,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search],
  );

  const table = useAppTable<AdminUser>({ dc, columns, getRowId });
  const { isLoading, isError, error } = dc.query;
  const isEmpty = !isLoading && !isError && dc.items.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <SearchInput value={dc.globalFilter} onValueChange={(v) => dc.setGlobalFilter(v)} placeholder="Search users…" />
        <div className="ml-auto">
          <Button type="button" onClick={() => goto('/admin/users/new')}>+ New user</Button>
        </div>
      </div>

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
                      <Button type="button" variant="ghost" size="sm" className="-ml-3 h-8" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {sorted === 'desc' && <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />}
                        {!sorted && <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />}
                      </Button>
                    ) : (
                      <div className="flex items-center">{flexRender(header.column.columnDef.header, header.getContext())}</div>
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
            <TableRow><TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">No users found.</TableCell></TableRow>
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
        title="Delete user"
        description={pendingDelete ? <>Delete user <span className="font-medium">{pendingDelete.login}</span>?</> : null}
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
