import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { domainApi, organizationApi } from '@/api/catalog.api';
import { metaSetApi } from '@/api/metaset.api';
import type { MetaSyncExtractPayload } from '@/api/metasync.api';
import type { MetaSync } from '@/model/metasync.types';

type Props = {
  open: boolean;
  metaSourceId?: string | null;
  metaSourceName?: string | null;
  metaSyncCode?: string | null;
  sourceMetaSyncs?: MetaSync[];
  busy?: boolean;
  onConfirm: (payload: MetaSyncExtractPayload, syncId?: string) => void;
  onCancel: () => void;
};

type ExtractMode = 'existing' | 'create';

export function MetaSyncExtractDialog({
  open,
  metaSourceId,
  metaSourceName,
  metaSyncCode,
  sourceMetaSyncs,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<ExtractMode>('existing');
  const [selectedMetaSetId, setSelectedMetaSetId] = useState('');
  const [selectedSyncId, setSelectedSyncId] = useState('');
  const [name, setName] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [domainId, setDomainId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [nameError, setNameError] = useState('');

  const selectedSync = sourceMetaSyncs?.find((s) => s.id === selectedSyncId);

  const metaSetsQuery = useQuery({
    queryKey: ['meta-sets', 'extract-targets', metaSourceId],
    queryFn: () => metaSetApi.listBySource(metaSourceId!),
    enabled: open && !!metaSourceId,
  });

  const orgsQuery = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: () => organizationApi.listAll(),
    enabled: open && mode === 'create',
  });

  const domainsQuery = useQuery({
    queryKey: ['domains', 'all'],
    queryFn: () => domainApi.listAll(),
    enabled: open && mode === 'create',
  });

  useEffect(() => {
    if (open) {
      setMode('existing');
      setSelectedMetaSetId('');
      setSelectedSyncId('');
      setName('');
      setOrganizationId(null);
      setDomainId(null);
      setSelectedError('');
      setSyncError('');
      setNameError('');
    }
  }, [open]);

  const allMetaSets = metaSetsQuery.data ?? [];
  let displayMetaSets = allMetaSets;
  if (sourceMetaSyncs && sourceMetaSyncs.length > 0) {
    if (selectedSync) {
      displayMetaSets = allMetaSets.filter(
        (ms) =>
          ms.metaCode === selectedSync.metaCode,
      );
    } else {
      displayMetaSets = [];
    }
  } else if (metaSyncCode) {
    displayMetaSets = allMetaSets.filter(
      (ms) => ms.metaCode === metaSyncCode,
    );
  }

  const hasExistingMetaSetForTable = (selectedSync || metaSyncCode) ? displayMetaSets.length > 0 : false;

  const selectedMetaSet = displayMetaSets.find((item) => item.id === selectedMetaSetId);

  const handleConfirm = () => {
    let valid = true;

    if (sourceMetaSyncs && sourceMetaSyncs.length > 0) {
      if (!selectedSyncId) {
        setSyncError('Vui lòng chọn 1 table (MetaSync)');
        valid = false;
      } else {
        setSyncError('');
      }
    }

    if (mode === 'existing') {
      if (!selectedMetaSet) {
        setSelectedError('Chọn MetaSet cần cập nhật version');
        valid = false;
      } else {
        setSelectedError('');
      }
      if (!valid) return;

      onConfirm(
        {
          targetMetaSetId: selectedMetaSet!.id,
          name: selectedMetaSet!.name,
          organizationId: selectedMetaSet!.organizationId,
          domainId: selectedMetaSet!.domainId,
        },
        selectedSyncId || undefined,
      );
      return;
    }

    if (mode === 'create' && hasExistingMetaSetForTable) {
      setSyncError('Table này đã được tạo MetaSet. Vui lòng chuyển sang tab "Cập nhật version".');
      valid = false;
    }

    if (!name.trim()) {
      setNameError('Tên là bắt buộc');
      valid = false;
    } else {
      setNameError('');
    }
    if (!valid) return;
    onConfirm({ name: name.trim(), organizationId, domainId }, selectedSyncId || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extract → MetaSet</DialogTitle>
          <DialogDescription>
            Chọn MetaSet cùng nguồn để cập nhật version, hoặc tạo MetaSet mới từ MetaSync này.
            {metaSourceName ? ` Nguồn: ${metaSourceName}.` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
          <Button
            type="button"
            variant={mode === 'existing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('existing')}
          >
            Cập nhật version
          </Button>
          <Button
            type="button"
            variant={mode === 'create' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('create')}
          >
            Tạo MetaSet mới
          </Button>
        </div>

        {sourceMetaSyncs && sourceMetaSyncs.length > 0 && (
          <div className="mb-4">
            <Field data-invalid={syncError ? 'true' : undefined}>
              <FieldLabel htmlFor="extract-sync">
                Table (MetaSync) <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Select
                  value={selectedSyncId || undefined}
                  onValueChange={(val) => {
                    setSelectedSyncId(val);
                    setSyncError('');
                    const sync = sourceMetaSyncs.find((s) => s.id === val);
                    if (sync && sync.metaCode && !name) {
                      setName(sync.metaCode);
                    }
                  }}
                >
                  <SelectTrigger id="extract-sync" className="w-full">
                    <SelectValue placeholder="-- Chọn table --" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceMetaSyncs.filter(s => !s.deleted).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.metaCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              {syncError && <FieldError>{syncError}</FieldError>}
            </Field>
          </div>
        )}

        {mode === 'existing' ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">MetaSet cùng nguồn</div>
            {metaSetsQuery.isLoading ? (
              <div className="rounded-md border border-border px-3 py-8 text-center text-sm text-muted-foreground">
                Đang tải MetaSet…
              </div>
            ) : displayMetaSets.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                Chưa có MetaSet nào cho table này. Chọn “Tạo MetaSet mới” để tạo trước.
              </div>
            ) : (
              <div className="max-h-72 overflow-auto rounded-md border border-border">
                {displayMetaSets.map((metaSet) => (
                  <button
                    key={metaSet.id}
                    type="button"
                    className={`flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted ${
                      selectedMetaSetId === metaSet.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedMetaSetId(metaSet.id);
                      setSelectedError('');
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{metaSet.name}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {metaSet.code}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">v{metaSet.currentVersionNo ?? 0}</Badge>
                      <Badge variant="secondary">{metaSet.status}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedError && <FieldError>{selectedError}</FieldError>}
          </div>
        ) : (
        <FieldGroup className="gap-4">
          <Field data-invalid={nameError ? 'true' : undefined}>
            <FieldLabel htmlFor="extract-name">
              Tên MetaSet <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="extract-name"
                value={name}
                placeholder="Nhập tên MetaSet…"
                onChange={(e) => setName(e.target.value)}
              />
            </FieldContent>
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="extract-org">Tổ chức</FieldLabel>
            <FieldContent>
              <Select
                value={organizationId ?? '__empty__'}
                onValueChange={(value) => setOrganizationId(value === '__empty__' ? null : value)}
              >
                <SelectTrigger id="extract-org" className="w-full">
                  <SelectValue placeholder="-- Không gán tổ chức --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">-- Không gán tổ chức --</SelectItem>
                  {orgsQuery.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="extract-domain">Lĩnh vực</FieldLabel>
            <FieldContent>
              <Select
                value={domainId ?? '__empty__'}
                onValueChange={(value) => setDomainId(value === '__empty__' ? null : value)}
              >
                <SelectTrigger id="extract-domain" className="w-full">
                  <SelectValue placeholder="-- Không gán lĩnh vực --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">-- Không gán lĩnh vực --</SelectItem>
                  {domainsQuery.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </FieldGroup>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Huỷ
          </Button>
          <Button 
            type="button" 
            disabled={busy} 
            onClick={handleConfirm}
          >
            {busy
              ? mode === 'existing' ? 'Đang cập nhật…' : 'Đang tạo…'
              : mode === 'existing' ? 'Cập nhật version' : 'Tạo MetaSet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
