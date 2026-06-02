import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MetaSetVersion } from '@/model/metasetversion.types';

type Handlers = {
  onView?: (item: MetaSetVersion) => void;
  onViewFullscreen?: (item: MetaSetVersion) => void;
  onDelete?: (item: MetaSetVersion) => void;
};

export function createMetaSetVersionColumns({
  onView,
  onViewFullscreen,
  onDelete,
}: Handlers = {}): ColumnDef<MetaSetVersion>[] {
  return [
    {
      accessorKey: 'versionNo',
      header: 'Version',
      cell: (info) => {
        const v = info.getValue<number | null | undefined>();
        return v === null || v === undefined ? (
          '—'
        ) : (
          <Badge variant="outline">v{v}</Badge>
        );
      },
    },
    {
      accessorKey: 'metaCode',
      header: 'MetaSet',
      cell: (info) => (
        <span className="font-mono text-xs">{String(info.getValue() ?? '')}</span>
      ),
    },
    {
      accessorKey: 'metasyncCode',
      header: 'MetaSync',
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          {String(info.getValue() ?? '—')}
        </span>
      ),
    },
    {
      accessorKey: 'changedStatus',
      header: 'Trạng thái thay đổi',
      cell: (info) => {
        const v = info.getValue<string | null>();
        return v ? <Badge variant="secondary">{v}</Badge> : '—';
      },
    },
    {
      accessorKey: 'changedSummary',
      header: 'Tóm tắt',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      accessorKey: 'deleted',
      header: 'Đã xoá',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'secondary' : 'default'}>
          {info.getValue() ? 'Đã xoá' : 'Còn dùng'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdDate',
      header: 'Tạo lúc',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      size: 64,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for v${item.versionNo}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onView && (
                <DropdownMenuItem onClick={() => onView(item)}>
                  Xem
                </DropdownMenuItem>
              )}
              {onViewFullscreen && (
                <DropdownMenuItem onClick={() => onViewFullscreen(item)}>
                  Xem (dialog)
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(item)}
                  >
                    Xoá
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
