import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { FieldDataPreview } from '@/features/metadata/shared/FieldDataPreview';
import type { MetaSync } from '@/model/metasync.types';
import { metaSyncApi, type MetaSyncExtractPayload } from '@/api/metasync.api';
import { MetaSyncExtractDialog } from './MetaSyncExtractDialog';

type Props = {
  item: MetaSync;
  onClose: () => void;
  onEdit?: () => void;
  onExtracted?: (metaSetId: string) => void;
};

export function MetaSyncDetailView({ item, onClose, onEdit, onExtracted }: Props) {
  const [extractOpen, setExtractOpen] = useState(false);

  const extractMutation = useMutation({
    mutationFn: (payload: MetaSyncExtractPayload) =>
      metaSyncApi.extractToMetaSet(item.id, payload),
    onSuccess: (metaSet) => {
      setExtractOpen(false);
      onExtracted?.(metaSet.id);
    },
  });

  return (
    <Card className="border-0 shadow-none ring-0">
      <CardContent className="space-y-0 px-0 pt-0">
        <DetailRow label="Code" value={item.code} mono />
        <DetailRow
          label="Trạng thái"
          value={
            item.status ? (
              <Badge variant="outline">{item.status}</Badge>
            ) : (
              '—'
            )
          }
        />
        <DetailRow label="Tên metadata" value={item.metaName ?? '—'} />
        <DetailRow
          label="Mã metadata"
          value={
            item.metaCode ? (
              <span className="font-mono text-sm">{item.metaCode}</span>
            ) : (
              '—'
            )
          }
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
          label="Version"
          value={
            item.versionNo != null ? (
              <Badge variant="outline">v{item.versionNo}</Badge>
            ) : (
              '—'
            )
          }
        />
        <DetailRow
          label="Đã xoá"
          value={
            <Badge variant={item.deleted ? 'secondary' : 'default'}>
              {item.deleted ? 'Đã xoá' : 'Còn dùng'}
            </Badge>
          }
        />
        <DetailRow
          label="Active"
          value={
            <Badge variant={item.isActive === false ? 'secondary' : 'default'}>
              {item.isActive === false ? 'Version cũ' : 'Mới nhất'}
            </Badge>
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
        <DetailRow label="Tóm tắt thay đổi" value={item.changedSummary ?? '—'} />
        <DetailRow
          label="Field hash"
          value={
            <span className="font-mono text-xs break-all">{item.fieldHash}</span>
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
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => setExtractOpen(true)}
          disabled={item.deleted === true}
          title={item.deleted ? 'Không thể extract từ bảng đã bị xoá' : ''}
        >
          Extract → MetaSet
        </Button>
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Sửa
          </Button>
        )}
      </CardFooter>

      <MetaSyncExtractDialog
        open={extractOpen}
        metaSourceId={item.dataSourceId ?? null}
        metaSourceName={item.dataSourceCode ?? null}
        metaSyncCode={item.code}
        busy={extractMutation.isPending}
        onConfirm={(payload) => extractMutation.mutate(payload)}
        onCancel={() => setExtractOpen(false)}
      />
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
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-foreground' : 'text-foreground'}>
        {value}
      </dd>
    </div>
  );
}
