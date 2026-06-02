import { useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/shared/form/ConfirmDialog';
import { secMenuDefinitionApi } from '@/api/security.api';
import type { SecMenuDefinition } from '@/model/security.types';
import { MenuDefinitionDialog } from './MenuDefinitionDialog';
import { NAV_REGISTRY } from './nav-registry';

type TreeNode = {
  def: SecMenuDefinition;
  children: TreeNode[];
  depth: number;
};

function buildTree(items: SecMenuDefinition[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const d of items) {
    map.set(d.menuId, { def: d, children: [], depth: 0 });
  }
  const roots: TreeNode[] = [];
  for (const d of items) {
    const node = map.get(d.menuId)!;
    if (d.parentMenuId && map.has(d.parentMenuId)) {
      map.get(d.parentMenuId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (nodes: TreeNode[], depth = 0) => {
    nodes.sort((a, b) => (a.def.ordering ?? 0) - (b.def.ordering ?? 0));
    for (const n of nodes) { n.depth = depth; sort(n.children, depth + 1); }
  };
  sort(roots);
  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const visit = (ns: TreeNode[]) => { for (const n of ns) { result.push(n); visit(n.children); } };
  visit(nodes);
  return result;
}

export function MenuDefinitionsScreen() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDef, setEditDef] = useState<SecMenuDefinition | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SecMenuDefinition | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

  const defsQuery = useQuery({
    queryKey: ['admin', 'sec', 'menu-definitions'],
    queryFn: () => secMenuDefinitionApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => secMenuDefinitionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sec', 'menu-definitions'] });
      setPendingDelete(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => secMenuDefinitionApi.sync(NAV_REGISTRY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sec', 'menu-definitions'] });
      setSyncConfirmOpen(false);
    },
  });

  const onSaved = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin', 'sec', 'menu-definitions'] });
  };

  const defs = defsQuery.data ?? [];
  const tree = buildTree(defs);
  const flat = flattenTree(tree);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Definitions</h1>
          <p className="text-sm text-slate-500">Define and manage application navigation menu items.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSyncConfirmOpen(true)}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} aria-hidden />
            Sync from registry
          </Button>
          <Button type="button" onClick={() => { setEditDef(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Create
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {defsQuery.isLoading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {defsQuery.isError && (
          <div className="p-8 text-center text-sm text-destructive">
            Error: {defsQuery.error instanceof Error ? defsQuery.error.message : 'Unknown'}
          </div>
        )}
        {!defsQuery.isLoading && !defsQuery.isError && (
          <>
            {flat.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No menu definitions. Sync from registry or create one manually.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Label / Menu ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Route</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Icon</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Order</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flat.map(({ def, depth }) => (
                    <tr key={def.id ?? def.menuId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                          {depth > 0 && <ChevronRight className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{def.label}</div>
                            <div className="text-xs text-muted-foreground font-mono truncate">{def.menuId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                        {def.route ? (
                          <Badge variant="outline" className="font-mono text-xs">{def.route}</Badge>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell text-xs font-mono">
                        {def.icon ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{def.ordering}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditDef(def); setDialogOpen(true); }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setPendingDelete(def)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <MenuDefinitionDialog
        open={dialogOpen}
        definition={editDef}
        onClose={() => setDialogOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete menu definition"
        description={
          pendingDelete ? (
            <>Delete <span className="font-medium">{pendingDelete.label}</span> ({pendingDelete.menuId})?</>
          ) : null
        }
        confirmLabel="Delete"
        variant="danger"
        busy={deleteMutation.isPending}
        onConfirm={() => pendingDelete?.id !== undefined && deleteMutation.mutate(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={syncConfirmOpen}
        title="Sync from registry"
        description="This will seed any menu definitions from the application navigation registry that are not yet in the database. Existing entries will be skipped."
        confirmLabel="Sync"
        variant="default"
        busy={syncMutation.isPending}
        onConfirm={() => syncMutation.mutate()}
        onCancel={() => setSyncConfirmOpen(false)}
      />
    </section>
  );
}
