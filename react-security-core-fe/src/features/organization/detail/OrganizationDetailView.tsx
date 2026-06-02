import { Button } from '@/components/ui/button';
import type { Organization } from '@/model/organization.types';

type Props = {
  item: Organization;
  onClose: () => void;
  onEdit?: () => void;
};

export function OrganizationDetailView({ item, onClose, onEdit }: Props) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">ID</dt>
          <dd className="text-sm">{item.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Code</dt>
          <dd className="text-sm">{item.code ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Name</dt>
          <dd className="text-sm">{item.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Owner</dt>
          <dd className="text-sm">{item.ownerLogin ?? '—'}</dd>
        </div>
        {item.budget !== undefined && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Budget</dt>
            <dd className="text-sm">{new Intl.NumberFormat().format(item.budget)}</dd>
          </div>
        )}
      </dl>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
