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
import type { MetaSource } from '@/model/metasource.types';

type Handlers = {
  onView?: (item: MetaSource) => void;
  onViewFullscreen?: (item: MetaSource) => void;
  onEdit?: (
    item: MetaSource,
    openMode?: 'dialog' | 'fullscreen' | undefined,
  ) => void;
  onDelete?: (item: MetaSource) => void;
};

export function createMetaSourceColumns({
  onView,
  onViewFullscreen,
  onEdit,
  onDelete,
}: Handlers = {}): ColumnDef<MetaSource>[] {
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
      cell: (info) => (
        <span className="font-mono text-sm">{String(info.getValue() ?? '')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tên',
    },
    {
      accessorKey: 'sourceType',
      header: 'Loại nguồn',
      cell: (info) => (
        <Badge variant="outline">{String(info.getValue() ?? '')}</Badge>
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
      accessorKey: 'enabled',
      header: 'Bật',
      cell: (info) => {
        const v = info.getValue<boolean>();
        return (
          <Badge variant={v ? 'default' : 'secondary'}>
            {v ? 'Bật' : 'Tắt'}
          </Badge>
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
