import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { secRoleApi } from '@/api/security.api';
import type { SecRole } from '@/model/security.types';

type Props = {
  open: boolean;
  role: SecRole | null;
  onClose: () => void;
  onSaved: () => void;
};

export function RoleDialog({ open, role, onClose, onSaved }: Props) {
  const isEdit = role !== null;
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '');
      setDisplayName(role?.displayName ?? '');
      setError(null);
    }
  }, [open, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: SecRole = { name: name.trim(), displayName: displayName.trim() || undefined, type: 'RESOURCE' };
      if (isEdit) await secRoleApi.update(payload);
      else await secRoleApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit role' : 'Create role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
              placeholder="e.g. ROLE_ACCOUNTANT"
              maxLength={50}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-display">Display Name</Label>
            <Input
              id="role-display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Accountant"
              maxLength={255}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Input value="RESOURCE" disabled />
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
