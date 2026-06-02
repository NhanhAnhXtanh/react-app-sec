import { useForm } from '@tanstack/react-form';
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
import { organizationApi } from '@/api/organization.api';
import type { Department } from '@/model/department.types';
import type { Organization } from '@/model/organization.types';

export type DepartmentFormValues = {
  organizationId: string;
  code: string;
  name: string;
  costCenter?: string;
};

export type DepartmentEditMode = 'create' | 'edit';

type Props = {
  mode: DepartmentEditMode;
  item: Department | null;
  defaultOrganizationId?: string;
  onSubmit: (values: DepartmentFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

const REQUIRED_MSG = 'This field is required.';

function defaultsFor(
  mode: DepartmentEditMode,
  item: Department | null,
  defaultOrganizationId?: string,
): DepartmentFormValues {
  if (mode === 'edit' && item) {
    return {
      organizationId: item.organization ? String(item.organization.id) : '',
      code: item.code,
      name: item.name,
      costCenter: item.costCenter ?? '',
    };
  }
  return {
    organizationId: defaultOrganizationId ?? '',
    code: '',
    name: '',
    costCenter: '',
  };
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}

export function DepartmentEditForm({
  mode,
  item,
  defaultOrganizationId,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const codeLocked = mode === 'edit';

  const organizationsQuery = useQuery({
    queryKey: ['organizations', 'options'],
    queryFn: () =>
      organizationApi.search({ pageIndex: 0, pageSize: 1000, sorting: [], filters: [] }),
    staleTime: 60_000,
  });

  const organizations: Organization[] = organizationsQuery.data?.items ?? [];

  const form = useForm({
    defaultValues: defaultsFor(mode, item, defaultOrganizationId),
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        costCenter: value.costCenter?.trim() || undefined,
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
          name="code"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG),
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Code <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    disabled={codeLocked}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={err ? true : undefined}
                  />
                  {codeLocked && (
                    <FieldDescription>Code is locked while editing.</FieldDescription>
                  )}
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG),
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Name <span className="text-destructive">*</span>
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
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="organizationId"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG),
          }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Organization <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      aria-invalid={err ? true : undefined}
                    >
                      <SelectValue placeholder="Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name || org.code || `#${org.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mode === 'create' && defaultOrganizationId && (
                    <FieldDescription>Pre-filled from current filter.</FieldDescription>
                  )}
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="costCenter"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Cost Center</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
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
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
