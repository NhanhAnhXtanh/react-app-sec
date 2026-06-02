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
import type { Department } from '@/model/department.types';

type Handlers = {
  onView?: (item: Department) => void;
  onViewFullscreen?: (item: Department) => void;
  onEdit?: (item: Department, openMode?: 'dialog' | 'fullscreen') => void;
  onDelete?: (item: Department) => void;
};

export function createDepartmentColumns({
  onView,
  onViewFullscreen,
  onEdit,
  onDelete,
}: Handlers = {}): ColumnDef<Department>[] {
  return [
    {
      id: 'select',
      enableSorting: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on current page"
          title="Select all rows on current page"
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
      id: 'organization',
      header: 'Organization',
      cell: ({ row }) => row.original.organization?.name ?? '—',
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: (info) => (
        <span className="font-medium">{String(info.getValue() ?? '')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'costCenter',
      header: 'Cost Center',
      cell: (info) => info.getValue() ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onView && (
                <DropdownMenuItem onClick={() => onView(item)}>
                  View
                </DropdownMenuItem>
              )}
              {onViewFullscreen && (
                <DropdownMenuItem onClick={() => onViewFullscreen(item)}>
                  View (dialog)
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item, 'fullscreen')}>
                  Edit
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item, 'dialog')}>
                  Edit (dialog)
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(item)}
                  >
                    Delete
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
