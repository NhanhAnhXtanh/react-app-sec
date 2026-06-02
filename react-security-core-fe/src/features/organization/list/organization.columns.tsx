import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Organization } from '@/model/organization.types';

type ColumnActions = {
  onView: (item: Organization) => void;
  onEdit: (item: Organization) => void;
  onDelete: (item: Organization) => void;
};

export function createOrganizationColumns(actions: ColumnActions): ColumnDef<Organization>[] {
  return [
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
    },
    {
      accessorKey: 'ownerLogin',
      header: 'Owner',
      size: 150,
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      size: 120,
      cell: ({ row }) => {
        const val = row.original.budget;
        if (val === undefined || val === null) return <span className="text-muted-foreground text-xs">—</span>;
        return new Intl.NumberFormat().format(val);
      },
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(item)}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(item)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onDelete(item)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
