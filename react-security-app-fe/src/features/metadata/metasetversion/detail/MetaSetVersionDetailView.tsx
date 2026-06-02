import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FieldDataPreview } from '@/features/metadata/shared/FieldDataPreview';
import type { MetaSetVersion } from '@/model/metasetversion.types';

type Props = Readonly<{
  item: MetaSetVersion;
  onClose: () => void;
}>;

export function MetaSetVersionDetailView(props: Readonly<Props>) {
  const { item, onClose } = props;
  return (
    <Card className="border-0 shadow-none ring-0">
      <CardContent className="space-y-0 px-0 pt-0">
        <DetailRow
          label="Version"
          value={<Badge variant="outline">v{item.versionNo}</Badge>}
        />
        <DetailRow
          label="MetaSet"
          value={<span className="font-mono text-xs">{item.metaCode}</span>}
        />
        <DetailRow
          label="DataSource"
          value={
            item.dataSourceCode ? (
              <span className="font-mono text-xs">{item.dataSourceCode}</span>
            ) : (
              '—'
            )
          }
        />
        <DetailRow
          label="MetaSync"
          value={
            item.metasyncCode ? (
              <span className="font-mono text-xs">{item.metasyncCode}</span>
            ) : (
              '—'
            )
          }
        />
        <DetailRow
          label="Trạng thái thay đổi"
          value={
            item.changedStatus ? (
              <Badge variant="secondary">{item.changedStatus}</Badge>
            ) : (
              '—'
            )
          }
        />
        <DetailRow label="Tóm tắt" value={item.changedSummary ?? '—'} />
        <DetailRow
          label="Đã xoá"
          value={
            <Badge variant={item.deleted ? 'secondary' : 'default'}>
              {item.deleted ? 'Đã xoá' : 'Còn dùng'}
            </Badge>
          }
        />
        <DetailRow
          label="Field hash"
          value={
            item.fieldHash ? (
              <span className="font-mono text-xs break-all">
                {item.fieldHash}
              </span>
            ) : (
              '—'
            )
          }
        />
        <DetailRow
          label="Field data"
          value={<FieldDataPreview value={item.fieldData} />}
        />
        <DetailRow label="ID" value={item.id} mono />
        <DetailRow label="Tạo lúc" value={item.createdDate ?? '—'} />
        <DetailRow label="Sửa lần cuối" value={item.lastModifiedDate ?? '—'} />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-end gap-2 px-0 pb-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </CardFooter>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: Readonly<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}>) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-foreground' : 'text-foreground'}>
        {value}
      </dd>
    </div>
  );
}
