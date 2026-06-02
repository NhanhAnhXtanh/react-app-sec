import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Employee } from '@/model/employee.types';

type ColumnActions = {
  onView: (item: Employee) => void;
  onEdit: (item: Employee) => void;
  onDelete: (item: Employee) => void;
};

export function createEmployeeColumns(actions: ColumnActions): ColumnDef<Employee>[] {
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
    { accessorKey: 'id', header: 'ID', size: 80 },
    { accessorKey: 'employeeNumber', header: 'Employee #', size: 130 },
    {
      id: 'fullName',
      header: 'Name',
      size: 180,
      cell: ({ row }) => {
        const { firstName, lastName } = row.original;
        return [firstName, lastName].filter(Boolean).join(' ') || '—';
      },
    },
    { accessorKey: 'email', header: 'Email', size: 200 },
    {
      id: 'department',
      header: 'Department',
      size: 150,
      cell: ({ row }) => row.original.department?.name ?? '—',
    },
    {
      accessorKey: 'salary',
      header: 'Salary',
      size: 120,
      cell: ({ row }) => {
        const val = row.original.salary;
        if (val === undefined || val === null) return <span className="text-muted-foreground text-xs">—</span>;
        return new Intl.NumberFormat().format(val);
      },
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
              <DropdownMenuItem onClick={() => actions.onView(item)}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(item)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(item)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
