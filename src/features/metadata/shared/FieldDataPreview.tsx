import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Database,
  Filter,
  Key,
  Layout,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FieldItem } from '@/model/metasync.types';

type Props = {
  value?: string | null;
};

type FieldFilter = 'all' | 'pk' | 'nullable' | 'required';
type FieldGroup = {
  table: string;
  fields: FieldItem[];
};

const TABLE_MARKER_DATA_TYPE = '__TABLE__';

const FIELD_FILTERS: Array<{ key: FieldFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pk', label: 'Primary key' },
  { key: 'required', label: 'NOT NULL' },
  { key: 'nullable', label: 'NULL' },
];

export function FieldDataPreview({ value }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FieldFilter>('all');

  const parsed = useMemo(() => (value ? parseFieldData(value) : null), [value]);

  const filteredFields = useMemo(() => {
    if (!parsed?.ok) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return parsed.fields.filter((field) => {
      const tableMarker = isTableMarker(field);
      if (tableMarker && filter !== 'all') return false;
      if (filter === 'pk' && !field.isPrimaryKey) return false;
      if (filter === 'nullable' && !field.isNull) return false;
      if (filter === 'required' && field.isNull) return false;
      if (!normalizedQuery) return true;
      return [
        field.name,
        field.code,
        field.dataType,
        field.path,
        tableName(field),
        field.description,
        field.comment,
      ].some((text) => text?.toLowerCase().includes(normalizedQuery));
    });
  }, [filter, parsed, query]);

  const fieldGroups = useMemo(
    () => groupFieldsByTable(filteredFields),
    [filteredFields],
  );

  if (!value) return <span className="text-muted-foreground">—</span>;

  if (!parsed?.ok) {
    return (
      <div className="min-w-0 space-y-2">
        <Badge variant="destructive">JSON không hợp lệ</Badge>
        <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
          {value}
        </pre>
      </div>
    );
  }

  if (parsed.fields.length === 0) {
    return <span className="text-muted-foreground">Không có field.</span>;
  }

  const realFields = parsed.fields.filter((field) => !isTableMarker(field));
  const primaryKeys = realFields.filter((field) => field.isPrimaryKey).length;
  const nullableFields = realFields.filter((field) => field.isNull).length;
  const requiredFields = realFields.length - nullableFields;
  const tableCount = new Set(parsed.fields.map((field) => tableName(field)).filter(Boolean)).size;

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Tổng số Fields" value={realFields.length} icon={<Database className="h-3 w-3" />} />
        <Metric label="Số lượng Tables" value={tableCount || '—'} icon={<Layout className="h-3 w-3" />} />
        <Metric label="Primary Keys" value={primaryKeys} icon={<Key className="h-3 w-3" />} />
        <Metric label="Bắt buộc" value={requiredFields} icon={<ShieldCheck className="h-3 w-3" />} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 lg:flex-row lg:items-center shadow-sm">
        <div className="relative flex-1 lg:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên field, kiểu dữ liệu, comment..."
            className="h-9 pl-9 border-slate-200 bg-white rounded-lg focus-visible:ring-primary/20 text-sm font-medium"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/50">
          {FIELD_FILTERS.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={filter === item.key ? 'default' : 'ghost'}
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === item.key ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] lg:ml-auto bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          Hiển thị: {filteredFields.filter((field) => !isTableMarker(field)).length} / {realFields.length}
        </div>
      </div>

      <div className="max-h-[min(65dvh,45rem)] w-full min-w-0 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/20 custom-scrollbar">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
            <tr>
              <th className="w-[32%] px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Field / Path</th>
              <th className="w-[18%] px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Data Type</th>
              <th className="w-[12%] px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Nullable</th>
              <th className="w-[10%] px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Key</th>
              <th className="w-[28%] px-6 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Comment / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFields.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Filter className="h-10 w-10" />
                    <span className="text-xs font-bold uppercase tracking-[0.25em]">Không có field phù hợp</span>
                  </div>
                </td>
              </tr>
            ) : (
              fieldGroups.map((group) => (
                <TableFieldGroup key={group.table} group={group} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableFieldGroup({ group }: { group: FieldGroup }) {
  const [isOpen, setIsOpen] = useState(true);
  const pkCount = group.fields.filter((field) => field.isPrimaryKey).length;
  const requiredCount = group.fields.filter((field) => !field.isNull).length;

  return (
    <>
      <tr className="bg-slate-50/30 group">
        <td colSpan={5} className="p-0 border-b border-slate-100">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-all hover:bg-slate-100/50"
            onClick={() => setIsOpen((current) => !current)}
          >
            <div className={`flex items-center justify-center h-6 w-6 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:text-primary transition-all ${isOpen ? 'rotate-90 text-primary' : ''}`}>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] shadow-lg shadow-slate-900/20">
                <Layout className="h-3 w-3" />
              </span>
              <span className="font-bold text-sm text-slate-900 tracking-tight">{group.table}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className="text-[9px] font-bold bg-white border-slate-200 text-slate-400 h-5 px-2">
                COLUMNS: {group.fields.length}
              </Badge>
              {pkCount > 0 && <Badge variant="secondary" className="text-[9px] font-bold bg-amber-50 text-amber-600 border-amber-100 h-5 px-2">{pkCount} PK</Badge>}
              {requiredCount > 0 && <Badge variant="secondary" className="text-[9px] font-bold bg-blue-50 text-blue-600 border-blue-100 h-5 px-2">{requiredCount} NOT NULL</Badge>}
            </div>
          </button>
        </td>
      </tr>
      {isOpen && group.fields.length === 0 && (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-xs font-bold text-slate-300 uppercase tracking-widest italic">
            Table này chưa có cấu trúc field.
          </td>
        </tr>
      )}
      {isOpen &&
        group.fields.map((field, index) => (
          <tr
            key={field.id || field.path || `${group.table}-${field.name}-${index}`}
            className="hover:bg-slate-50/50 transition-colors"
          >
            <td className="px-6 py-4 align-top">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors shrink-0" />
                <div className="min-w-0">
                  <div className="break-words font-bold text-sm text-slate-800 tracking-tight mb-1">
                    {columnName(field)}
                  </div>
                  {field.path && (
                    <div className="break-words font-mono text-[10px] text-slate-400 font-medium">
                      {field.path}
                    </div>
                  )}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 align-top">
              <span className="font-bold font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {field.dataType || '—'}
              </span>
            </td>
            <td className="px-6 py-4 align-top">
              <Badge variant={field.isNull ? 'outline' : 'secondary'} className={`text-[9px] font-bold h-5 px-2 ${field.isNull ? 'border-slate-200 text-slate-400' : 'bg-slate-900 text-white border-slate-900'}`}>
                {field.isNull ? 'NULLABLE' : 'REQUIRED'}
              </Badge>
            </td>
            <td className="px-6 py-4 align-top">
              {field.isPrimaryKey ? (
                <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                  <Key className="h-3 w-3" /> PK
                </div>
              ) : <span className="text-slate-300 text-[10px]">—</span>}
            </td>
            <td className="px-6 py-4 align-top text-xs text-slate-500 leading-relaxed font-medium">
              {field.comment || field.description || '—'}
            </td>
          </tr>
        ))}
    </>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tighter">{value}</div>
    </div>
  );
}

function tableName(field: FieldItem) {
  if (isTableMarker(field)) return field.path || field.name || field.code || '';
  if (field.path_parent) return field.path_parent;
  if (!field.path) return '';
  const parts = field.path.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : '';
}

function columnName(field: FieldItem) {
  if (field.name) return field.name;
  if (!field.path) return '—';
  const parts = field.path.split('.');
  return parts[parts.length - 1] || '—';
}

function groupFieldsByTable(fields: FieldItem[]): FieldGroup[] {
  const groups = new Map<string, FieldItem[]>();
  for (const field of fields) {
    const key = tableName(field) || 'Không rõ bảng';
    if (isTableMarker(field)) {
      if (!groups.has(key)) groups.set(key, []);
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(field);
    groups.set(key, group);
  }
  return Array.from(groups.entries()).map(([table, groupFields]) => ({
    table,
    fields: groupFields,
  }));
}

function isTableMarker(field: FieldItem) {
  return field.dataType === TABLE_MARKER_DATA_TYPE;
}

function parseFieldData(value: string):
  | { ok: true; fields: FieldItem[] }
  | { ok: false } {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return { ok: false };
    return { ok: true, fields: parsed as FieldItem[] };
  } catch {
    return { ok: false };
  }
}
