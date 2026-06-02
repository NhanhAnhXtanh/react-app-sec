import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Organization } from '@/model/catalog.types';

type Props = {
  item: Organization;
  onClose: () => void;
  onEdit?: () => void;
};

export function OrganizationDetailView({ item, onClose, onEdit }: Props) {
  return (
    <Card className="border-0 shadow-none ring-0">
      <CardContent className="space-y-0 px-0 pt-0">
        <DetailRow label="Tên" value={item.name} />
        <DetailRow label="Mô tả" value={item.description ?? '—'} />
        <DetailRow label="ID" value={item.id} mono />
        <DetailRow label="Tạo lúc" value={item.createdDate ?? '—'} />
        <DetailRow label="Sửa lần cuối" value={item.lastModifiedDate ?? '—'} />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-end gap-2 px-0 pb-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Đóng
        </Button>
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Sửa
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
