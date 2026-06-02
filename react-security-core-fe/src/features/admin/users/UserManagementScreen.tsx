import { useState } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withSearch } from '@/shared/router/withSearch';
import { FormShell } from '@/shared/form/FormShell';
import { userManagementApi } from '@/api/user-management.api';
import { getUserByLoginKey, replaceUserInList } from './user-management.cache';
import { UserTable } from './list/UserTable';
import { UserEditForm, type UserFormValues } from './edit/UserEditForm';
import type { AdminUser } from '@/model/user.types';

export function UserManagementScreen() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500">Manage application users and their roles.</p>
      </header>
      <UserTable />
    </section>
  );
}

export function UserFormRoute({ mode }: { mode: 'create' | 'edit' }) {
  const { login } = useParams<{ login: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const close = () => navigate(withSearch('/admin/users', location.search));

  const itemQuery = useQuery({
    queryKey: login ? getUserByLoginKey(login) : ['admin', 'users', 'byLogin', '__none__'],
    queryFn: () => userManagementApi.getByLogin(login!),
    enabled: mode === 'edit' && !!login,
  });

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      userManagementApi.create({ ...values, langKey: 'en' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'list'] });
      close();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      userManagementApi.update({ ...values, id: itemQuery.data?.id ?? null }),
    onSuccess: (updated) => {
      replaceUserInList(queryClient, searchParams, updated);
      close();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : 'Failed'),
  });

  const handleSubmit = async (values: UserFormValues) => {
    setFormError(null);
    if (mode === 'create') await createMutation.mutateAsync(values);
    else await updateMutation.mutateAsync(values);
  };

  if (mode === 'edit' && login) {
    if (itemQuery.isLoading) return (
      <FormShell open presentation="fullscreen" title="Edit user" onClose={close}>
        <div className="py-6 text-center text-sm text-slate-500">Loading…</div>
      </FormShell>
    );
    if (itemQuery.isError || !itemQuery.data) return (
      <FormShell open presentation="fullscreen" title="Not found" onClose={close}>
        <div className="py-6 text-center text-sm text-red-600">User {login} could not be loaded.</div>
      </FormShell>
    );
  }

  const item: AdminUser | null = mode === 'create' ? null : itemQuery.data ?? null;

  return (
    <FormShell
      open
      presentation="fullscreen"
      title={mode === 'create' ? 'Create user' : `Edit ${login}`}
      onClose={close}
    >
      {formError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
      )}
      <UserEditForm
        mode={mode}
        item={item}
        onSubmit={handleSubmit}
        onCancel={close}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
    </FormShell>
  );
}
