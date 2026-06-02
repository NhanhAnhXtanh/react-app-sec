import { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { domainApi, organizationApi, tagApi } from '@/api/catalog.api';
import { metaSourceApi } from '@/api/metasource.api';
import { metaSyncApi } from '@/api/metasync.api';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import { FieldDataEditor } from '../../shared/FieldDataEditor';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import type { MetaSet } from '@/model/metaset.types';
import {
  buildEndpointPathFromMetaSetApiConfig,
  createMetaSetApiConfigFromMetaSet,
  getPrimaryMetaSetApiOperation,
  serializeMetaSetApiConfig,
  type MetaSetApiConfig,
  type MetaSetApiOperation,
} from './metaset-api-config';
import type { MetaSetApiSetting, MetaSetEndpointConfig } from '@/model/metaset.types';

export type MetaSetFormValues = {
  name: string;
  metaCode?: string;
  description?: string;
  metaSourceId?: string;
  organizationId?: string | null;
  domainId?: string | null;
  classification?: string;
  tier?: string;
  exampleData?: string;
  fieldData?: string;
  metaSyncId?: string;
  endpointPath?: string;
  endpointConfig?: MetaSetEndpointConfig;
  apiSetting?: MetaSetApiSetting;
  operations?: MetaSetApiOperation[];
  tagIds?: string[];
};

export type MetaSetEditMode = 'create' | 'edit';

type Props = {
  mode: MetaSetEditMode;
  item: MetaSet | null;
  onSubmit: (values: MetaSetFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function defaultsFor(
  mode: MetaSetEditMode,
  item: MetaSet | null,
): MetaSetFormValues {
  if (mode === 'edit' && item) {
    return {
      name: item.name,
      metaCode: item.metaCode ?? '',
      description: item.description ?? '',
      metaSourceId: item.metaSourceId,
      organizationId: item.organizationId,
      domainId: item.domainId,
      classification: item.classification ?? '',
      tier: item.tier ?? '',
      exampleData: item.exampleData ?? '',
      endpointPath: item.endpointPath ?? '',
      endpointConfig: item.endpointConfig ?? undefined,
      apiSetting: item.apiSetting ?? undefined,
      operations: item.operations ?? undefined,
      tagIds: item.tags?.map((t) => t.id) ?? [],
    };
  }
  return {
    name: '',
    metaCode: '',
    description: '',
    metaSourceId: '',
    organizationId: null,
    domainId: null,
    classification: '',
    tier: '',
    exampleData: '',
    fieldData: '',
    metaSyncId: '',
    endpointPath: '',
    endpointConfig: undefined,
    tagIds: [],
  };
}

export function MetaSetEditForm({
  mode,
  item,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const orgsQuery = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: () => organizationApi.listAll(),
  });
  const domainsQuery = useQuery({
    queryKey: ['domains', 'all'],
    queryFn: () => domainApi.listAll(),
  });
  const sourcesQuery = useQuery({
    queryKey: ['meta-sources', 'all'],
    queryFn: () =>
      metaSourceApi
        .search({ pageIndex: 0, pageSize: 1000 })
        .then((r) => r.items),
  });
  const tagsQuery = useQuery({
    queryKey: ['tags', 'all'],
    queryFn: () => tagApi.listAll(),
  });

  const currentVersionQuery = useQuery({
    queryKey: ['meta-set-versions', 'byId', item?.currentVersionId],
    queryFn: () => metaSetVersionApi.getById(item!.currentVersionId!),
    enabled: mode === 'edit' && !!item?.currentVersionId,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [apiConfigState, setApiConfigState] = useState<MetaSetApiConfig>(() => createMetaSetApiConfigFromMetaSet(item));
  const [tagSearch, setTagSearch] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab === 'data-structure' || rawTab === 'data') ? 'data' : 'info';

  const setActiveTab = (tab: 'info' | 'data') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab === 'data' ? 'data-structure' : 'overview');
        return next;
      },
      { replace: true }
    );
  };

  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => {
      const selectedSource = sourcesQuery.data?.find((source) => source.id === value.metaSourceId);
      const isApiMetaSet = selectedSource?.sourceType === 'API';
      const trimmedExample = value.exampleData?.trim();
      const trimmedFieldData = value.fieldData?.trim();
      await onSubmit({
        ...value,
        metaCode: value.metaCode?.trim() || undefined,
        description: value.description?.trim() || undefined,
        classification: value.classification?.trim() || undefined,
        tier: value.tier?.trim() || undefined,
        exampleData: trimmedExample ? trimmedExample : undefined,
        fieldData: trimmedFieldData ? trimmedFieldData : undefined,
        endpointPath: isApiMetaSet
          ? buildEndpointPathFromMetaSetApiConfig(apiConfigState)
          : value.endpointPath?.trim() || undefined,
        endpointConfig: isApiMetaSet ? apiConfigState.endpointConfig : undefined,
        apiSetting: isApiMetaSet ? apiConfigState.apiSetting : undefined,
        operations: isApiMetaSet ? apiConfigState.operations : undefined,
        tagIds: value.tagIds,
      });
    },
  });

  useEffect(() => {
    if (currentVersionQuery.data?.fieldData) {
      form.setFieldValue('fieldData', currentVersionQuery.data.fieldData);
    }
  }, [currentVersionQuery.data?.fieldData, form]);

  const metaSourceId = useStore(form.store, (state) => state.values.metaSourceId);
  const currentSource = useMemo(
    () => sourcesQuery.data?.find((s) => s.id === metaSourceId),
    [sourcesQuery.data, metaSourceId],
  );
  const parsedApiConfig = apiConfigState;
  const primaryApiOperation = useMemo(
    () => getPrimaryMetaSetApiOperation(parsedApiConfig),
    [parsedApiConfig],
  );
  const derivedEndpointPath = useMemo(
    () => buildEndpointPathFromMetaSetApiConfig(parsedApiConfig),
    [parsedApiConfig],
  );
  // Chỉ có DATABASE mới có MetaSync (chọn bảng). Các nguồn khác (API, FILE, KAFKA, MONGO,...) đều cấu hình tay.
  const requiresSyncSelection = currentSource?.sourceType === 'DATABASE';
  const isApiSource = currentSource?.sourceType === 'API';
  const apiConfigPreview = useMemo(
    () => serializeMetaSetApiConfig(apiConfigState),
    [apiConfigState],
  );

  useEffect(() => {
    setApiConfigState(createMetaSetApiConfigFromMetaSet(item));
  }, [item]);

  const updateApiConfig = (updater: (current: MetaSetApiConfig) => MetaSetApiConfig) => {
    setApiConfigState((current) => updater(current));
  };

  const metaSyncsQuery = useQuery({
    queryKey: ['meta-syncs', 'list', metaSourceId],
    queryFn: () =>
      metaSyncApi
        .search({ pageIndex: 0, pageSize: 1000 }, { dataSourceId: metaSourceId })
        .then((r) => r.items),
    enabled: !!metaSourceId && !!requiresSyncSelection && mode === 'create',
  });

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Subscribe selector={(state) => state.fieldMeta}>
        {(fieldMeta) => {
          const hasInfoError = ['name', 'metaSourceId'].some(
            (k) => fieldMeta[k as keyof MetaSetFormValues]?.errors?.length
          );
          const hasDataError = fieldMeta['fieldData']?.errors?.length;

          return (
            <div className="mb-6 flex space-x-4 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === 'info'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                Thông tin chung {hasInfoError && <span className="ml-1 text-destructive">•</span>}
              </button>
              {(!requiresSyncSelection || mode === 'edit') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('data')}
                  className={`border-b-2 px-1 py-2 text-sm font-medium ${
                    activeTab === 'data'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  Cấu hình dữ liệu {hasDataError && <span className="ml-1 text-destructive">•</span>}
                </button>
              )}
            </div>
          );
        }}
      </form.Subscribe>

      <div className={activeTab === 'info' ? 'block' : 'hidden'}>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {mode === 'edit' && item && (
          <Field className="md:col-span-1">
            <FieldLabel>Code</FieldLabel>
            <FieldContent>
              <Input value={item.code} disabled className="font-mono" />
              <FieldDescription>
                Code sinh tự động từ tên lúc tạo, không sửa được.
              </FieldDescription>
            </FieldContent>
          </Field>
        )}

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : 'Tên là bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined} className="md:col-span-1">
                <FieldLabel htmlFor={field.name}>
                  Tên <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={err ? true : undefined}
                  />
                  {mode === 'create' && (
                    <FieldDescription>
                      Code sẽ tự sinh từ tên.
                    </FieldDescription>
                  )}
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="metaCode"
          children={(field) => (
            <Field className="md:col-span-1">
              <FieldLabel htmlFor={field.name}>Mã tham chiếu / Tên bảng</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Mã bảng, mã endpoint..."
                  disabled={requiresSyncSelection}
                />
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="metaSourceId"
          validators={{
            onChange: ({ value }) =>
              value ? undefined : 'Nguồn là bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined} className="md:col-span-1">
                <FieldLabel htmlFor={field.name}>
                  Nguồn dữ liệu <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      onBlur={field.handleBlur}
                      aria-invalid={err ? true : undefined}
                    >
                      <SelectValue placeholder="-- Chọn Nguồn dữ liệu --" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcesQuery.data?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} · {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        {requiresSyncSelection && mode === 'create' && (
          <form.Field
            name="metaSyncId"
            validators={{
              onChange: ({ value }) =>
                value ? undefined : 'Bảng là bắt buộc',
            }}
            children={(field) => {
              const err = fieldError(field.state.meta.errors);
              return (
                <Field data-invalid={err ? 'true' : undefined} className="md:col-span-1">
                  <FieldLabel htmlFor={field.name}>
                    Bảng (MetaSync) <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(v) => {
                        field.handleChange(v);
                        const selectedSync = metaSyncsQuery.data?.find((s) => s.id === v);
                        if (selectedSync) {
                          form.setFieldValue('metaCode', selectedSync.metaCode || selectedSync.code);
                        }
                      }}
                      disabled={metaSyncsQuery.isLoading}
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full"
                        onBlur={field.handleBlur}
                        aria-invalid={err ? true : undefined}
                      >
                        <SelectValue placeholder="-- Chọn Bảng --" />
                      </SelectTrigger>
                      <SelectContent>
                        {metaSyncsQuery.data?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} · {s.metaName ?? s.metaCode ?? s.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  {err ? <FieldError>{err}</FieldError> : null}
                </Field>
              );
            }}
          />
        )}

        {isApiSource && (
          <Field className="md:col-span-1">
            <FieldLabel>Endpoint chính</FieldLabel>
            <FieldContent>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
                <div className="font-mono text-foreground">
                  {derivedEndpointPath ?? 'Chưa có operation nào được bật'}
                </div>
                <FieldDescription className="mt-2">
                  Giá trị này được suy ra từ operation ưu tiên cao nhất đang bật. Không nhập tay riêng nữa.
                </FieldDescription>
                {primaryApiOperation && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{primaryApiOperation.operationType}</Badge>
                    <Badge variant="secondary">{primaryApiOperation.method}</Badge>
                    <span>{primaryApiOperation.name || primaryApiOperation.code || 'Primary operation'}</span>
                  </div>
                )}
              </div>
            </FieldContent>
          </Field>
        )}

        {isApiSource && (
          <Field className="md:col-span-2">
            <FieldLabel>Operation</FieldLabel>
            <FieldDescription>
              Khai báo nghiệp vụ API cho MetaSet này: list, detail, create, update, delete hoặc custom.
            </FieldDescription>
            <FieldContent>
              <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                {parsedApiConfig.operations.map((operation, index) => (
                  <ApiOperationEditor
                    key={`${operation.code || 'operation'}-${index}`}
                    operation={operation}
                    onChange={(nextOperation) =>
                      updateApiConfig((current) => ({
                        ...current,
                        operations: current.operations.map((item, itemIndex) =>
                          itemIndex === index ? nextOperation : item,
                        ),
                      }))
                    }
                    onRemove={() =>
                      updateApiConfig((current) => ({
                        ...current,
                        operations: current.operations.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    canRemove={parsedApiConfig.operations.length > 1}
                  />
                ))}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateApiConfig((current) => ({
                        ...current,
                        operations: [
                          ...current.operations,
                          {
                            code: '',
                            name: '',
                            operationType: 'CUSTOM',
                            method: 'GET',
                            endpoint: '/',
                            responseMode: 'DETAIL',
                            description: '',
                            enabled: true,
                          },
                        ],
                      }))
                    }
                  >
                    Thêm Operation
                  </Button>
                </div>
              </div>
            </FieldContent>
          </Field>
        )}

        {isApiSource && (
          <Field className="md:col-span-2">
            <FieldLabel>Endpoint Config</FieldLabel>
            <FieldDescription>
              Xác định operation chính của MetaSet và base path chung nếu cần.
            </FieldDescription>
            <FieldContent>
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-3">
                <Input
                  value={parsedApiConfig.endpointConfig.basePath ?? ''}
                  onChange={(e) =>
                    updateApiConfig((current) => ({
                      ...current,
                      endpointConfig: {
                        ...current.endpointConfig,
                        basePath: e.target.value,
                      },
                    }))
                  }
                  placeholder="/v1/resource"
                />
                <Select
                  value={parsedApiConfig.endpointConfig.primaryOperationCode || undefined}
                  onValueChange={(value) =>
                    updateApiConfig((current) => {
                      const matchedOperation = current.operations.find((operation, index) =>
                        (operation.code?.trim() || `operation-${index}`) === value,
                      );
                      return {
                        ...current,
                        endpointConfig: {
                          ...current.endpointConfig,
                          primaryOperationCode: value,
                          primaryOperationType: matchedOperation?.operationType ?? current.endpointConfig.primaryOperationType,
                        },
                      };
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Operation chính" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedApiConfig.operations.map((operation, index) => {
                      const operationValue = operation.code?.trim() || `operation-${index}`;
                      return (
                        <SelectItem key={operationValue} value={operationValue}>
                          {(operation.name || operation.code || `Operation ${index + 1}`)} · {operation.operationType}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Input
                  value={parsedApiConfig.endpointConfig.primaryOperationType ?? ''}
                  onChange={(e) =>
                    updateApiConfig((current) => ({
                      ...current,
                      endpointConfig: {
                        ...current.endpointConfig,
                        primaryOperationType: e.target.value as MetaSetEndpointConfig['primaryOperationType'],
                      },
                    }))
                  }
                  placeholder="LIST / DETAIL / CUSTOM"
                />
              </div>
            </FieldContent>
          </Field>
        )}

        {mode === 'edit' && (
          <>
            <form.Field
              name="organizationId"
              children={(field) => {
                const err = fieldError(field.state.meta.errors);
                return (
                  <Field data-invalid={err ? 'true' : undefined} className="md:col-span-1">
                    <FieldLabel htmlFor={field.name}>Tổ chức</FieldLabel>
                    <FieldContent>
                      <Select
                        value={field.state.value ?? '__empty__'}
                        onValueChange={(v) => field.handleChange(v === '__empty__' ? null : v)}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          onBlur={field.handleBlur}
                          aria-invalid={err ? true : undefined}
                        >
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
                    {err ? <FieldError>{err}</FieldError> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="domainId"
              children={(field) => {
                const err = fieldError(field.state.meta.errors);
                return (
                  <Field data-invalid={err ? 'true' : undefined} className="md:col-span-1">
                    <FieldLabel htmlFor={field.name}>Lĩnh vực</FieldLabel>
                    <FieldContent>
                      <Select
                        value={field.state.value ?? '__empty__'}
                        onValueChange={(v) => field.handleChange(v === '__empty__' ? null : v)}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          onBlur={field.handleBlur}
                          aria-invalid={err ? true : undefined}
                        >
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
                    {err ? <FieldError>{err}</FieldError> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="classification"
              children={(field) => (
                <Field className="md:col-span-1">
                  <FieldLabel htmlFor={field.name}>Phân loại</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="vd: PUBLIC / INTERNAL"
                    />
                  </FieldContent>
                </Field>
              )}
            />

            <form.Field
              name="tier"
              children={(field) => (
                <Field className="md:col-span-1">
                  <FieldLabel htmlFor={field.name}>Tier</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="vd: BRONZE / SILVER / GOLD"
                    />
                  </FieldContent>
                </Field>
              )}
            />
          </>
        )}

        <form.Field
          name="tagIds"
          children={(field) => {
            const selectedIds = field.state.value ?? [];
            const selectedTags =
              tagsQuery.data?.filter((tag) => selectedIds.includes(tag.id)) ?? [];
            const normalizedSearch = tagSearch.trim().toLowerCase();
            const availableTags =
              tagsQuery.data?.filter((tag) => {
                if (selectedIds.includes(tag.id)) return false;
                if (!normalizedSearch) return true;
                return tag.name.toLowerCase().includes(normalizedSearch);
              }) ?? [];

            return (
              <Field className="md:col-span-1">
                <FieldLabel>Tags</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-background px-2 text-sm font-medium text-foreground shadow-xs"
                        >
                          {tag.name}
                          <button
                            type="button"
                            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={`Bỏ tag ${tag.name}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              field.handleChange(selectedIds.filter((id: string) => id !== tag.id));
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <div className="flex min-w-[180px] flex-1 items-center gap-2">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <input
                          type="text"
                          value={tagSearch}
                          onFocus={() => setTagDropdownOpen(true)}
                          onBlur={() => {
                            window.setTimeout(() => setTagDropdownOpen(false), 120);
                          }}
                          onChange={(event) => {
                            setTagSearch(event.target.value);
                            setTagDropdownOpen(true);
                          }}
                          placeholder={
                            selectedTags.length > 0
                              ? 'Thêm tag...'
                              : tagsQuery.isLoading
                                ? 'Đang tải tag...'
                                : 'Chọn tag...'
                          }
                          className="h-6 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    {tagDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
                        {tagsQuery.isLoading ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Đang tải tag...</div>
                        ) : tagsQuery.data?.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Chưa có tag nào</div>
                        ) : availableTags.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy tag</div>
                        ) : (
                          availableTags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                field.handleChange([...selectedIds, tag.id]);
                                setTagSearch('');
                                setTagDropdownOpen(false);
                              }}
                            >
                              {tag.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </FieldContent>
              </Field>
            );
          }}
        />

        <form.Field
          name="description"
          children={(field) => (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor={field.name}>Mô tả</FieldLabel>
              <FieldContent>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FieldContent>
            </Field>
          )}
        />

        {!requiresSyncSelection && (
          <form.Field
            name="exampleData"
            validators={{
              onChange: ({ value }) => {
                const v = (value ?? '').trim();
                if (!v) return undefined;
                try {
                  JSON.parse(v);
                  return undefined;
                } catch {
                  return 'JSON không hợp lệ';
                }
              },
            }}
            children={(field) => {
              const err = fieldError(field.state.meta.errors);
              return (
                <Field data-invalid={err ? 'true' : undefined} className="md:col-span-2">
                  <FieldLabel htmlFor={field.name}>Example data (JSON)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={5}
                      className="font-mono text-xs"
                      placeholder='{"sample":"value"}'
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={err ? true : undefined}
                    />
                  </FieldContent>
                  {err ? <FieldError>{err}</FieldError> : null}
                </Field>
              );
            }}
          />
        )}

        {isApiSource && (
          <>
            <Field className="md:col-span-2">
              <FieldLabel>API Setting</FieldLabel>
              <FieldDescription>
                Header mặc định, auth và timeout dùng chung cho các operation của MetaSet API.
              </FieldDescription>
              <FieldContent>
                <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <FieldLabel>Auth Type</FieldLabel>
                      <Select
                        value={parsedApiConfig.apiSetting.auth.authType}
                        onValueChange={(value) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, authType: value as MetaSetApiConfig['apiSetting']['auth']['authType'] },
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">NONE</SelectItem>
                          <SelectItem value="BEARER">BEARER</SelectItem>
                          <SelectItem value="BASIC">BASIC</SelectItem>
                          <SelectItem value="API_KEY">API_KEY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Timeout (ms)</FieldLabel>
                      <Input
                        type="number"
                        value={parsedApiConfig.apiSetting.timeoutMs}
                        onChange={(e) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              timeoutMs: Number(e.target.value) || 30000,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  {parsedApiConfig.apiSetting.auth.authType === 'BEARER' && (
                    <Input
                      value={parsedApiConfig.apiSetting.auth.bearerToken ?? ''}
                      onChange={(e) =>
                        updateApiConfig((current) => ({
                          ...current,
                          apiSetting: {
                            ...current.apiSetting,
                            auth: { ...current.apiSetting.auth, bearerToken: e.target.value },
                          },
                        }))
                      }
                      placeholder="Bearer token"
                    />
                  )}

                  {parsedApiConfig.apiSetting.auth.authType === 'BASIC' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        value={parsedApiConfig.apiSetting.auth.username ?? ''}
                        onChange={(e) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, username: e.target.value },
                            },
                          }))
                        }
                        placeholder="Username"
                      />
                      <Input
                        value={parsedApiConfig.apiSetting.auth.password ?? ''}
                        onChange={(e) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, password: e.target.value },
                            },
                          }))
                        }
                        placeholder="Password"
                        type="password"
                      />
                    </div>
                  )}

                  {parsedApiConfig.apiSetting.auth.authType === 'API_KEY' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Input
                        value={parsedApiConfig.apiSetting.auth.apiKeyName ?? ''}
                        onChange={(e) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, apiKeyName: e.target.value },
                            },
                          }))
                        }
                        placeholder="Header / Query key"
                      />
                      <Input
                        value={parsedApiConfig.apiSetting.auth.apiKeyValue ?? ''}
                        onChange={(e) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, apiKeyValue: e.target.value },
                            },
                          }))
                        }
                        placeholder="Key value"
                      />
                      <Select
                        value={parsedApiConfig.apiSetting.auth.apiKeyPlacement ?? 'HEADER'}
                        onValueChange={(value) =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              auth: { ...current.apiSetting.auth, apiKeyPlacement: value as 'HEADER' | 'QUERY' },
                            },
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HEADER">HEADER</SelectItem>
                          <SelectItem value="QUERY">QUERY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel>Default Headers</FieldLabel>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateApiConfig((current) => ({
                            ...current,
                            apiSetting: {
                              ...current.apiSetting,
                              headers: [...current.apiSetting.headers, { key: '', value: '' }],
                            },
                          }))
                        }
                      >
                        Thêm Header
                      </Button>
                    </div>
                    {parsedApiConfig.apiSetting.headers.length === 0 && (
                      <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                        Chưa có header mặc định.
                      </div>
                    )}
                    {parsedApiConfig.apiSetting.headers.map((header, index) => (
                      <div key={`header-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <Input
                          value={header.key}
                          onChange={(e) =>
                            updateApiConfig((current) => ({
                              ...current,
                              apiSetting: {
                                ...current.apiSetting,
                                headers: current.apiSetting.headers.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, key: e.target.value } : item,
                                ),
                              },
                            }))
                          }
                          placeholder="Header key"
                        />
                        <Input
                          value={header.value}
                          onChange={(e) =>
                            updateApiConfig((current) => ({
                              ...current,
                              apiSetting: {
                                ...current.apiSetting,
                                headers: current.apiSetting.headers.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, value: e.target.value } : item,
                                ),
                              },
                            }))
                          }
                          placeholder="Header value"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            updateApiConfig((current) => ({
                              ...current,
                              apiSetting: {
                                ...current.apiSetting,
                                headers: current.apiSetting.headers.filter((_, itemIndex) => itemIndex !== index),
                              },
                            }))
                          }
                        >
                          Xoá
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </FieldContent>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Structured API JSON Preview</FieldLabel>
              <FieldContent>
                <Textarea
                  rows={16}
                  className="font-mono text-xs"
                  value={apiConfigPreview}
                  readOnly
                />
              </FieldContent>
            </Field>
          </>
        )}
      </FieldGroup>
      </div>

      <div className={activeTab === 'data' ? 'flex flex-1 flex-col min-h-0' : 'hidden'}>
        <FieldGroup className="flex flex-1 flex-col gap-2 min-h-0">
          <form.Field
            name="fieldData"
            validators={{
              onChange: ({ value }) => {
                const v = (value ?? '').trim();
                if (!v) return undefined;
                try {
                  JSON.parse(v);
                  return undefined;
                } catch {
                  return 'JSON không hợp lệ';
                }
              },
            }}
            children={(field) => {
              const err = fieldError(field.state.meta.errors);
              return (
                <Field data-invalid={err ? 'true' : undefined} className="flex flex-1 flex-col min-h-0">
                  <FieldLabel htmlFor={field.name} className="shrink-0 mb-2">Cấu trúc trường dữ liệu</FieldLabel>
                  <FieldContent className="flex-1 min-h-0">
                    <FieldDataEditor
                      value={field.state.value ?? ''}
                      onChange={(val) => field.handleChange(val)}
                    />
                  </FieldContent>
                  {err ? <FieldError className="shrink-0">{err}</FieldError> : null}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </div>

      <form.Subscribe selector={(state) => state.fieldMeta}>
        {(fieldMeta) => {
          const hasInfoError = ['name', 'metaSourceId'].some(
            (k) => fieldMeta[k as keyof MetaSetFormValues]?.errors?.length
          );
          const hasDataError = fieldMeta['fieldData']?.errors?.length;

          return (
            <div className="mt-6 shrink-0 flex flex-col items-end gap-2 border-t border-border pt-4">
              {(hasInfoError || hasDataError) && (
                <div className="text-sm text-destructive">
                  Có lỗi nhập liệu. Vui lòng kiểm tra lại tab có dấu chấm đỏ.
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Đang lưu…' : mode === 'create' ? 'Tạo' : 'Lưu'}
                </Button>
              </div>
            </div>
          );
        }}
      </form.Subscribe>
    </form>
  );
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}

function ApiOperationEditor({
  operation,
  onChange,
  onRemove,
  canRemove,
}: {
  operation: MetaSetApiOperation;
  onChange: (operation: MetaSetApiOperation) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input value={operation.code ?? ''} onChange={(e) => onChange({ ...operation, code: e.target.value })} placeholder="operation code" />
        <Input value={operation.name ?? ''} onChange={(e) => onChange({ ...operation, name: e.target.value })} placeholder="operation name" />
        <Select value={operation.operationType} onValueChange={(value) => onChange({ ...operation, operationType: value as MetaSetApiOperation['operationType'] })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LIST">LIST</SelectItem>
            <SelectItem value="DETAIL">DETAIL</SelectItem>
            <SelectItem value="CREATE">CREATE</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="CUSTOM">CUSTOM</SelectItem>
          </SelectContent>
        </Select>
        <Select value={operation.method} onValueChange={(value) => onChange({ ...operation, method: value as MetaSetApiOperation['method'] })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
        <Input value={operation.endpoint} onChange={(e) => onChange({ ...operation, endpoint: e.target.value })} placeholder="/items/{id}" />
        <Select value={operation.responseMode} onValueChange={(value) => onChange({ ...operation, responseMode: value as MetaSetApiOperation['responseMode'] })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LIST">LIST</SelectItem>
            <SelectItem value="DETAIL">DETAIL</SelectItem>
            <SelectItem value="VOID">VOID</SelectItem>
            <SelectItem value="CUSTOM">CUSTOM</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" disabled={!canRemove} onClick={onRemove}>
          Xoá
        </Button>
      </div>
      <Textarea
        rows={2}
        value={operation.description ?? ''}
        onChange={(e) => onChange({ ...operation, description: e.target.value })}
        placeholder="Mô tả operation: list, detail, create..."
      />
    </div>
  );
}
