import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { secPermissionApi } from '@/api/security.api';
import type { SecPermission } from '@/model/security.types';

type Props = {
  open: boolean;
  roleName: string;
  onClose: () => void;
};

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
const EFFECTS = ['ALLOW', 'DENY'];
const TARGET_TYPES = ['ENTITY', 'ATTRIBUTE', 'MENU'];

export function ManagePermissionsDialog({ open, roleName, onClose }: Props) {
  const [permissions, setPermissions] = useState<SecPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTargetType, setNewTargetType] = useState('ENTITY');
  const [newTarget, setNewTarget] = useState('');
  const [newAction, setNewAction] = useState('READ');
  const [newEffect, setNewEffect] = useState('ALLOW');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && roleName) {
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roleName]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await secPermissionApi.listByRole(roleName);
      setPermissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await secPermissionApi.delete(id);
      setPermissions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await secPermissionApi.create({
        authorityName: roleName,
        targetType: newTargetType,
        target: newTarget.trim(),
        action: newAction,
        effect: newEffect,
      });
      setPermissions((prev) => [...prev, created]);
      setNewTarget('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage permissions — <span className="text-primary">{roleName}</span></DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        {/* Add permission form */}
        <form onSubmit={handleAdd} className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">Add permission</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Target Type</Label>
              <Select value={newTargetType} onValueChange={setNewTargetType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TARGET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-1">
              <Label className="text-xs">Target</Label>
              <Input className="h-8 text-xs" placeholder="e.g. Organization" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <Select value={newAction} onValueChange={setNewAction}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Effect</Label>
              <Select value={newEffect} onValueChange={setNewEffect}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{EFFECTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={adding}>{adding ? 'Adding…' : '+ Add'}</Button>
          </div>
        </form>

        {/* Permissions list */}
        <div className="mt-2">
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : permissions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No permissions defined for this role.</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {permissions.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-background px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-xs shrink-0">{p.targetType}</Badge>
                    <span className="text-sm font-medium truncate">{p.target}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{p.action}</Badge>
                    <Badge
                      className="text-xs shrink-0"
                      variant={p.effect === 'ALLOW' ? 'default' : 'destructive'}
                    >
                      {p.effect}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleting === p.id}
                    onClick={() => p.id !== undefined && handleDelete(p.id)}
                    aria-label="Delete permission"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
