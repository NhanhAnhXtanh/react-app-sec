import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import type { Department } from '@/model/department.types';

type Props = {
  item: Department;
  onClose: () => void;
  onEdit?: () => void;
};

export function DepartmentDetailView({ item, onClose, onEdit }: Props) {
  return (
    <Card className="border-0 shadow-none ring-0">
      <CardContent className="space-y-0 px-0 pt-0">
        <DetailRow
          label="Organization"
          value={item.organization?.name ?? '—'}
        />
        <DetailRow label="Code" value={item.code} mono />
        <DetailRow label="Name" value={item.name} />
        <DetailRow label="Cost Center" value={item.costCenter ?? '—'} />
        <DetailRow label="ID" value={String(item.id)} mono />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-end gap-2 px-0 pb-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-foreground' : 'text-foreground'}>
        {value}
      </dd>
    </div>
  );
}
