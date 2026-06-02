import { memo, useState, useEffect, useMemo } from 'react';
import { 
    EdgeProps, 
    useReactFlow, 
    Position, 
    getSmoothStepPath, 
    Edge,
    BaseEdge
} from '@xyflow/react';
import { MoreVertical, Trash2, Check, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type RelationshipType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE';
export type RelationshipReturnType = 'ARRAY' | 'OBJECT';

export interface MetaPackRelationshipEdgeData {
    relationType?: RelationshipType;
    returnType?: RelationshipReturnType;
    parentField?: string;
    childField?: string;
    relationField?: string;
    autoOpenConfig?: boolean;
    isDraft?: boolean;
    [key: string]: unknown;
}

type FieldOption = {
    fieldName: string;
    alias?: string;
    type?: string;
    isVirtual?: boolean;
};

const getFieldOptions = (node: any, currentField?: string): FieldOption[] => {
    const fields = (node?.data?.item?.selectedFields || []) as FieldOption[];
    const regularFields = fields
        .filter((field) => field?.fieldName && !field.isVirtual)
        .map((field) => ({
            fieldName: field.fieldName,
            alias: field.alias || field.fieldName,
            type: field.type || (field as any).dataType || 'FIELD',
            isVirtual: field.isVirtual,
        }));

    if (currentField && !regularFields.some((field) => field.fieldName === currentField)) {
        return [{ fieldName: currentField, alias: currentField, type: 'FIELD' }, ...regularFields];
    }

    return regularFields;
};

const MetaPackRelationshipEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
    source,
    target,
    sourceHandleId,
    targetHandleId,
}: EdgeProps<Edge<MetaPackRelationshipEdgeData>>) => {
    const { setEdges, setNodes, getNode } = useReactFlow();
    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const relationType = data?.relationType || 'ONE_TO_MANY';
    const returnType = data?.returnType || 'ARRAY';
    const parentField = data?.parentField || sourceHandleId?.replace('source-', '') || 'id';
    const childField = data?.childField || targetHandleId?.replace('target-', '') || '';
    const [relationField, setRelationField] = useState(typeof data?.relationField === 'string' ? data.relationField : '');
    const [relationFieldError, setRelationFieldError] = useState('');
    const sourceFieldOptions = useMemo(
        () => getFieldOptions(getNode(source), parentField),
        [getNode, source, parentField]
    );
    const targetFieldOptions = useMemo(
        () => getFieldOptions(getNode(target), childField),
        [getNode, target, childField]
    );

    // Sync local state with data
    useEffect(() => {
        if (typeof data?.relationField === 'string') {
            setRelationField(data.relationField);
        }
    }, [data?.relationField]);

    useEffect(() => {
        if (!data?.autoOpenConfig) return;

        setIsMenuOpen(true);
        setEdges((eds) =>
            eds.map((e) =>
                e.id === id
                    ? { ...e, data: { ...e.data, autoOpenConfig: false } }
                    : e
            )
        );
    }, [data?.autoOpenConfig, id, setEdges]);

    const [path] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    const handleUpdate = (updates: Partial<MetaPackRelationshipEdgeData>) => {
        const newData = { ...data, ...updates };
        const isCommitting = newData.isDraft !== true;
        const itemUpdates: Partial<MetaPackRelationshipEdgeData> = { ...updates };
        delete itemUpdates.autoOpenConfig;
        delete itemUpdates.isDraft;
        
        // 1. Update the edge itself
        setEdges((eds) => 
            eds.map((e) => {
                if (e.id === id) {
                    const newSourceHandle = updates.relationField 
                        ? `source-${updates.relationField}` 
                        : e.sourceHandle;
                    const newTargetHandle = updates.childField
                        ? `target-${updates.childField}`
                        : e.targetHandle;
                        
                    return {
                        ...e,
                        sourceHandle: newSourceHandle,
                        targetHandle: newTargetHandle,
                        data: newData
                    };
                }
                return e;
            })
        );

        if (!isCommitting) {
            return;
        }

        // 2. Update the target node (child in the tree)
        setNodes((nds) => 
            nds.map((n) => {
                if (n.id === target) {
                    const item = (n.data as any).item || {};
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            item: {
                                ...item,
                                ...itemUpdates,
                                returnType: itemUpdates.returnType || item.returnType
                            }
                        }
                    };
                }
                return n;
            })
        );

        // 3. Update the source node's virtual field
        if (updates.relationField || updates.relationType || updates.returnType) {
            setNodes((nds) => 
                nds.map((n) => {
                    if (n.id === source) {
                        const item = (n.data as any).item || {};
                        const oldFieldName = typeof data?.relationField === 'string' ? data.relationField : undefined;
                        const newFieldName = updates.relationField || oldFieldName;
                        const selectedFields = Array.isArray(item.selectedFields) ? item.selectedFields : [];
                        let foundVirtualField = false;
                        const nextFields = selectedFields.map((f: any) => {
                            if (f.fieldName === oldFieldName || (f.isVirtual && f.fieldName === newFieldName)) {
                                foundVirtualField = true;
                                return {
                                    ...f,
                                    fieldName: newFieldName,
                                    alias: newFieldName,
                                    type: updates.returnType || newData.returnType || f.type,
                                    isVirtual: true
                                };
                            }
                            return f;
                        });

                        if (newFieldName && !foundVirtualField) {
                            nextFields.push({
                                fieldName: newFieldName,
                                alias: newFieldName,
                                included: true,
                                type: updates.returnType || newData.returnType || 'ARRAY',
                                isVirtual: true
                            });
                        }

                        return {
                            ...n,
                            data: {
                                ...n.data,
                                item: {
                                    ...item,
                                    selectedFields: nextFields
                                }
                            }
                        };
                    }
                    return n;
                })
            );
        }
    };

    const handleTypeChange = (newType: RelationshipType) => {
        handleUpdate({ relationType: newType });
    };

    const handleReturnTypeChange = (newReturnType: RelationshipReturnType) => {
        handleUpdate({ returnType: newReturnType });
    };

    const handleRelationFieldChange = (val: string) => {
        setRelationField(val);
        if (val.trim()) {
            setRelationFieldError('');
        }
    };

    const handleParentFieldChange = (val: string) => {
        handleUpdate({ parentField: val });
    };

    const handleChildFieldChange = (val: string) => {
        handleUpdate({ childField: val });
    };

    const handleSave = () => {
        const nextRelationField = relationField.trim();
        if (!nextRelationField) {
            setRelationFieldError('Bạn cần đặt tên trường liên kết trước khi tạo nối.');
            return;
        }

        handleUpdate({
            parentField,
            childField,
            relationType,
            returnType,
            relationField: nextRelationField,
            isDraft: false
        });
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        setEdges((eds) => eds.filter((e) => e.id !== id));
        setIsMenuOpen(false);
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && data?.isDraft) {
            handleDelete();
            return;
        }
        setIsMenuOpen(open);
    };

    const sourceLabel = '1';
    const targetLabel = relationType === 'ONE_TO_ONE' ? '1' : relationType === 'MANY_TO_ONE' ? '1' : 'N';
    const sourceCardinalityLabel = relationType === 'MANY_TO_ONE' ? 'N' : sourceLabel;
    const edgeColor = selected || isHovered ? '#6366f1' : '#cbd5e1';

    return (
        <g 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
            className="group"
        >
            <BaseEdge 
                path={path} 
                markerEnd={markerEnd} 
                style={{ 
                    ...style, 
                    stroke: edgeColor, 
                    strokeWidth: selected ? 3 : 2,
                    transition: 'stroke 0.2s, stroke-width 0.2s'
                }} 
            />
            
            {/* Invisible thicker path for easier interaction */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                className="cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(true);
                }}
            />

            {/* Labels */}
            <foreignObject
                width={24}
                height={24}
                x={sourceX + (sourcePosition === Position.Right ? 10 : -34)}
                y={sourceY - 12}
                className="overflow-visible pointer-events-none"
            >
                <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border-2 transition-all",
                    selected || isHovered ? "bg-indigo-500 text-white border-indigo-200 shadow-lg shadow-indigo-200" : "bg-white text-slate-400 border-slate-100"
                )}>
                    {sourceCardinalityLabel}
                </div>
            </foreignObject>

            <foreignObject
                width={24}
                height={24}
                x={targetX + (targetPosition === Position.Left ? -34 : 10)}
                y={targetY - 12}
                className="overflow-visible pointer-events-none"
            >
                <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border-2 transition-all",
                    selected || isHovered ? "bg-indigo-500 text-white border-indigo-200 shadow-lg shadow-indigo-200" : "bg-white text-slate-400 border-slate-100"
                )}>
                    {targetLabel}
                </div>
            </foreignObject>

            {/* Center Menu Button */}
            <foreignObject
                width={40}
                height={40}
                x={labelX - 20}
                y={labelY - 20}
                className="overflow-visible"
            >
                <div className="flex items-center justify-center w-full h-full">
                    <Dialog open={isMenuOpen} onOpenChange={handleDialogOpenChange}>
                        <DialogTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "p-2 rounded-xl border-2 transition-all shadow-xl",
                                    selected || isHovered 
                                        ? "bg-white border-indigo-500 scale-110" 
                                        : "bg-white border-slate-100 scale-90 opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(true);
                                }}
                            >
                                <MoreVertical size={14} className={selected || isHovered ? "text-indigo-500" : "text-slate-400"} />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
                            <DialogHeader className="border-b border-slate-100 px-6 py-5">
                                <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <ArrowRightLeft className="h-5 w-5" />
                                    </span>
                                    Cấu hình liên kết
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 px-6 py-5">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="mb-3">
                                        <p className="text-sm font-semibold text-slate-900">Ghép trường nguồn và đích</p>
                                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                            Dây vẫn đi ra từ virtual field, còn 2 trường này là khóa dùng để join.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold text-slate-600">Trường nguồn</span>
                                            <select
                                                value={parentField}
                                                onChange={(e) => handleParentFieldChange(e.target.value)}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                                            >
                                                {sourceFieldOptions.map((field) => (
                                                    <option key={field.fieldName} value={field.fieldName}>
                                                        {field.alias || field.fieldName} ({field.type || 'FIELD'})
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold text-slate-600">Trường đích</span>
                                            <select
                                                value={childField}
                                                onChange={(e) => handleChildFieldChange(e.target.value)}
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                                            >
                                                {targetFieldOptions.map((field) => (
                                                    <option key={field.fieldName} value={field.fieldName}>
                                                        {field.alias || field.fieldName} ({field.type || 'FIELD'})
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">Tên trường liên kết trong JSON</label>
                                    <input
                                        type="text"
                                        value={relationField}
                                        onChange={(e) => handleRelationFieldChange(e.target.value)}
                                        placeholder="Nhập tên trường hiển thị trong JSON..."
                                        className={cn(
                                            "h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4",
                                            relationFieldError
                                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50"
                                                : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-50"
                                        )}
                                    />
                                    <p className={cn("px-1 text-xs leading-5", relationFieldError ? "text-rose-500" : "text-slate-500")}>
                                        {relationFieldError || 'Trường này chứa dữ liệu của node đích trong kết quả trả về.'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">Kiểu dữ liệu trả về</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleReturnTypeChange('ARRAY')}
                                            className={cn(
                                                "rounded-xl border p-4 text-left transition-all",
                                                returnType === 'ARRAY'
                                                    ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={cn("text-sm font-bold", returnType === 'ARRAY' ? "text-indigo-700" : "text-slate-800")}>Array</span>
                                                {returnType === 'ARRAY' && <Check size={14} className="text-indigo-600" />}
                                            </div>
                                            <span className="text-xs text-slate-500">Danh sách object</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReturnTypeChange('OBJECT')}
                                            className={cn(
                                                "rounded-xl border p-4 text-left transition-all",
                                                returnType === 'OBJECT'
                                                    ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={cn("text-sm font-bold", returnType === 'OBJECT' ? "text-indigo-700" : "text-slate-800")}>Object</span>
                                                {returnType === 'OBJECT' && <Check size={14} className="text-indigo-600" />}
                                            </div>
                                            <span className="text-xs text-slate-500">Một object</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">Loại quan hệ</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange('ONE_TO_MANY')}
                                            className={cn(
                                                "rounded-xl border p-3 text-left transition-all",
                                                relationType === 'ONE_TO_MANY'
                                                    ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={cn("text-xs font-bold", relationType === 'ONE_TO_MANY' ? "text-indigo-700" : "text-slate-800")}>1 : N</span>
                                                {relationType === 'ONE_TO_MANY' && <Check size={12} className="text-indigo-600" />}
                                            </div>
                                            <span className="text-[11px] text-slate-500">One to many</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange('MANY_TO_ONE')}
                                            className={cn(
                                                "rounded-xl border p-3 text-left transition-all",
                                                relationType === 'MANY_TO_ONE'
                                                    ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={cn("text-xs font-bold", relationType === 'MANY_TO_ONE' ? "text-indigo-700" : "text-slate-800")}>N : 1</span>
                                                {relationType === 'MANY_TO_ONE' && <Check size={12} className="text-indigo-600" />}
                                            </div>
                                            <span className="text-[11px] text-slate-500">Many to one</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange('ONE_TO_ONE')}
                                            className={cn(
                                                "rounded-xl border p-3 text-left transition-all",
                                                relationType === 'ONE_TO_ONE'
                                                    ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                            )}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={cn("text-xs font-bold", relationType === 'ONE_TO_ONE' ? "text-indigo-700" : "text-slate-800")}>1 : 1</span>
                                                {relationType === 'ONE_TO_ONE' && <Check size={12} className="text-indigo-600" />}
                                            </div>
                                            <span className="text-[11px] text-slate-500">One to one</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 border-t border-slate-100 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 flex-1 rounded-xl border-slate-200 text-sm font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 size={16} className="mr-2" />
                                        Xóa liên kết
                                    </Button>
                                    <Button
                                        type="button"
                                        className="h-11 flex-1 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800"
                                        onClick={handleSave}
                                    >
                                        Hoàn tất
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </foreignObject>
        </g>
    );
};

export default memo(MetaPackRelationshipEdge);
