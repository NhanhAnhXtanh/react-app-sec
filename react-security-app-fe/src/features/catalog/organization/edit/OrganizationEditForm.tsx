import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Organization } from '@/model/catalog.types';

export type OrganizationFormValues = {
  name: string;
  description?: string;
};

export type OrganizationEditMode = 'create' | 'edit';

type Props = {
  mode: OrganizationEditMode;
  item: Organization | null;
  onSubmit: (values: OrganizationFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function defaultsFor(
  mode: OrganizationEditMode,
  item: Organization | null,
): OrganizationFormValues {
  if (mode === 'edit' && item) {
    return {
      name: item.name,
      description: item.description ?? '',
    };
  }
  return { name: '', description: '' };
}

export function OrganizationEditForm({
  mode,
  item,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        description: value.description?.trim() || undefined,
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
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
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

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors || errors.length === 0) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}
