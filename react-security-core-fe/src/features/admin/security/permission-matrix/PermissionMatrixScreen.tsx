import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Loader2, ShieldCheck, Menu as MenuIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { secCatalogApi, secPermissionApi, secMenuDefinitionApi, secMenuPermissionApi } from '@/api/security.api';
import type { SecPermission, SecCatalogEntry, SecMenuDefinition, SecMenuPermissionAdmin } from '@/model/security.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type PermKey = string;
type PendingPermission = { type: 'grant'; perm: Omit<SecPermission, 'id'> } | { type: 'revoke'; id: number };
type MenuPermKey = string;
type PendingMenuPerm = { type: 'grant'; perm: Omit<SecMenuPermissionAdmin, 'id'> } | { type: 'revoke'; id: number };

function permKey(targetType: string, target: string, action: string): PermKey {
  return `${targetType}|${target}|${action}`;
}
function menuPermKey(appName: string, menuId: string): MenuPermKey {
  return `${appName}|${menuId}`;
}
function buildGrantedMap(perms: SecPermission[]): Map<PermKey, number> {
  const m = new Map<PermKey, number>();
  for (const p of perms) {
    if ((p.effect === 'ALLOW' || p.effect === 'GRANT') && p.id !== undefined) m.set(permKey(p.targetType, p.target, p.action), p.id);
  }
  return m;
}
function buildMenuGrantedMap(perms: SecMenuPermissionAdmin[]): Map<MenuPermKey, number> {
  const m = new Map<MenuPermKey, number>();
  for (const p of perms) {
    if (p.effect === 'ALLOW' && p.id !== undefined) m.set(menuPermKey(p.appName, p.menuId), p.id);
  }
  return m;
}

// ─── Op colors ────────────────────────────────────────────────────────────────

const OP_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  READ:   'bg-blue-50 text-blue-700 border-blue-200',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  VIEW:   'bg-sky-50 text-sky-700 border-sky-200',
  EDIT:   'bg-violet-50 text-violet-700 border-violet-200',
};
function opColor(op: string) {
  return OP_COLORS[op] ?? 'bg-slate-50 text-slate-700 border-slate-200';
}

// ─── Checkbox cell ─────────────────────────────────────────────────────────────

function PermCheckbox({
  checked, hasPending, color = 'blue', onChange,
}: {
  checked: boolean; hasPending: boolean; color?: 'blue' | 'emerald'; onChange: () => void;
}) {
  const activeColor = color === 'emerald' ? 'border-emerald-500 bg-emerald-500' : 'border-blue-500 bg-blue-500';
  return (
    <div className="flex justify-center">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className={`h-[18px] w-[18px] rounded-[4px] border-2 transition-all ${
          hasPending
            ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
            : checked
            ? activeColor
            : 'border-slate-300 hover:border-slate-400'
        }`}
      />
    </div>
  );
}

// ─── Combined Entity + Attribute Tab ─────────────────────────────────────────

const ATTR_OPS = ['VIEW', 'EDIT'];

type EntityAttrTabProps = {
  roleName: string;
  catalog: SecCatalogEntry[];
  granted: Map<PermKey, number>;
  pending: Map<PermKey, PendingPermission>;
  onToggle: (targetType: string, target: string, action: string) => void;
};

