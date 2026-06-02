import { Button } from '@/components/ui/button';
import type { Employee } from '@/model/employee.types';

type Props = { item: Employee; onClose: () => void; onEdit?: () => void };

export function EmployeeDetailView({ item, onClose, onEdit }: Props) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">ID</dt>
          <dd className="text-sm">{item.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Employee #</dt>
          <dd className="text-sm">{item.employeeNumber ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">First Name</dt>
          <dd className="text-sm">{item.firstName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Last Name</dt>
          <dd className="text-sm">{item.lastName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Email</dt>
          <dd className="text-sm">{item.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Department</dt>
          <dd className="text-sm">{item.department?.name ?? '—'}</dd>
        </div>
        {item.salary !== undefined && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Salary</dt>
            <dd className="text-sm">{new Intl.NumberFormat().format(item.salary)}</dd>
          </div>
        )}
      </dl>
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        {onEdit && <Button type="button" onClick={onEdit}>Edit</Button>}
      </div>
    </div>
  );
}
