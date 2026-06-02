import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
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
import type { Organization } from '@/model/catalog.types';

type Handlers = {
  onView?: (item: Organization) => void;
  onViewFullscreen?: (item: Organization) => void;
  onEdit?: (
    item: Organization,
    openMode?: 'dialog' | 'fullscreen' | undefined,
  ) => void;
  onDelete?: (item: Organization) => void;
};

export function createOrganizationColumns({
  onView,
  onViewFullscreen,
  onEdit,
  onDelete,
}: Handlers = {}): ColumnDef<Organization>[] {
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
      accessorKey: 'name',
      header: 'Tên',
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: (info) => info.getValue() ?? '—',
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
                aria-label={`Actions for ${item.name}`}
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
