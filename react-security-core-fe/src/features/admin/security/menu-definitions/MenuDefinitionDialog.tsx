import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { secMenuDefinitionApi } from '@/api/security.api';
import type { SecMenuDefinition } from '@/model/security.types';

type Props = {
  open: boolean;
  definition: SecMenuDefinition | null;
  onClose: () => void;
  onSaved: () => void;
};

const DEFAULT_APP = 'security-core';

function defaults(def: SecMenuDefinition | null): Omit<SecMenuDefinition, 'id'> {
  return {
    menuId: def?.menuId ?? '',
    appName: def?.appName ?? DEFAULT_APP,
    menuName: def?.menuName ?? '',
    label: def?.label ?? '',
    description: def?.description ?? '',
    parentMenuId: def?.parentMenuId ?? '',
    route: def?.route ?? '',
    icon: def?.icon ?? '',
    ordering: def?.ordering ?? 0,
  };
}

export function MenuDefinitionDialog({ open, definition, onClose, onSaved }: Props) {
  const isEdit = definition !== null;
  const [form, setForm] = useState(defaults(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(defaults(definition));
      setError(null);
    }
  }, [open, definition]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.menuId.trim()) { setError('Menu ID is required'); return; }
    if (!form.label.trim()) { setError('Label is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: SecMenuDefinition = {
        ...form,
        menuName: form.menuName || form.menuId,
        parentMenuId: form.parentMenuId?.trim() || undefined,
        route: form.route?.trim() || undefined,
        icon: form.icon?.trim() || undefined,
        description: form.description?.trim() || undefined,
        ordering: Number(form.ordering) || 0,
      };
      if (isEdit && definition?.id !== undefined) {
        await secMenuDefinitionApi.update(definition.id, payload);
      } else {
        await secMenuDefinitionApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit menu definition' : 'Create menu definition'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="md-menuId">Menu ID <span className="text-destructive">*</span></Label>
            <Input id="md-menuId" value={form.menuId} onChange={set('menuId')} disabled={isEdit} placeholder="e.g. security.menu-definitions" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-menuName">Menu Name <span className="text-destructive">*</span></Label>
            <Input id="md-menuName" value={form.menuName} onChange={set('menuName')} placeholder="e.g. Menu Definitions" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-label">Label <span className="text-destructive">*</span></Label>
            <Input id="md-label" value={form.label} onChange={set('label')} placeholder="Display label" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-appName">App Name</Label>
            <Input id="md-appName" value={form.appName} onChange={set('appName')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-parentMenuId">Parent Menu ID</Label>
            <Input id="md-parentMenuId" value={form.parentMenuId ?? ''} onChange={set('parentMenuId')} placeholder="Leave empty for top-level" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-route">Route</Label>
            <Input id="md-route" value={form.route ?? ''} onChange={set('route')} placeholder="e.g. /admin/security/roles" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-icon">Icon</Label>
            <Input id="md-icon" value={form.icon ?? ''} onChange={set('icon')} placeholder="e.g. pi pi-shield" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="md-ordering">Ordering</Label>
            <Input id="md-ordering" type="number" value={form.ordering} onChange={set('ordering')} />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
