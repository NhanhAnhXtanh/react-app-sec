import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { metaSourceApi } from '@/api/metasource.api';
import type { MetaSync } from '@/model/metasync.types';

export type MetaSyncFormValues = {
  status?: string;
  dataSourceId?: string | null;
  metaCode?: string;
  metaName?: string;
  fieldData: string;
  fieldHash: string;
  deleted: boolean;
  isActive: boolean;
  versionNo: number;
  changedStatus: string;
  changedSummary: string;
};

export type MetaSyncEditMode = 'create' | 'edit';

const NULL_OPTION = '__null__';

type Props = {
  mode: MetaSyncEditMode;
  item: MetaSync | null;
  onSubmit: (values: MetaSyncFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function defaultsFor(
  mode: MetaSyncEditMode,
  item: MetaSync | null,
): MetaSyncFormValues {
  if (mode === 'edit' && item) {
    return {
      status: item.status ?? '',
      dataSourceId: item.dataSourceId ?? null,
      metaCode: item.metaCode ?? '',
      metaName: item.metaName ?? '',
      fieldData: item.fieldData ?? '',
      fieldHash: item.fieldHash ?? '',
      deleted: item.deleted ?? false,
      isActive: item.isActive ?? true,
      versionNo: item.versionNo ?? 1,
      changedStatus: item.changedStatus ?? '',
      changedSummary: item.changedSummary ?? '',
    };
  }
  return {
    status: '',
    dataSourceId: null,
    metaCode: '',
    metaName: '',
    fieldData: '',
    fieldHash: '',
    deleted: false,
    isActive: true,
    versionNo: 1,
    changedStatus: 'CREATED',
    changedSummary: '',
  };
}

export function MetaSyncEditForm({
  mode,
  item,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const sourcesQuery = useQuery({
    queryKey: ['meta-sources', 'all'],
    queryFn: () =>
      metaSourceApi
        .search({ pageIndex: 0, pageSize: 1000 })
        .then((r) => r.items),
  });

  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        status: value.status?.trim() || undefined,
        metaCode: value.metaCode?.trim() || undefined,
        metaName: value.metaName?.trim() || undefined,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-6">
        {mode === 'edit' && item && (
          <Field>
            <FieldLabel>Code</FieldLabel>
            <FieldContent>
              <Input value={item.code} disabled className="font-mono" />
              <FieldDescription>
                Code sinh tự động từ tên metadata, không sửa được.
              </FieldDescription>
            </FieldContent>
          </Field>
        )}

        <form.Field
          name="metaName"
          validators={{
            onChange: ({ value }) =>
              (value ?? '').trim() ? undefined : 'Tên metadata là bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Tên metadata <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={err ? true : undefined}
                  />
                  {mode === 'create' && (
                    <FieldDescription>
                      Code sẽ tự sinh từ tên metadata.
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
            <Field>
              <FieldLabel htmlFor={field.name}>Mã metadata</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  className="font-mono"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="vd: weather.temp"
                />
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="dataSourceId"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>DataSource</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value ?? NULL_OPTION}
                  onValueChange={(v) =>
                    field.handleChange(v === NULL_OPTION ? null : v)
                  }
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full max-w-md"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue placeholder="(Không gán)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULL_OPTION}>(Không gán)</SelectItem>
                    {sourcesQuery.data?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} · {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="versionNo"
          validators={{
            onChange: ({ value }) =>
              Number.isFinite(value) && value > 0
                ? undefined
                : 'Version > 0',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Version <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={1}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(Number(e.target.value) || 1)
                    }
                    aria-invalid={err ? true : undefined}
                  />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="status"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Trạng thái</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="vd: SUCCESS / FAILED"
                />
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="changedStatus"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : 'Bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Trạng thái thay đổi <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="vd: CREATED / UPDATED / DELETED"
                    aria-invalid={err ? true : undefined}
                  />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="changedSummary"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : 'Bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Tóm tắt thay đổi <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={2}
                    value={field.state.value}
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

        <form.Field
          name="deleted"
          children={(field) => (
            <Field>
              <FieldLabel>Đã xoá</FieldLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                  />
                  <span>Đánh dấu là đã xoá</span>
                </label>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="isActive"
          children={(field) => (
            <Field>
              <FieldLabel>Active</FieldLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                  />
                  <span>Đánh dấu là version mới nhất</span>
                </label>
                <FieldDescription>
                  Sync tự động sẽ chỉ giữ một version active cho mỗi metadata.
                </FieldDescription>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="fieldHash"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : 'Field hash là bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Field hash <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    className="font-mono text-xs"
                    value={field.state.value}
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

        <form.Field
          name="fieldData"
          validators={{
            onChange: ({ value }) => {
              const v = (value ?? '').trim();
              if (!v) return 'Field data là bắt buộc';
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
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Field data (JSON) <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={6}
                    className="font-mono text-xs"
                    placeholder='{"field":"value"}'
                    value={field.state.value}
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
      </FieldGroup>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu…' : mode === 'create' ? 'Tạo' : 'Lưu'}
        </Button>
      </div>
    </form>
  );
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}
