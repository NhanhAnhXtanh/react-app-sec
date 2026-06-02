import { useState } from 'react';
import { ShieldCheck, Pencil, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/shared/form/ConfirmDialog';
import { secRoleApi } from '@/api/security.api';
import type { SecRole } from '@/model/security.types';
import { RoleDialog } from './RoleDialog';

export function RolesScreen() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<SecRole | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SecRole | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['admin', 'sec', 'roles'],
    queryFn: () => secRoleApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => secRoleApi.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sec', 'roles'] });
      setPendingDelete(null);
    },
  });

  const openCreate = () => {
    setEditRole(null);
    setDialogOpen(true);
  };

  const openEdit = (role: SecRole) => {
    setEditRole({ ...role });
    setDialogOpen(true);
  };

  const onSaved = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin', 'sec', 'roles'] });
  };

  const roles = rolesQuery.data ?? [];

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Security Roles</h1>
          <p className="text-sm text-slate-500">Manage roles and their permissions.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Create role
        </Button>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {rolesQuery.isLoading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {rolesQuery.isError && (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load roles: {rolesQuery.error instanceof Error ? rolesQuery.error.message : 'Unknown'}
          </div>
        )}
        {!rolesQuery.isLoading && !rolesQuery.isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Display Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No roles found.
                  </td>
                </tr>
              )}
              {roles.map((role) => (
                <tr key={role.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{role.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role.displayName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{role.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate(`/admin/security/roles/${encodeURIComponent(role.name)}/permissions`)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                        Permissions
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => openEdit(role)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDelete(role)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RoleDialog
        open={dialogOpen}
        role={editRole}
        onClose={() => setDialogOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete role"
        description={
          pendingDelete ? (
            <>Delete role <span className="font-medium text-foreground">{pendingDelete.name}</span>? This cannot be undone.</>
          ) : null
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.name)}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