function EntityAttributeTab({ catalog, granted, pending, onToggle }: EntityAttrTabProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const entityOps = useMemo(() => {
    const ops = new Set<string>();
    for (const e of catalog) e.operations.forEach((op) => ops.add(op));
    return [...ops].sort();
  }, [catalog]);

  function isEntityGranted(target: string, action: string): boolean {
    const key = permKey('ENTITY', target, action);
    const p = pending.get(key);
    if (p) return p.type === 'grant';
    if (granted.has(key)) return true;
    // inherit from wildcard * if target is a specific entity
    if (target !== '*') {
      const wildcardKey = permKey('ENTITY', '*', action);
      const wp = pending.get(wildcardKey);
      if (wp) return wp.type === 'grant';
      if (granted.has(wildcardKey)) return true;
    }
    return false;
  }
  function isEntityPending(target: string, action: string) {
    return pending.has(permKey('ENTITY', target, action));
  }
  function isAttrGranted(target: string, action: string): boolean {
    const key = permKey('ATTRIBUTE', target, action);
    const p = pending.get(key);
    if (p) return p.type === 'grant';
    if (granted.has(key)) return true;
    // inherit from wildcard: e.g. target = "Department.code" → check "Department.*"
    const parts = target.split('.');
    if (parts.length === 2) {
      const wildcardTarget = `${parts[0]}.*`;
      const wildcardKey = permKey('ATTRIBUTE', wildcardTarget, action);
      const wp = pending.get(wildcardKey);
      if (wp) return wp.type === 'grant';
      if (granted.has(wildcardKey)) return true;
    }
    return false;
  }
  function isAttrPending(target: string, action: string) {
    return pending.has(permKey('ATTRIBUTE', target, action));
  }

  function toggleExpand(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  // total cols = 1 (entity name) + entityOps + ATTR_OPS
  const totalCols = 1 + entityOps.length + ATTR_OPS.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-3 px-4 text-left font-semibold text-slate-600 w-64">Entity</th>
            {/* Entity ops group */}
            {entityOps.map((op) => (
              <th key={op} className="py-3 px-4 text-center font-semibold text-slate-600 min-w-[90px]">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${opColor(op)}`}>
                  {op}
                </span>
              </th>
            ))}
            {/* Divider */}
            <th className="w-px bg-slate-200 p-0" />
            {/* Attribute ops group */}
            {ATTR_OPS.map((op) => (
              <th key={op} className="py-3 px-4 text-center font-semibold text-slate-500 min-w-[80px]">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${opColor(op)}`}>
                  {op}
                </span>
              </th>
            ))}
          </tr>
          {/* Sub-header labels */}
          <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest">
            <td className="px-4 py-1" />
            <td colSpan={entityOps.length} className="px-4 py-1 text-center font-semibold">Entity operations</td>
            <td className="w-px bg-slate-200 p-0" />
            <td colSpan={ATTR_OPS.length} className="px-4 py-1 text-center font-semibold">Attribute access</td>
          </tr>
        </thead>
        <tbody>
          {/* Wildcard entity row */}
          <tr className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 hover:from-blue-100/80 transition-colors">
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">*</span>
                <span className="text-sm font-semibold text-blue-700">All entities</span>
              </div>
            </td>
            {entityOps.map((op) => (
              <td key={op} className="py-3 px-4 text-center">
                <PermCheckbox
                  checked={isEntityGranted('*', op)}
                  hasPending={isEntityPending('*', op)}
                  onChange={() => onToggle('ENTITY', '*', op)}
                />
              </td>
            ))}
            <td className="w-px bg-slate-100 p-0" />
            {ATTR_OPS.map((op) => (
              <td key={op} className="py-3 px-4 text-center">
                <span className="text-slate-200">—</span>
              </td>
            ))}
          </tr>

          {catalog.map((entry, i) => {
            const hasAttrs = entry.attributes.length > 0;
            const isOpen = expanded.has(entry.code);
            const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

            return (
              <>
                {/* Entity row */}
                <tr
                  key={entry.code}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${rowBg} ${isOpen ? 'border-b-0' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {hasAttrs ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(entry.code)}
                          className="flex items-center justify-center h-5 w-5 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600 shrink-0"
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800">{entry.displayName || entry.code}</span>
                      {entry.displayName && (
                        <span className="font-mono text-xs text-slate-400">{entry.code}</span>
                      )}
                    </div>
                  </td>
                  {entityOps.map((op) => {
                    const hasOp = entry.operations.includes(op);
                    return (
                      <td key={op} className="py-3 px-4 text-center">
                        {hasOp ? (
                          <PermCheckbox
                            checked={isEntityGranted(entry.code, op)}
                            hasPending={isEntityPending(entry.code, op)}
                            onChange={() => onToggle('ENTITY', entry.code, op)}
                          />
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="w-px bg-slate-100 p-0" />
                  {ATTR_OPS.map((op) => (
                    <td key={op} className="py-3 px-4 text-center">
                      {hasAttrs ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(entry.code)}
                          className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          {isOpen ? 'collapse' : `${entry.attributes.length} attrs`}
                        </button>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Expanded attribute rows */}
                {isOpen && hasAttrs && (
                  <>
                    {/* Wildcard attribute row */}
                    <tr className={`border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-sky-50/30 ${rowBg}`}>
                      <td className="py-2.5 px-4 pl-10">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-[10px] font-bold shrink-0">*</span>
                          <span className="text-xs font-semibold text-violet-700 italic">All attributes</span>
                        </div>
                      </td>
                      {entityOps.map((op) => (
                        <td key={op} className="py-2.5 px-4 text-center">
                          <span className="text-slate-200">—</span>
                        </td>
                      ))}
                      <td className="w-px bg-slate-100 p-0" />
                      {ATTR_OPS.map((op) => {
                        const target = `${entry.code}.*`;
                        return (
                          <td key={op} className="py-2.5 px-4 text-center">
                            <PermCheckbox
                              checked={isAttrGranted(target, op)}
                              hasPending={isAttrPending(target, op)}
                              color="emerald"
                              onChange={() => onToggle('ATTRIBUTE', target, op)}
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Individual attribute rows */}
                    {entry.attributes.map((attr, ai) => (
                      <tr
                        key={attr}
                        className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${
                          ai % 2 === 0 ? 'bg-slate-50/20' : 'bg-white/60'
                        } ${ai === entry.attributes.length - 1 ? 'border-b-2 border-slate-200' : ''}`}
                      >
                        <td className="py-2 px-4 pl-14">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 text-xs">└</span>
                            <span className="font-mono text-xs text-slate-600">{attr}</span>
                          </div>
                        </td>
                        {entityOps.map((op) => (
                          <td key={op} className="py-2 px-4 text-center">
                            <span className="text-slate-200">—</span>
                          </td>
                        ))}
                        <td className="w-px bg-slate-100 p-0" />
                        {ATTR_OPS.map((op) => {
                          const target = `${entry.code}.${attr}`;
                          return (
                            <td key={op} className="py-2 px-4 text-center">
                              <PermCheckbox
                                checked={isAttrGranted(target, op)}
                                hasPending={isAttrPending(target, op)}
                                color="emerald"
                                onChange={() => onToggle('ATTRIBUTE', target, op)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </>
            );
          })}
        </tbody>
        {/* Footer note */}
        <tfoot>
          <tr className="bg-slate-50/50 border-t border-slate-100">
            <td colSpan={totalCols + 1} className="px-4 py-2">
              <p className="text-[11px] text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1 align-middle" />
                Yellow ring = unsaved change · Click <ChevronRight className="inline h-3 w-3" /> to expand attribute permissions
              </p>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Menu Access Tab ──────────────────────────────────────────────────────────

type MenuNode = SecMenuDefinition & { children: MenuNode[]; depth: number };

function buildMenuTree(defs: SecMenuDefinition[]): MenuNode[] {
  const map = new Map<string, MenuNode>();
  for (const d of defs) map.set(d.menuId, { ...d, children: [], depth: 0 });
  const roots: MenuNode[] = [];
  for (const node of map.values()) {
    if (node.parentMenuId && map.has(node.parentMenuId)) {
      map.get(node.parentMenuId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  function assignDepth(nodes: MenuNode[], depth: number) {
    for (const n of nodes) { n.depth = depth; assignDepth(n.children, depth + 1); }
  }
  assignDepth(roots, 0);
  function flatten(nodes: MenuNode[]): MenuNode[] {
    const result: MenuNode[] = [];
    for (const n of [...nodes].sort((a, b) => a.ordering - b.ordering)) {
      result.push(n); result.push(...flatten(n.children));
    }
    return result;
  }
  return flatten(roots);
}

type MenuTabProps = {
  menuDefs: SecMenuDefinition[];
  menuGranted: Map<MenuPermKey, number>;
  menuPending: Map<MenuPermKey, PendingMenuPerm>;
  onToggle: (appName: string, menuId: string) => void;
};

function MenuAccessTab({ menuDefs, menuGranted, menuPending, onToggle }: MenuTabProps) {
  const flat = useMemo(() => buildMenuTree(menuDefs), [menuDefs]);

  function isGranted(appName: string, menuId: string): boolean {
    const key = menuPermKey(appName, menuId);
    const p = menuPending.get(key);
    if (p) return p.type === 'grant';
    return menuGranted.has(key);
  }
  function isPending(appName: string, menuId: string) {
    return menuPending.has(menuPermKey(appName, menuId));
  }

  if (flat.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
        <MenuIcon className="h-8 w-8 opacity-30" />
        <p className="text-sm">No menu definitions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-3 px-4 text-left font-semibold text-slate-600">Menu Item</th>
            <th className="py-3 px-4 text-left font-semibold text-slate-400 text-xs">Route</th>
            <th className="py-3 px-4 text-center font-semibold text-slate-600 w-24">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">ALLOW</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {flat.map((node, i) => {
            const checked = isGranted(node.appName, node.menuId);
            const hasPending = isPending(node.appName, node.menuId);
            const isRoot = node.depth === 0;
            return (
              <tr
                key={`${node.appName}|${node.menuId}`}
                className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${
                  isRoot ? 'bg-slate-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center" style={{ paddingLeft: `${node.depth * 24}px` }}>
                    {node.depth > 0 && <span className="mr-2 text-slate-300 text-xs">└─</span>}
                    <span className={isRoot ? 'font-semibold text-slate-800' : 'text-slate-700'}>{node.label}</span>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">{node.menuId}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-400">{node.route ?? '—'}</td>
                <td className="py-3 px-4 text-center">
                  <PermCheckbox
                    checked={checked}
                    hasPending={hasPending}
                    color="emerald"
                    onChange={() => onToggle(node.appName, node.menuId)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PermissionMatrixScreen() {
  const { name: roleName = '' } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: catalog = [], isLoading: loadingCatalog } = useQuery({
    queryKey: ['sec-catalog'],
    queryFn: () => secCatalogApi.list(),
  });
  const { data: perms = [], isLoading: loadingPerms } = useQuery({
    queryKey: ['sec-permissions', roleName],
    queryFn: () => secPermissionApi.listByRole(roleName),
    enabled: !!roleName,
  });
  const { data: menuDefs = [], isLoading: loadingMenuDefs } = useQuery({
    queryKey: ['sec-menu-defs-all'],
    queryFn: () => secMenuDefinitionApi.listAll(),
  });
  const { data: menuPerms = [], isLoading: loadingMenuPerms } = useQuery({
    queryKey: ['sec-menu-perms', roleName],
    queryFn: () => secMenuPermissionApi.listByRole(roleName),
    enabled: !!roleName,
  });

  const [pendingPerms, setPendingPerms] = useState<Map<PermKey, PendingPermission>>(new Map());
  const [pendingMenuPerms, setPendingMenuPerms] = useState<Map<MenuPermKey, PendingMenuPerm>>(new Map());

  const granted = useMemo(() => buildGrantedMap(perms), [perms]);
  const menuGranted = useMemo(() => buildMenuGrantedMap(menuPerms), [menuPerms]);

  const totalPending = pendingPerms.size + pendingMenuPerms.size;
  const hasPending = totalPending > 0;

  function togglePerm(targetType: string, target: string, action: string) {
    const key = permKey(targetType, target, action);
    setPendingPerms((prev) => {
      const next = new Map(prev);
      if (next.has(key)) { next.delete(key); return next; }
      const grantedId = granted.get(key);
      if (grantedId !== undefined) {
        next.set(key, { type: 'revoke', id: grantedId });
      } else {
        next.set(key, { type: 'grant', perm: { authorityName: roleName, targetType, target, action, effect: 'ALLOW' } });
      }
      return next;
    });
  }

  function toggleMenuPerm(appName: string, menuId: string) {
    const key = menuPermKey(appName, menuId);
    setPendingMenuPerms((prev) => {
      const next = new Map(prev);
      if (next.has(key)) { next.delete(key); return next; }
      const grantedId = menuGranted.get(key);
      if (grantedId !== undefined) {
        next.set(key, { type: 'revoke', id: grantedId });
      } else {
        next.set(key, { type: 'grant', perm: { role: roleName, appName, menuId, effect: 'ALLOW' } });
      }
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const permOps = [...pendingPerms.values()].map((p) =>
        p.type === 'grant' ? secPermissionApi.create(p.perm as SecPermission) : secPermissionApi.delete(p.id),
      );
      const menuOps = [...pendingMenuPerms.values()].map((p) =>
        p.type === 'grant' ? secMenuPermissionApi.create(p.perm as SecMenuPermissionAdmin) : secMenuPermissionApi.delete(p.id),
      );
      await Promise.all([...permOps, ...menuOps]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sec-permissions', roleName] });
      qc.invalidateQueries({ queryKey: ['sec-menu-perms', roleName] });
      setPendingPerms(new Map());
      setPendingMenuPerms(new Map());
    },
  });

  const isLoading = loadingCatalog || loadingPerms || loadingMenuDefs || loadingMenuPerms;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/security/roles')}
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Permission Matrix</h1>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Role:</span>
                <code className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{roleName}</code>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {hasPending && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700">
                  {totalPending} unsaved {totalPending === 1 ? 'change' : 'changes'}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPending || saveMutation.isPending}
              onClick={() => { setPendingPerms(new Map()); setPendingMenuPerms(new Map()); }}
              className="h-9 gap-1.5 border-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!hasPending || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading permissions…</p>
          </div>
        ) : (
          <Tabs defaultValue="entity" className="w-full">
            <TabsList className="h-12 bg-white border border-slate-200 shadow-sm p-1.5 gap-1.5 rounded-xl mb-4 w-auto inline-flex">
              <TabsTrigger
                value="entity"
                className="group flex-none rounded-lg gap-2 data-active:!bg-blue-600 data-active:!text-white data-active:!shadow-md px-6 py-2 text-sm font-medium"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Entity Permissions
                {catalog.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold bg-slate-100 text-slate-600 group-data-active:bg-blue-500 group-data-active:text-white transition-colors">
                    {catalog.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="menu"
                className="group flex-none rounded-lg gap-2 data-active:!bg-blue-600 data-active:!text-white data-active:!shadow-md px-6 py-2 text-sm font-medium"
              >
                <MenuIcon className="h-3.5 w-3.5" />
                Menu Access
                {menuDefs.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold bg-slate-100 text-slate-600 group-data-active:bg-blue-500 group-data-active:text-white transition-colors">
                    {menuDefs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entity" className="mt-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Grant entity-level CRUD operations. Click <ChevronRight className="inline h-3 w-3" /> on any row to expand attribute-level permissions.
                  </p>
                </div>
                <EntityAttributeTab
                  roleName={roleName}
                  catalog={catalog}
                  granted={granted}
                  pending={pendingPerms}
                  onToggle={togglePerm}
                />
              </div>
            </TabsContent>

            <TabsContent value="menu" className="mt-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-500">Choose which menu items this role can access in the navigation.</p>
                </div>
                <MenuAccessTab menuDefs={menuDefs} menuGranted={menuGranted} menuPending={pendingMenuPerms} onToggle={toggleMenuPerm} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {saveMutation.isError && (
          <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <X className="h-4 w-4 shrink-0" />
            Failed to save changes. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
