import { useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, Key, Trash2, Database, Link } from 'lucide-react';
import { MetaPackVersionItemDto } from '../../types/metapack';

export type MetaSetNodeData = {
    item: MetaPackVersionItemDto;
    onConfigureFields: (id: string) => void;
    onDelete: (id: string) => void;
    disabled?: boolean;
};

const TYPE_COLOR: Record<string, string> = {
    STRING: 'text-emerald-600',
    VARCHAR: 'text-emerald-600',
    TEXT: 'text-emerald-600',
    LONG: 'text-blue-600',
    INTEGER: 'text-blue-600',
    INT: 'text-blue-600',
    BIGINT: 'text-blue-600',
    DOUBLE: 'text-blue-600',
    FLOAT: 'text-blue-600',
    DECIMAL: 'text-blue-600',
    BOOLEAN: 'text-amber-600',
    BOOL: 'text-amber-600',
    DATE: 'text-indigo-600',
    DATETIME: 'text-indigo-600',
    TIMESTAMP: 'text-indigo-600',
    UUID: 'text-rose-600',
    JSON: 'text-orange-600',
    OBJECT: 'text-orange-600',
    ARRAY: 'text-purple-600',
};

function getTypeColor(dataType: string): string {
    const key = (dataType || '').toUpperCase().split('(')[0].trim();
    return TYPE_COLOR[key] ?? 'text-slate-500';
}

export function MetaSetNode({ id, data }: NodeProps) {
    const { item, onConfigureFields, onDelete, disabled } = data as MetaSetNodeData;
    const [expanded, setExpanded] = useState(true);
    const toggleExpand = useCallback(() => setExpanded(p => !p), []);
    const fields = item.selectedFields ?? [];
    const hasFields = fields.length > 0;

    return (
        <div 
            style={{ width: 280 }} 
            className="rounded-xl overflow-visible border border-slate-200 bg-white text-slate-700 text-sm font-sans shadow-xl shadow-slate-200/40"
        >
            {/* ── Header ── */}
            <button
                type="button"
                className="nodrag nopan w-full flex items-center gap-2 px-3 py-3 font-bold text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
                style={{ background: '#f8fafc' }}
                onClick={toggleExpand}
            >
                {expanded
                    ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
                    : <ChevronRight size={14} className="shrink-0 text-slate-400" />
                }
                
                <Database size={13} className="shrink-0 text-primary" />
                
                <span className="flex-1 truncate text-slate-800 font-extrabold tracking-tight">
                    {item.endpointAlias || item.metaCode || 'New MetaSet'}
                </span>

                <span className="bg-primary/10 text-[9px] font-black text-primary uppercase tracking-widest px-1.5 py-0.5 rounded border border-primary/20">
                    {item.returnType || 'ARRAY'}
                </span>
            </button>

            {/* ── Field rows ── */}
            {expanded && (
                <div className="bg-white">
                    {hasFields ? (
                        fields.map((field, idx) => {
                            const isPk = field.fieldName?.toLowerCase() === 'id' || (field as any).isPrimaryKey;
                            const isVirtual = (field as any).isVirtual || field.type === 'ARRAY' || field.type === 'OBJECT';
                            const dataType = field.type || (field as any).dataType || 'STRING';

                            return (
                                <div
                                    key={idx}
                                    className={`group/field flex items-center gap-2 py-2 px-3 border-t border-slate-50 transition-colors ${
                                        isVirtual ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/50'
                                    }`}
                                    style={{ position: 'relative' }}
                                >
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id={`target-${field.fieldName}`}
                                        className="!w-4 !h-4 !bg-white !border-2 !border-slate-300 opacity-0 group-hover/field:opacity-100 hover:!bg-primary hover:!border-primary hover:!scale-125 transition-all shadow-md"
                                        style={{ left: -8 }}
                                    />
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary opacity-0 shadow-sm ring-1 ring-primary/10 transition-opacity group-hover/field:opacity-100">
                                        In
                                    </span>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={`source-${field.fieldName}`}
                                        className="!w-4 !h-4 !bg-white !border-2 !border-primary/50 opacity-0 group-hover/field:opacity-100 hover:!bg-primary hover:!border-primary hover:!scale-125 transition-all shadow-md"
                                        style={{ right: -8 }}
                                    />
                                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-primary opacity-0 shadow-sm ring-1 ring-primary/10 transition-opacity group-hover/field:opacity-100">
                                        Nối
                                    </span>

                                    {isVirtual ? (
                                        <Link size={12} className="shrink-0 text-indigo-500" />
                                    ) : isPk ? (
                                        <Key size={12} className="shrink-0 text-amber-500" />
                                    ) : (
                                        <span className="w-3 shrink-0" />
                                    )}

                                    <span className={`flex-1 truncate text-[12px] ${isVirtual ? 'text-indigo-700 font-bold' : 'text-slate-600 font-medium'}`}>
                                        {field.alias || field.fieldName}
                                    </span>

                                    <span className={`text-[10px] shrink-0 font-bold uppercase tracking-tighter ${getTypeColor(dataType)}`}>
                                        {dataType.split('(')[0]}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <button
                            type="button"
                            className="nodrag nopan w-full px-3 py-6 text-slate-400 text-[11px] font-bold hover:text-primary hover:bg-primary/5 transition-all text-center border-t border-slate-50"
                            onClick={() => onConfigureFields(id)}
                            disabled={!item.metaCode || disabled}
                        >
                            + Thiết lập dữ liệu
                        </button>
                    )}
                </div>
            )}
            {/* ── Footer ── */}
            {!disabled && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-1 flex justify-end">
                    <button
                        type="button"
                        className="nodrag nopan p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                        title="Xóa node"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            )}

        </div>
    );
}
