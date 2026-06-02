import { useState } from 'react';
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
import { domainApi, organizationApi } from '@/api/catalog.api';
import type { MetaSource } from '@/model/metasource.types';
import {
  buildConnectorConfig,
  findConnector,
  findSourceType,
  parseConnectorConfig,
  SOURCE_TYPES,
  validateField,
  type ConnectorField,
} from '../connector-schemas';

export type MetaSourceFormValues = {
  name: string;
  sourceType: string;
  connectorType?: string | null;
  description?: string;
  enabled: boolean;
  organizationId?: string | null;
  domainId?: string | null;
  connectorConfig?: string;
};

export type MetaSourceEditMode = 'create' | 'edit';

const NULL_OPTION = '__null__';

type Props = {
  mode: MetaSourceEditMode;
  item: MetaSource | null;
  onSubmit: (values: MetaSourceFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

type StaticValues = {
  name: string;
  description?: string;
  enabled: boolean;
  organizationId?: string | null;
  domainId?: string | null;
};

function staticDefaults(
  mode: MetaSourceEditMode,
  item: MetaSource | null,
): StaticValues {
  if (mode === 'edit' && item) {
    return {
      name: item.name,
      description: item.description ?? '',
      enabled: item.enabled ?? true,
      organizationId: item.organizationId ?? null,
      domainId: item.domainId ?? null,
    };
  }
  return {
    name: '',
    description: '',
    enabled: true,
    organizationId: null,
    domainId: null,
  };
}

function readConnectorFields(item: MetaSource | null): Record<string, string> {
  const parsed = parseConnectorConfig(item?.connectorConfig);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    out[k] = v == null ? '' : String(v);
  }
  return out;
}

export function MetaSourceEditForm({
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

  const initialSourceType =
    mode === 'edit' && item ? item.sourceType : SOURCE_TYPES[0].type;
  const initialConnectorType = mode === 'edit' ? item?.connectorType ?? '' : '';

  const [sourceType, setSourceType] = useState(initialSourceType);
  const [connectorType, setConnectorType] = useState(initialConnectorType ?? '');
  const [connectorFields, setConnectorFields] = useState<Record<string, string>>(
    () => readConnectorFields(item),
  );
  const [connectorErrors, setConnectorErrors] = useState<Record<string, string>>(
    {},
  );

  const sourceDef = findSourceType(sourceType);
  const schema = findConnector(sourceType, connectorType);

  const handleSourceTypeChange = (next: string) => {
    setSourceType(next);
    setConnectorType('');
    setConnectorFields({});
    setConnectorErrors({});
  };

  const handleConnectorTypeChange = (next: string) => {
    setConnectorType(next);
    setConnectorErrors({});
    const itemMatches =
      mode === 'edit' &&
      item?.sourceType === sourceType &&
      item?.connectorType === next;
    setConnectorFields(itemMatches ? readConnectorFields(item) : {});
  };

  const setFieldValue = (key: string, value: string) => {
    setConnectorFields((prev) => ({ ...prev, [key]: value }));
    setConnectorErrors((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _drop, ...rest } = prev;
      return rest;
    });
  };

  const validateConnector = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!sourceType) errs.__sourceType = 'Source type là bắt buộc';
    if (!connectorType) errs.__connectorType = 'Connector type là bắt buộc';
    if (schema) {
      for (const f of schema.fields) {
        const v = connectorFields[f.key] ?? '';
        const err = validateField(f, v);
        if (err) errs[f.key] = err;
      }
    }
    return errs;
  };

  const form = useForm({
    defaultValues: staticDefaults(mode, item),
    onSubmit: async ({ value }) => {
      const errs = validateConnector();
      if (Object.keys(errs).length > 0) {
        setConnectorErrors(errs);
        return;
      }
      await onSubmit({
        ...value,
        sourceType,
        connectorType: connectorType || null,
        description: value.description?.trim() || undefined,
        connectorConfig: buildConnectorConfig(schema, connectorFields),
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
              <Field data-invalid={err ? 'true' : undefined}>
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
                      Code sẽ tự sinh từ tên (slug + suffix nếu trùng).
                    </FieldDescription>
                  )}
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <Field>
          <FieldLabel htmlFor="sourceType">
            Loại nguồn <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Select value={sourceType} onValueChange={handleSourceTypeChange}>
              <SelectTrigger id="sourceType" className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((s) => (
                  <SelectItem key={s.type} value={s.type}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field
          data-invalid={connectorErrors.__connectorType ? 'true' : undefined}
        >
          <FieldLabel htmlFor="connectorType">
            Connector <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Select
              value={connectorType || undefined}
              onValueChange={handleConnectorTypeChange}
            >
              <SelectTrigger id="connectorType" className="w-full max-w-md">
                <SelectValue placeholder="-- Chọn connector --" />
              </SelectTrigger>
              <SelectContent>
                {sourceDef?.connectors.map((c) => (
                  <SelectItem key={c.type} value={c.type}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
          {connectorErrors.__connectorType ? (
            <FieldError>{connectorErrors.__connectorType}</FieldError>
          ) : null}
        </Field>

        {schema?.fields.map((f) => (
          <ConnectorFieldInput
            key={f.key}
            field={f}
            value={connectorFields[f.key] ?? ''}
            error={connectorErrors[f.key]}
            onChange={(v) => setFieldValue(f.key, v)}
          />
        ))}

        <form.Field
          name="organizationId"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Tổ chức</FieldLabel>
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
                    {orgsQuery.data?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="domainId"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Lĩnh vực</FieldLabel>
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
                    {domainsQuery.data?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="enabled"
          children={(field) => (
            <Field>
              <FieldLabel>Trạng thái</FieldLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                  />
                  <span>Bật MetaSource này</span>
                </label>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <Field>
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

function ConnectorFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: ConnectorField;
  value: string;
  error?: string;
  onChange: (next: string) => void;
}) {
  const inputType =
    field.type === 'password'
      ? 'password'
      : field.type === 'number'
        ? 'number'
        : field.type === 'url'
          ? 'url'
          : 'text';
  return (
    <Field data-invalid={error ? 'true' : undefined}>
      <FieldLabel htmlFor={`connector-${field.key}`}>
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </FieldLabel>
      <FieldContent>
        <Input
          id={`connector-${field.key}`}
          type={inputType}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          {...(field.type === 'number'
            ? { min: field.min, max: field.max }
            : {})}
        />
      </FieldContent>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}
