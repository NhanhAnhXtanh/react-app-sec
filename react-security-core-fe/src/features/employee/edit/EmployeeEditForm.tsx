import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { departmentApi } from '@/api/department.api';
import type { Department } from '@/model/department.types';
import type { Employee } from '@/model/employee.types';

export type EmployeeFormValues = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  salary: string;
  departmentId: string;
};

type Props = {
  mode: 'create' | 'edit';
  item: Employee | null;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

const REQUIRED_MSG = 'This field is required.';

function defaultsFor(mode: 'create' | 'edit', item: Employee | null): EmployeeFormValues {
  if (mode === 'edit' && item) {
    return {
      employeeNumber: item.employeeNumber ?? '',
      firstName: item.firstName ?? '',
      lastName: item.lastName ?? '',
      email: item.email ?? '',
      salary: item.salary !== undefined ? String(item.salary) : '',
      departmentId: item.department?.id !== undefined ? String(item.department.id) : '',
    };
  }
  return { employeeNumber: '', firstName: '', lastName: '', email: '', salary: '', departmentId: '' };
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors?.length) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}

export function EmployeeEditForm({ mode, item, onSubmit, onCancel, submitting }: Props) {
  const departmentsQuery = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () =>
      departmentApi.search({ pageIndex: 0, pageSize: 1000, sorting: [], filters: [] }),
    staleTime: 60_000,
  });

  const departments: Department[] = departmentsQuery.data?.items ?? [];

  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => { await onSubmit(value); },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <FieldGroup className="gap-6">
        <form.Field
          name="employeeNumber"
          validators={{ onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG) }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Employee # <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mode === 'edit'}
                    aria-invalid={err ? true : undefined}
                  />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="firstName"
          validators={{ onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG) }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  First Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
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
          name="lastName"
          validators={{ onChange: ({ value }) => (value.trim() ? undefined : REQUIRED_MSG) }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>
                  Last Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
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
          name="departmentId"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Department</FieldLabel>
              <FieldContent>
                <Select
                  value={field.state.value || undefined}
                  onValueChange={(v) => field.handleChange(v)}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dep) => (
                      <SelectItem key={dep.id} value={String(dep.id)}>
                        {dep.name || dep.code || `#${dep.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        />

        <form.Field name="email" children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FieldContent>
          </Field>
        )} />

        <form.Field name="salary" children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Salary</FieldLabel>
            <FieldContent>
              <Input
                id={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FieldContent>
          </Field>
        )} />
      </FieldGroup>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
