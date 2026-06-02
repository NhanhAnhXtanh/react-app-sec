import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { metaSetVersionApi } from '@/api/metasetversion.api';
import type { MetaSet } from '@/model/metaset.types';
import type { MetaSetVersion } from '@/model/metasetversion.types';
import {
  MetaSetActionDialog,
  type MetaSetActionKind,
} from './MetaSetActionDialog';
import { FieldDataEditor } from '../../shared/FieldDataEditor';
import {
  buildEndpointPathFromMetaSetApiParts,
  getPrimaryMetaSetApiOperationFromParts,
} from '../edit/metaset-api-config';

type Props = {
  item: MetaSet;
  onClose: () => void;
  onEdit?: () => void;
  onAction?: (
    kind: MetaSetActionKind,
    payload: { actor?: string; comment?: string },
  ) => Promise<void> | void;
  actionPending?: boolean;
};

type DetailTab = 'overview' | 'data-structure' | 'versions' | 'lifecycle';

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Thông tin chung' },
  { key: 'data-structure', label: 'Cấu trúc dữ liệu' },
  { key: 'versions', label: 'Phiên bản' },
  { key: 'lifecycle', label: 'Lịch sử vòng đời' },
];

function statusBadge(status: string | null | undefined) {
  const s = status ?? 'DRAFT';
  if (s === 'PUBLISHED') return <Badge variant="default">Đã phát hành</Badge>;
  if (s === 'DISCONTINUED') return <Badge variant="secondary">Ngừng dùng</Badge>;
  return <Badge variant="outline">Bản nháp</Badge>;
}

function changeBadge(status: string | null | undefined) {
  if (!status) return '—';
  if (status === 'CRITICAL') return <Badge variant="destructive">CRITICAL</Badge>;
  if (status === 'WARNING') return <Badge variant="outline">WARNING</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export function MetaSetDetailView({ item, onClose, onEdit, onAction, actionPending }: Props) {
  const [actionDialog, setActionDialog] = useState<MetaSetActionKind | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: DetailTab = ['overview', 'data-structure', 'versions', 'lifecycle'].includes(rawTab as any)
    ? (rawTab as DetailTab)
    : 'overview';

  const setActiveTab = (tab: DetailTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    item.currentVersionId ?? null,
  );

  const versionsQuery = useQuery({
    queryKey: ['meta-set-versions', 'list', item.metaCode ?? item.code],
    queryFn: () => metaSetVersionApi.listByMetaCode(item.metaCode ?? item.code),
    enabled: !!(item.metaCode ?? item.code),
    staleTime: 30_000,
  });

  const versions = versionsQuery.data ?? [];

  useEffect(() => {
    setSelectedVersionId(item.currentVersionId ?? null);
  }, [item.currentVersionId]);

  const selectedVersion = useMemo(() => {
    if (versions.length === 0) return null;
    return (
      versions.find((version) => version.id === selectedVersionId)
      ?? versions.find((version) => version.id === item.currentVersionId)
      ?? versions[0]
    );
  }, [item.currentVersionId, selectedVersionId, versions]);

  const handleConfirm = async (payload: { actor?: string; comment?: string }) => {
    if (!actionDialog || !onAction) return;
    await onAction(actionDialog, payload);
    setActionDialog(null);
  };

  const canPublish = item.status === 'DRAFT';
  const canDiscontinue = item.status === 'PUBLISHED';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b border-border">
          <div className="flex flex-wrap gap-1">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col pt-5 min-h-0">
          {activeTab === 'overview' && <OverviewTab item={item} />}
          {activeTab === 'data-structure' && (
            <DataStructureTab
              item={item}
              currentVersion={versions.find((v) => v.id === item.currentVersionId) ?? versions[0]}
            />
          )}
          {activeTab === 'versions' && (
            <VersionsTab
              versions={versions}
              selectedVersion={selectedVersion}
              selectedVersionId={selectedVersionId}
              currentVersionId={item.currentVersionId ?? null}
              loading={versionsQuery.isLoading}
              error={versionsQuery.isError}
              onSelect={setSelectedVersionId}
            />
          )}
          {activeTab === 'lifecycle' && <LifecycleTab item={item} />}
        </div>
      </div>

      <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-3 rounded-lg border bg-muted/50 p-4 backdrop-blur-sm">
        <Button type="button" variant="outline" onClick={onClose}>
          Đóng
        </Button>
        {onAction && canPublish && (
          <Button
            type="button"
            variant="outline"
            disabled={actionPending}
            onClick={() => setActionDialog('publish')}
          >
            Phát hành
          </Button>
        )}
        {onAction && canDiscontinue && (
          <Button
            type="button"
            variant="outline"
            disabled={actionPending}
            onClick={() => setActionDialog('discontinue')}
          >
            Ngừng dùng
          </Button>
        )}
        {onEdit && (
          <Button type="button" onClick={onEdit}>
            Sửa
          </Button>
        )}
      </div>

      <MetaSetActionDialog
        open={actionDialog !== null}
        kind={actionDialog ?? 'publish'}
        busy={actionPending}
        onConfirm={handleConfirm}
        onCancel={() => setActionDialog(null)}
      />
    </div>
  );
}

