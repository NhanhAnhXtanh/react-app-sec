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
import { metaSetApi } from '@/api/metaset.api';
export type MetaSetVersionFormValues = {
  dataSourceCode?: string;
  metaCode: string;
  metasyncCode?: string;
  fieldData?: string;
  fieldHash?: string;
  deleted: boolean;
  changedStatus: string;
  changedSummary?: string;
};
type Props = Readonly<{
  defaultMetaCode?: string | null;
  onSubmit: (values: MetaSetVersionFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}>;
export function MetaSetVersionCreateForm(props: Readonly<Props>) {
  const { defaultMetaCode, onSubmit, onCancel, submitting } = props;
  const metaSetsQuery = useQuery({
    queryKey: ['meta-sets', 'all'],
    queryFn: () => metaSetApi.listAll(),
  });
  const form = useForm({
    defaultValues: {
      dataSourceCode: '',
      metaCode: defaultMetaCode ?? '',
      metasyncCode: '',
      fieldData: '',
      fieldHash: '',
      deleted: false,
      changedStatus: 'CREATED',
      changedSummary: '',
    } as MetaSetVersionFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        dataSourceCode: value.dataSourceCode?.trim() || undefined,
        metasyncCode: value.metasyncCode?.trim() || undefined,
        fieldData: value.fieldData?.trim() || undefined,
        fieldHash: value.fieldHash?.trim() || undefined,
        changedSummary: value.changedSummary?.trim() || undefined,
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
        <form.Field
          name="metaCode"
          validators={{
            onChange: ({ value }) =>
              value ? undefined : 'MetaSet là bắt buộc',
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  MetaSet <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full max-w-md"
                      onBlur={field.handleBlur}
                      aria-invalid={err ? true : undefined}
                    >
                      <SelectValue placeholder="-- Chọn MetaSet --" />
                    </SelectTrigger>
                    <SelectContent>
                      {metaSetsQuery.data?.map((ms) => (
                        <SelectItem key={ms.id} value={ms.code}>
                          {ms.code} · {ms.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    VersionNo sẽ tự tăng theo MetaSet (BE quản lý).
                  </FieldDescription>
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
                />
        <form.Field
          name="dataSourceCode"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>DataSource code</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  className="font-mono"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FieldContent>
            </Field>
          )}
        />
        <form.Field
          name="metasyncCode"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>MetaSync code</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  className="font-mono"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
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
                    placeholder="vd: CREATED / UPDATED"
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
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Tóm tắt thay đổi</FieldLabel>
              <FieldContent>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={2}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FieldContent>
            </Field>
          )}
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
                  <span>Đánh dấu version này là đã xoá</span>
                </label>
              </FieldContent>
            </Field>
          )}
        />
        <form.Field
          name="fieldHash"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Field hash</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  className="font-mono text-xs"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FieldContent>
            </Field>
          )}
        />
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
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>Field data (JSON)</FieldLabel>
                <FieldContent>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={5}
                    className="font-mono text-xs"
                    placeholder='{"field":"value"}'
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
      </FieldGroup>
      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu…' : 'Tạo'}
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

