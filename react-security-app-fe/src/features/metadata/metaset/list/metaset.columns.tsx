import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MetaSet } from '@/model/metaset.types';

type Handlers = {
  onView?: (item: MetaSet) => void;
  onViewFullscreen?: (item: MetaSet) => void;
  onEdit?: (
    item: MetaSet,
    openMode?: 'dialog' | 'fullscreen' | undefined,
  ) => void;
  onDelete?: (item: MetaSet) => void;
};

function statusBadge(status: string | null | undefined) {
  const s = status ?? 'DRAFT';
  if (s === 'PUBLISHED')
    return <Badge variant="default">Đã phát hành</Badge>;
  if (s === 'DISCONTINUED')
    return <Badge variant="secondary">Ngừng dùng</Badge>;
  return <Badge variant="outline">Bản nháp</Badge>;
}

export function createMetaSetColumns({
  onView,
  onViewFullscreen,
  onEdit,
  onDelete,
}: Handlers = {}): ColumnDef<MetaSet>[] {
  return [
    {
      id: 'select',
      enableSorting: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on current page"
          checked={
            table.getRowModel().rows.length === 0
              ? false
              : table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
          }
          onCheckedChange={(checked) => {
            table.toggleAllPageRowsSelected(checked === true);
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select row ${row.id}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={() => row.toggleSelected(!row.getIsSelected())}
        />
      ),
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            {item.metaCode ? (
              <span className="font-mono text-sm font-medium text-primary">
                {item.metaCode}
              </span>
            ) : null}
            <span className="font-mono text-xs text-muted-foreground">
              {item.code}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Tên',
    },
    {
      accessorKey: 'metaSourceName',
      header: 'Nguồn (MetaSource)',
      cell: (info) => (
        <span className="text-sm">
          {String(info.getValue() ?? '—')}
        </span>
      ),
    },
    {
      accessorKey: 'organizationName',
      header: 'Tổ chức',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      accessorKey: 'domainName',
      header: 'Lĩnh vực',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      accessorKey: 'currentVersionNo',
      header: 'Version',
      cell: (info) => {
        const v = info.getValue<number | null | undefined>();
        return v != null ? `v${v}` : '—';
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: (info) => statusBadge(info.getValue<string | null>()),
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
                aria-label={`Actions for ${item.code}`}
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
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  Sửa
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item, 'dialog')}>
                  Sửa (dialog)
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