function OverviewTab({ item }: { item: MetaSet }) {
  const operations = item.operations ?? [];
  const apiSetting = item.apiSetting;
  const endpointConfig = item.endpointConfig;
  const operationCount = operations.length;
  const derivedEndpointPath = buildEndpointPathFromMetaSetApiParts(operations, endpointConfig);
  const primaryOperation = getPrimaryMetaSetApiOperationFromParts(operations, endpointConfig);
  const hasApiProjection = operationCount > 0 && !!apiSetting;

  return (
    <div className="w-full">
      <SectionTitle>Thông tin chung</SectionTitle>
      <div className="grid grid-cols-1 gap-x-12 xl:grid-cols-2">
        <DetailRow label="Tên" value={item.name} />
        <DetailRow label="Code" value={item.code} mono />

        <DetailRow label="Mô tả" value={item.description ?? '—'} />
        <DetailRow label="MetaCode (Tên bảng)" value={item.metaCode ?? '—'} mono />

        <DetailRow label="Trạng thái" value={statusBadge(item.status)} />
        <DetailRow label="ID" value={item.id} mono />

        <DetailRow
          label="Tags"
          value={
            item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="font-normal">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : '—'
          }
        />
        <DetailRow label="Tổ chức" value={item.organizationName ?? '—'} />

        <DetailRow
          label="MetaSource"
          value={
            item.metaSourceCode ? (
              <span className="font-mono text-xs">
                {item.metaSourceCode}
                {item.metaSourceName ? ` · ${item.metaSourceName}` : ''}
              </span>
            ) : '—'
          }
        />
        <DetailRow label="Lĩnh vực" value={item.domainName ?? '—'} />

        {(derivedEndpointPath || item.endpointPath) && (
          <DetailRow label="Endpoint chính" value={derivedEndpointPath ?? item.endpointPath ?? '—'} mono />
        )}
        {endpointConfig && (
          <DetailRow
            label="Endpoint config"
            value={
              <div className="space-y-1 text-xs">
                  <div>
                    Base path:{' '}
                    <span className="font-mono text-foreground">
                    {endpointConfig.basePath?.trim() || '—'}
                    </span>
                  </div>
                  <div>
                    Primary code:{' '}
                    <span className="font-mono text-foreground">
                    {endpointConfig.primaryOperationCode?.trim() || primaryOperation?.code?.trim() || '—'}
                    </span>
                  </div>
                  <div>
                    Primary type:{' '}
                    <span className="font-mono text-foreground">
                    {endpointConfig.primaryOperationType || primaryOperation?.operationType || '—'}
                    </span>
                  </div>
                </div>
            }
          />
        )}
        <DetailRow label="Phân loại" value={item.classification ?? '—'} />

        {hasApiProjection && apiSetting && (
          <DetailRow
            label="Operations"
            value={
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {operationCount} operation · Auth {apiSetting.auth.authType} · Timeout {apiSetting.timeoutMs}ms
                </div>
                <div className="space-y-2">
                  {operations.map((operation, index) => (
                    <div key={`${operation.code || operation.endpoint || 'op'}-${index}`} className="rounded-md border border-border bg-muted/40 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{operation.operationType}</Badge>
                        <Badge variant="secondary">{operation.method}</Badge>
                        <span className="font-medium">{operation.name || operation.code || 'Operation'}</span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-foreground">{operation.endpoint}</div>
                      {operation.description && (
                        <div className="mt-1 text-xs text-muted-foreground">{operation.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        )}
        <DetailRow label="Tier" value={item.tier ?? '—'} />

        {hasApiProjection && apiSetting && (
          <DetailRow
            label="API Setting"
            value={
              <div className="space-y-2 text-xs">
                <div>Auth: <span className="font-medium text-foreground">{apiSetting.auth.authType}</span></div>
                <div>Timeout: <span className="font-medium text-foreground">{apiSetting.timeoutMs}ms</span></div>
                <div>Headers mặc định: <span className="font-medium text-foreground">{apiSetting.headers.length}</span></div>
                {apiSetting.headers.length > 0 && (
                  <div className="rounded-md border border-border bg-muted/40 p-2 font-mono">
                    {apiSetting.headers.map((header, index) => (
                      <div key={`${header.key}-${index}`} className="break-all">
                        {header.key}: {header.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          />
        )}

        <DetailRow label="Tạo lúc" value={item.createdDate ?? '—'} />
        <DetailRow label="Sửa lần cuối" value={item.lastModifiedDate ?? '—'} />
      </div>
    </div>
  );
}

function DataStructureTab({
  item,
  currentVersion,
}: {
  item: MetaSet;
  currentVersion?: MetaSetVersion | null;
}) {
  return (
    <div className="flex flex-col h-full w-full">
      {item.exampleData && (
        <div className="shrink-0 mb-8 max-w-5xl">
          <SectionTitle>Dữ liệu mẫu (Example data)</SectionTitle>
          <pre className="max-h-80 overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
            {prettyJson(item.exampleData)}
          </pre>
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-0 w-full">
        <SectionTitle>Cấu trúc trường dữ liệu (v{currentVersion?.versionNo || 1})</SectionTitle>
        <div className="flex-1 min-h-0">
          <FieldDataEditor value={currentVersion?.fieldData ?? null} readOnly />
        </div>
      </div>
    </div>
  );
}

function VersionsTab({
  versions,
  selectedVersion,
  selectedVersionId,
  currentVersionId,
  loading,
  error,
  onSelect,
}: {
  versions: MetaSetVersion[];
  selectedVersion: MetaSetVersion | null;
  selectedVersionId: string | null;
  currentVersionId: string | null;
  loading: boolean;
  error: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return <div className="text-sm text-muted-foreground">Đang tải version…</div>;
  }
  if (error) {
    return <div className="text-sm text-destructive">Không tải được danh sách version.</div>;
  }
  if (versions.length === 0) {
    return <div className="text-sm text-muted-foreground">Chưa có version.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-w-0">
        <SectionTitle>Danh sách version</SectionTitle>
        <div className="max-h-[560px] overflow-auto rounded-md border border-border">
          {versions.map((version) => {
            const active = version.id === (selectedVersion?.id ?? selectedVersionId);
            const current = version.id === currentVersionId;
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onSelect(version.id)}
                className={`flex w-full flex-col gap-2 border-b border-border px-3 py-3 text-left text-sm last:border-b-0 transition-colors ${
                  active ? 'bg-muted text-foreground' : 'hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">v{version.versionNo}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    {current && <Badge variant="default">Hiện tại</Badge>}
                    {changeBadge(version.changedStatus)}
                  </div>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {version.changedSummary ?? '—'}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {version.createdDate ?? version.lastModifiedDate ?? version.id}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <SectionTitle>Thông tin version</SectionTitle>
        {selectedVersion ? (
          <VersionDetailPanel version={selectedVersion} />
        ) : (
          <div className="text-sm text-muted-foreground">Chọn một version để xem chi tiết.</div>
        )}
      </div>
    </div>
  );
}

function VersionDetailPanel({ version }: { version: MetaSetVersion }) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-1 gap-x-8 xl:grid-cols-2">
        <div className="min-w-0">
          <DetailRow label="Version" value={<Badge variant="outline">v{version.versionNo}</Badge>} />
          <DetailRow
            label="MetaSet"
            value={<span className="font-mono text-xs">{version.metaCode}</span>}
          />
          <DetailRow
            label="DataSource"
            value={
              version.dataSourceCode ? (
                <span className="font-mono text-xs">{version.dataSourceCode}</span>
              ) : '—'
            }
          />
          <DetailRow
            label="MetaSync"
            value={
              version.metasyncCode ? (
                <span className="font-mono text-xs">{version.metasyncCode}</span>
              ) : '—'
            }
          />
          <DetailRow label="Đã xoá" value={version.deleted ? 'Có' : 'Không'} />
        </div>
        <div className="min-w-0">
          <DetailRow label="Trạng thái thay đổi" value={changeBadge(version.changedStatus)} />
          <DetailRow label="Tóm tắt thay đổi" value={version.changedSummary ?? '—'} />
          <DetailRow
            label="Field hash"
            value={
              version.fieldHash ? (
                <span className="font-mono text-xs break-all">{version.fieldHash}</span>
              ) : '—'
            }
          />
          <DetailRow label="ID" value={version.id} mono />
          <DetailRow label="Tạo lúc" value={version.createdDate ?? '—'} />
          <DetailRow label="Sửa lần cuối" value={version.lastModifiedDate ?? '—'} />
        </div>
      </div>
      <div className="mt-5">
        <SectionTitle>Field data</SectionTitle>
        <FieldDataEditor value={version.fieldData ?? null} readOnly />
      </div>
    </div>
  );
}

function LifecycleTab({ item }: { item: MetaSet }) {
  return (
    <div className="max-w-4xl">
      <SectionTitle>Vòng đời</SectionTitle>
      <DetailRow
        label="Phát hành"
        value={
          item.publishedAt
            ? `${item.publishedAt}${item.publishedBy ? ` · ${item.publishedBy}` : ''}`
            : '—'
        }
      />
      {item.publishedComment && (
        <DetailRow label="Ghi chú phát hành" value={item.publishedComment} />
      )}
      <DetailRow
        label="Ngừng dùng"
        value={
          item.discontinuedAt
            ? `${item.discontinuedAt}${item.discontinuedBy ? ` · ${item.discontinuedBy}` : ''}`
            : '—'
        }
      />
      {item.discontinuedComment && (
        <DetailRow label="Ghi chú ngừng dùng" value={item.discontinuedComment} />
      )}
      <DetailRow
        label="Sync gần nhất"
        value={
          item.lastSyncedAt
            ? `${item.lastSyncedAt}${item.lastSyncStatus ? ` · ${item.lastSyncStatus}` : ''}`
            : '—'
        }
      />
      <DetailRow
        label="Version hiện tại"
        value={
          item.currentVersionNo != null ? (
            <Badge variant="outline">v{item.currentVersionNo}</Badge>
          ) : '—'
        }
      />
      <DetailRow
        label="Last synced version"
        value={item.lastSyncedVersion != null ? `v${item.lastSyncedVersion}` : '—'}
      />
    </div>
  );
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className ?? ''}`}>
      {children}
    </div>
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
    <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 ${mono ? 'font-mono text-foreground' : 'text-foreground'}`}>
        {value}
      </dd>
    </div>
  );
}
