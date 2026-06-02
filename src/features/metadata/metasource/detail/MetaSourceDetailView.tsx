import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { MetaSource } from '@/model/metasource.types';
import {
  findConnector,
  findSourceType,
  parseConnectorConfig,
} from '../connector-schemas';

type Props = {
  item: MetaSource;
  onClose: () => void;
  onEdit?: () => void;
  onConnect?: () => void;
};

export function MetaSourceDetailView({ item, onClose, onEdit, onConnect }: Props) {
  const sourceDef = findSourceType(item.sourceType);
  const schema = findConnector(item.sourceType, item.connectorType);
  const config = parseConnectorConfig(item.connectorConfig);

  return (
    <Card className="border-0 shadow-none ring-0">
      <CardContent className="space-y-0 px-0 pt-0">
        <DetailRow label="Code" value={item.code} mono />
        <DetailRow label="Tên" value={item.name} />
        <DetailRow
          label="Loại nguồn"
          value={
            <Badge variant="outline">
              {sourceDef?.label ?? item.sourceType}
            </Badge>
          }
        />
        <DetailRow
          label="Connector"
          value={
            schema ? (
              <Badge variant="secondary">{schema.label}</Badge>
            ) : item.connectorType ? (
              <Badge variant="outline">{item.connectorType}</Badge>
            ) : (
              '—'
            )
          }
        />

        {schema?.fields.map((f) => (
          <DetailRow
            key={f.key}
            label={f.label}
            mono={f.type !== 'password'}
            value={renderConfigValue(f.secret, config[f.key])}
          />
        ))}

        <DetailRow label="Mô tả" value={item.description ?? '—'} />
        <DetailRow
          label="Trạng thái"
          value={
            <Badge variant={item.enabled ? 'default' : 'secondary'}>
              {item.enabled ? 'Bật' : 'Tắt'}
            </Badge>
          }
        />
        <DetailRow label="Tổ chức" value={item.organizationName ?? '—'} />
        <DetailRow label="Lĩnh vực" value={item.domainName ?? '—'} />
        <DetailRow label="ID" value={item.id} mono />
        <DetailRow label="Tạo lúc" value={item.createdDate ?? '—'} />
        <DetailRow label="Sửa lần cuối" value={item.lastModifiedDate ?? '—'} />
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-end gap-2 px-0 pb-0">
        <Button type="button" variant="outline" onClick={onClose}>
          Đóng
        </Button>
        {onConnect && (
          <Button type="button" variant="outline" onClick={onConnect}>
            Kết nối
          </Button>
        )}
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Sửa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function renderConfigValue(secret: boolean | undefined, raw: unknown): React.ReactNode {
  if (raw === undefined || raw === null || raw === '') return '—';
  if (secret) return '••••••••';
  return String(raw);
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
