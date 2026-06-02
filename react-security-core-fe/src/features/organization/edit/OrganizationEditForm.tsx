import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import {
  Field, FieldContent, FieldError, FieldGroup, FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Organization } from '@/model/organization.types';

export type OrganizationFormValues = {
  code: string;
  name: string;
  ownerLogin: string;
  budget: string;
};

type Props = {
  mode: 'create' | 'edit';
  item: Organization | null;
  onSubmit: (values: OrganizationFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function defaultsFor(mode: 'create' | 'edit', item: Organization | null): OrganizationFormValues {
  if (mode === 'edit' && item) {
    return {
      code: item.code ?? '',
      name: item.name ?? '',
      ownerLogin: item.ownerLogin ?? '',
      budget: item.budget !== undefined ? String(item.budget) : '',
    };
  }
  return { code: '', name: '', ownerLogin: '', budget: '' };
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors?.length) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}

export function OrganizationEditForm({ mode, item, onSubmit, onCancel, submitting }: Props) {
  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
    >
      <FieldGroup className="gap-6">
        <form.Field
          name="code"
          validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Code is required' }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>Code <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mode === 'edit'}
                  />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="name"
          validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Name is required' }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>Name <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field
          name="ownerLogin"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Owner Login</FieldLabel>
              <FieldContent>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </FieldContent>
            </Field>
          )}
        />

        <form.Field
          name="budget"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Budget</FieldLabel>
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
          )}
        />
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
