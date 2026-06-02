import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/shared/form/ConfirmDialog';
import { withSearch } from '@/shared/router/withSearch';
import { metaSetApi } from '@/api/metaset.api';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import type { MetaSetVersion } from '@/model/metasetversion.types';
import {
  getMetaSetVersionListKey,
  removeMetaSetVersionFromList,
} from '../metasetversion.cache';
import { createMetaSetVersionColumns } from './metasetversion.columns';

const getRowId = (row: MetaSetVersion) => row.id;

export function MetaSetVersionTable() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const search = new URLSearchParams(location.search);
  const metaCode = search.get('metaCode') ?? null;

  const [pendingDelete, setPendingDelete] = useState<MetaSetVersion | null>(
    null,
  );

  const metaSetsQuery = useQuery({
    queryKey: ['meta-sets', 'all'],
    queryFn: () => metaSetApi.listAll(),
  });

  const versionsQuery = useQuery({
    queryKey: getMetaSetVersionListKey(metaCode),
    queryFn: () => metaSetVersionApi.listByMetaCode(metaCode!),
    enabled: !!metaCode,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaSetVersionApi.delete(id),
    onSuccess: (_void, id) => {
      if (metaCode) {
        removeMetaSetVersionFromList(queryClient, metaCode, id);
      }
    },
  });

  const goto = (pathname: string) =>
    navigate(withSearch(pathname, location.search));

  const setMetaSetCode = (code: string) => {
    const next = new URLSearchParams(location.search);
    if (code) next.set('metaCode', code);
    else next.delete('metaCode');
    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
  };

  const columns = useMemo(
    () =>
      createMetaSetVersionColumns({
        onView: (item) => goto(`/meta-set-versions/${item.id}`),
        onViewFullscreen: (item) => goto(`/meta-set-versions/${item.id}/dialog`),
        onDelete: (item) => setPendingDelete(item),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.search],
  );

  const data = versionsQuery.data ?? [];

  const table = useReactTable<MetaSetVersion>({
    data,
    columns,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
  });

  const confirmSingleDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  const isLoading = !!metaCode && versionsQuery.isLoading;
  const isError = !!metaCode && versionsQuery.isError;
  const isEmpty = !!metaCode && !isLoading && !isError && data.length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-sm font-medium">MetaSet:</span>
        <Select
          value={metaCode ?? ''}
          onValueChange={(v) => setMetaSetCode(v)}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="-- Chọn MetaSet --" />
          </SelectTrigger>
          <SelectContent>
            {metaSetsQuery.data?.map((ms) => (
              <SelectItem key={ms.id} value={ms.metaCode ?? ms.code}>
                {ms.metaCode ?? ms.code} · {ms.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button
            type="button"
            disabled={!metaCode}
            onClick={() => goto('/meta-set-versions/new/dialog')}
          >
            + Tạo Version
          </Button>
        </div>
      </div>

      {!metaCode ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          Chọn một MetaSet để xem các version.
        </div>
      ) : (
        <Table className="rounded-md border-0">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Đang tải…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-destructive"
                >
                  Lỗi tải dữ liệu.
                </TableCell>
              </TableRow>
            )}
            {isEmpty && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có version nào cho MetaSet này.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xoá Version"
        description={
          pendingDelete ? (
            <>
              Xoá{' '}
              <span className="font-medium text-foreground">
                v{pendingDelete.versionNo}
              </span>{' '}
              của{' '}
                <span className="font-mono">{pendingDelete.metaCode}</span>?
              Hành động này không hoàn tác được.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={confirmSingleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
