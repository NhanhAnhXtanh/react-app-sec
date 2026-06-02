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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MetaSync } from '@/model/metasync.types';

type Handlers = {
  onView?: (item: MetaSync) => void;
  onViewFullscreen?: (item: MetaSync) => void;
  onEdit?: (
    item: MetaSync,
    openMode?: 'dialog' | 'fullscreen' | undefined,
  ) => void;
  onDelete?: (item: MetaSync) => void;
};

export function createMetaSyncColumns({
  onView,
  onViewFullscreen,
  onEdit,
  onDelete,
}: Handlers = {}): ColumnDef<MetaSync>[] {
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
      cell: (info) => {
        const raw = String(info.getValue() ?? '');
        const display = raw.replace(/-v\d+$/, '');
        return <span className="font-mono text-sm">{display}</span>;
      },
    },
    {
      accessorKey: 'metaName',
      header: 'Tên metadata',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      accessorKey: 'metaCode',
      header: 'Mã metadata',
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          {String(info.getValue() ?? '—')}
        </span>
      ),
    },
    {
      accessorKey: 'dataSourceCode',
      header: 'DataSource',
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          {String(info.getValue() ?? '—')}
        </span>
      ),
    },
    {
      accessorKey: 'changedStatus',
      header: 'Thay đổi',
      cell: (info) => {
        const v = info.getValue<string | null>();
        if (!v) return '—';
        const variant = v === 'CRITICAL' ? 'destructive' : 'outline';
        return <Badge variant={variant}>{v}</Badge>;
      },
    },
    {
      accessorKey: 'changedSummary',
      header: 'Tóm tắt thay đổi',
      enableSorting: false,
      cell: (info) => {
        const v = info.getValue<string | null | undefined>();
        if (!v) return <span className="text-muted-foreground">—</span>;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="line-clamp-1 text-xs text-muted-foreground cursor-default max-w-[200px] block">
                  {v}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs whitespace-pre-wrap">
                {v}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
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
