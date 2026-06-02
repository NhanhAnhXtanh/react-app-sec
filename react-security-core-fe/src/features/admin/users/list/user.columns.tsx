import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUser } from '@/model/user.types';

type ColumnActions = {
  onEdit: (item: AdminUser) => void;
  onDelete: (item: AdminUser) => void;
};

export function createUserColumns(actions: ColumnActions): ColumnDef<AdminUser>[] {
  return [
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
      ),
      enableSorting: false,
    },
    { accessorKey: 'login', header: 'Login', size: 140 },
    {
      id: 'fullName',
      header: 'Name',
      size: 180,
      cell: ({ row }) => [row.original.firstName, row.original.lastName].filter(Boolean).join(' ') || '—',
    },
    { accessorKey: 'email', header: 'Email', size: 220 },
    {
      accessorKey: 'activated',
      header: 'Status',
      size: 90,
      cell: ({ row }) => (
        <Badge variant={row.original.activated ? 'default' : 'secondary'}>
          {row.original.activated ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'authorities',
      header: 'Roles',
      size: 200,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.authorities?.map((a) => (
            <Badge key={a} variant="outline" className="text-xs">{a.replace('ROLE_', '')}</Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      size: 60,
      enableSorting: false,
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
              <DropdownMenuItem onClick={() => actions.onEdit(item)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(item)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
