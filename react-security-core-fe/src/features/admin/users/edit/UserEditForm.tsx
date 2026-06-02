import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { userManagementApi } from '@/api/user-management.api';
import type { AdminUser } from '@/model/user.types';

export type UserFormValues = {
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  activated: boolean;
  authorities: string[];
  password?: string;
};

type Props = {
  mode: 'create' | 'edit';
  item: AdminUser | null;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

function defaultsFor(mode: 'create' | 'edit', item: AdminUser | null): UserFormValues {
  if (mode === 'edit' && item) {
    return {
      login: item.login ?? '',
      firstName: item.firstName ?? '',
      lastName: item.lastName ?? '',
      email: item.email ?? '',
      activated: item.activated ?? true,
      authorities: item.authorities ?? [],
    };
  }
  return { login: '', firstName: '', lastName: '', email: '', activated: true, authorities: [], password: '' };
}

function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors?.length) return undefined;
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}

export function UserEditForm({ mode, item, onSubmit, onCancel, submitting }: Props) {
  const [allAuthorities, setAllAuthorities] = useState<string[]>([]);

  useEffect(() => {
    userManagementApi.getAuthorities().then(setAllAuthorities).catch(() => {});
  }, []);

  const form = useForm({
    defaultValues: defaultsFor(mode, item),
    onSubmit: async ({ value }) => { await onSubmit(value); },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <FieldGroup className="gap-6">
        <form.Field
          name="login"
          validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Login is required' }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>Login <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} disabled={mode === 'edit'} />
                </FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        {mode === 'create' && (
          <form.Field name="password" children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <FieldContent><Input id={field.name} type="password" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} /></FieldContent>
            </Field>
          )} />
        )}

        <form.Field name="firstName" children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
            <FieldContent><Input id={field.name} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} /></FieldContent>
          </Field>
        )} />

        <form.Field name="lastName" children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
            <FieldContent><Input id={field.name} value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} /></FieldContent>
          </Field>
        )} />

        <form.Field
          name="email"
          validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Email is required' }}
          children={(field) => {
            const err = fieldError(field.state.meta.errors);
            return (
              <Field data-invalid={err ? 'true' : undefined}>
                <FieldLabel htmlFor={field.name}>Email <span className="text-destructive">*</span></FieldLabel>
                <FieldContent><Input id={field.name} type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} /></FieldContent>
                {err ? <FieldError>{err}</FieldError> : null}
              </Field>
            );
          }}
        />

        <form.Field name="activated" children={(field) => (
          <Field>
            <div className="flex items-center gap-2">
              <Checkbox id={field.name} checked={field.state.value} onCheckedChange={(v) => field.handleChange(!!v)} />
              <FieldLabel htmlFor={field.name} className="cursor-pointer font-normal">Activated</FieldLabel>
            </div>
          </Field>
        )} />

        {allAuthorities.length > 0 && (
          <form.Field name="authorities" children={(field) => (
            <Field>
              <FieldLabel>Roles</FieldLabel>
              <FieldContent>
                <div className="space-y-2">
                  {allAuthorities.map((auth) => (
                    <div key={auth} className="flex items-center gap-2">
                      <Checkbox
                        id={`auth-${auth}`}
                        checked={field.state.value.includes(auth)}
                        onCheckedChange={(v) => {
                          if (v) field.handleChange([...field.state.value, auth]);
                          else field.handleChange(field.state.value.filter((a) => a !== auth));
                        }}
                      />
                      <label htmlFor={`auth-${auth}`} className="text-sm cursor-pointer">{auth}</label>
                    </div>
                  ))}
                </div>
              </FieldContent>
            </Field>
          )} />
        )}
      </FieldGroup>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}</Button>
      </div>
    </form>
  );
}
