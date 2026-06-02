import React, { useState, useCallback, useEffect } from 'react';
import { 
    ReactFlow, 
    Background, 
    Controls, 
    Panel, 
    Node, 
    Edge, 
    applyNodeChanges, 
    applyEdgeChanges, 
    addEdge, 
    Connection, 
    NodeChange, 
    EdgeChange 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
    Plus, 
    Database, 
    Layout, 
    ChevronRight, 
    Trash2, 
    Search, 
    X, 
    Key, 
    Circle, 
    Table2, 
    Box,
    ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import { MetaSetNode } from './MetaSetNode';
import MetaPackRelationshipEdge from './MetaPackRelationshipEdge';
import type { MetaPackField, MetaPackVersionItemDto } from '../../types/metapack';

const NODE_TYPES = {
    metaset: MetaSetNode,
};

const EDGE_TYPES = {
    relationship: MetaPackRelationshipEdge,
};

interface MetaSet {
    code: string;
    metaCode?: string | null;
    name: string;
    metaSourceName?: string | null;
    domainName?: string | null;
}

type DesignerField = MetaPackField & {
    dataType?: string;
};

type MetaPackItem = Omit<MetaPackVersionItemDto, 'children' | 'selectedFields'> & {
    selectedFields?: DesignerField[];
    children?: MetaPackItem[];
};

type MetaPackNodeData = {
    item: MetaPackItem;
    onConfigureFields: (id: string) => void;
    onDelete: (id: string) => void;
    disabled?: boolean;
    [key: string]: unknown;
};

interface MetaPackVisualDesignerProps {
    items: MetaPackVersionItemDto[];
    metaSets: MetaSet[];
    onUpdate: (items: MetaPackVersionItemDto[]) => void;
    disabled?: boolean;
}

const MetaSetSelectionDialog = ({ 
    isOpen, 
    onClose, 
    metaSets, 
    onSelect, 
    disabled 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    metaSets: MetaSet[]; 
    onSelect: (ms: MetaSet) => void;
    disabled?: boolean;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filtered = metaSets.filter(ms => 
        ms.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (ms.metaCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ms.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-white p-8 border-b border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Thư viện MetaSet</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Chọn nguồn dữ liệu để thêm vào sơ đồ
                            </DialogDescription>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Tìm kiếm theo tên hoặc mã MetaSet..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 mt-4">
                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                            Tất cả Nguồn
                        </div>
                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                            Tất cả Lĩnh vực
                        </div>
                    </div>
                </div>

                <ScrollArea className="h-[450px] bg-white p-6">
                    <div className="grid grid-cols-2 gap-4">
                        {filtered.length > 0 ? (
                            filtered.map(ms => (
                                <div 
                                    key={ms.code}
                                    onClick={() => {
                                        console.log("Library item clicked:", ms.code, "Disabled:", !!disabled);
                                        if (!disabled) onSelect(ms);
                                    }}
                                    className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        disabled 
                                        ? 'bg-slate-50/50 border-slate-50 opacity-60 cursor-not-allowed' 
                                        : 'border-slate-100 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-lg cursor-pointer'
                                    }`}
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${disabled ? 'bg-slate-100' : 'bg-slate-50 group-hover:bg-primary/10'}`}>
                                        <Database className={`h-5 w-5 ${disabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-primary'}`} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-sm font-black truncate transition-colors ${disabled ? 'text-slate-400' : 'text-slate-700 group-hover:text-primary'}`}>{ms.name}</span>
                                        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase mt-0.5">{ms.metaCode || ms.code}</span>
                                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-tight mt-1">{ms.metaSourceName ?? 'N/A'} • {ms.domainName ?? 'N/A'}</span>
                                    </div>
                                    {!disabled && (
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("Library + button clicked:", ms.code);
                                                onSelect(ms);
                                            }}
                                            className="absolute right-4 size-8 rounded-lg bg-slate-50 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all scale-75 group-hover:scale-100 shadow-sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 py-20 text-center flex flex-col items-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                    <Database className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-slate-400 font-black text-sm uppercase tracking-widest">Không tìm thấy MetaSet</h3>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-8">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiển thị {filtered.length} trong tổng số {metaSets.length} MetaSets</span>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Đóng</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const MetaPackVisualDesigner: React.FC<MetaPackVisualDesignerProps> = ({ 
    items, 
    metaSets, 
    onUpdate, 
    disabled = false 
}) => {
    const flattenItems = (itemList: MetaPackVersionItemDto[]) => {
        const nodes: Node<MetaPackNodeData>[] = [];
        const edges: Edge[] = [];
        
        const process = (item: MetaPackVersionItemDto, parentId?: string) => {
            const nodeId = item.id || `${item.metaCode}-${Math.random()}`;
            nodes.push({
                id: nodeId,
                type: 'metaset',
                position: item.position || { x: Math.random() * 400, y: Math.random() * 400 },
                data: { 
                    item: { ...item },
                    onConfigureFields: (id: string) => setConfigNodeId(id),
                    onDelete: (id: string) => {
                        setNodes(nds => nds.filter(n => n.id !== id));
                        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
                    },
                    disabled,
                }
            });

            if (parentId) {
                edges.push({
                    id: `e-${parentId}-${nodeId}`,
                    source: parentId,
                    target: nodeId,
                    sourceHandle: `source-${item.relationField || item.parentField}`,
                    targetHandle: `target-${item.childField}`,
                    type: 'relationship',
                    data: {
                        relationType: item.relationType || 'ONE_TO_MANY',
                        parentField: item.parentField,
                        childField: item.childField,
                        relationField: item.relationField,
                        returnType: item.returnType || 'ARRAY'
                    }
                });
            }

            if (item.children && Array.isArray(item.children)) {
                item.children.forEach((child) => process(child, nodeId));
            }
        };

        itemList.forEach(item => process(item));
        return { nodes, edges };
    };

    const [nodes, setNodes] = useState<Node<MetaPackNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [, setConfigNodeId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initialize nodes and edges from props
    useEffect(() => {
        if (!items || items.length === 0) {
            // If items is empty but we have nodes, it might be a sync delay, 
            // don't clear the diagram immediately
            if (nodes.length > 0) return;
            setNodes([]);
            setEdges([]);
            return;
        }
        
        // Only initialize if we don't have nodes yet (initial load)
        // or if the number of items changed significantly
        if (nodes.length > 0 && items.length === nodes.length) {
            return;
        }

        const { nodes: initialNodes, edges: initialEdges } = flattenItems(items);
        const nodesWithHandlers = initialNodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onConfigureFields: (id: string) => setConfigNodeId(id),
                onDelete: (id: string) => {
                    setNodes(nds => nds.filter(n => n.id !== id));
                    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
                }
            }
        }));
        setNodes(nodesWithHandlers);
        setEdges(initialEdges);
    }, [items.length]); // Still using length to detect additions/deletions

    // Auto-sync logic to update parent state whenever the diagram changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const buildTree = (nodeId: string): MetaPackItem | null => {
                const node = nodes.find(n => n.id === nodeId);
                if (!node) return null;
                const committedEdges = edges.filter(e => !(e.data as any)?.isDraft);

                const children = committedEdges
                    .filter(e => e.source === nodeId)
                    .map(e => buildTree(e.target))
                    .filter((item): item is MetaPackItem => Boolean(item));

                return {
                    ...node.data.item,
                    position: node.position,
                    children
                };
            };

            const committedEdges = edges.filter(e => !(e.data as any)?.isDraft);
            const rootNodes = nodes.filter(n => !committedEdges.some(e => e.target === n.id));
            const newItems = rootNodes
                .map(n => buildTree(n.id))
                .filter((item): item is MetaPackItem => Boolean(item));
            
            // Check if items changed (excluding small position changes to reduce noise)
            const oldItemsStr = JSON.stringify(items);
            const newItemsStr = JSON.stringify(newItems);

            if (newItemsStr !== oldItemsStr) {
                console.log("Auto-syncing to parent...");
                onUpdate(newItems as MetaPackVersionItemDto[]);
            }
        }, 200); // Drastically reduced debounce for real-time feel

        return () => clearTimeout(timer);
    }, [nodes, edges, onUpdate, items]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<MetaPackNodeData>[]),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );
    const onConnect = useCallback((params: Connection) => {
        const sourceField = params.sourceHandle?.replace('source-', '');
        const targetField = params.targetHandle?.replace('target-', '');

        setEdges((eds) => addEdge({ 
            ...params, 
            type: 'relationship',
            data: {
                relationType: 'ONE_TO_MANY',
                parentField: sourceField,
                childField: targetField,
                relationField: '',
                returnType: 'ARRAY',
                autoOpenConfig: true,
                isDraft: true
            }
        }, eds));
    }, [setEdges]);


    const addMetaSetToCanvas = async (metaSet: MetaSet) => {
        console.log("Adding MetaSet to canvas:", metaSet.code);
        // Prevent adding the same MetaSet more than once in a MetaPack
        const metaIdentifier = (metaSet.metaCode || metaSet.code)?.toString();
        const existing = nodes.find(n => (n.data?.item?.metaCode || n.data?.item?.endpointAlias) === metaIdentifier || n.data?.item?.metaCode === metaIdentifier || n.id === `${metaSet.code}-${metaSet.metaCode}`);
        if (existing) {
            console.log("MetaSet already exists on canvas. Focusing existing node:", existing.id);
            // focus/select existing node instead of adding duplicate
            setSelectedNodeId(existing.id);
            setIsSelectionDialogOpen(false);
            return;
        }
        let initialFields: DesignerField[] = [];
        try {
            const versions = await metaSetVersionApi.listByMetaCode(metaSet.metaCode || metaSet.code);
            if (versions && versions.length > 0) {
                const latest = versions[0];
                if (latest.fieldData) {
                    const parsed = typeof latest.fieldData === 'string' ? JSON.parse(latest.fieldData) : latest.fieldData;
                    initialFields = (parsed || []).map((f: any) => ({
                        fieldName: f.code || f.fieldName,
                        dataType: f.type || f.dataType,
                        alias: f.code || f.fieldName,
                        included: true,
                    }));
                }
            }
        } catch (e) {
            console.error("Error fetching fields for MetaSet", e);
        }

        const newNodeId = `${metaSet.code}-${Date.now()}`;
        const newNode: Node<MetaPackNodeData> = {
            id: newNodeId,
            type: 'metaset',
            position: { x: 100, y: nodes.length * 150 + 100 },
            data: {
                item: { 
                    endpointAlias: (metaSet.metaCode || metaSet.code).toLowerCase(), 
                    returnType: 'ARRAY', 
                    metaCode: metaSet.metaCode || metaSet.code, 
                    parentField: 'id', 
                    childField: '', 
                    relationType: 'ONE_TO_MANY', 
                    children: [],
                    selectedFields: initialFields
                },
                onConfigureFields: (id: string) => setConfigNodeId(id),
                onDelete: (id: string) => {
                    setNodes(nds => nds.filter(n => n.id !== id));
                    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
                },
                disabled,
            },
        };
        console.log("New node created:", newNodeId);
        setNodes(nds => [...nds, newNode]);
        setSelectedNodeId(newNodeId);
        setIsSelectionDialogOpen(false);
    };

    return (
        <>
            <div className="w-full h-[850px] bg-slate-50 relative rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl flex font-sans">
                {/* DrawSQL Style Sidebar (Left) */}
                <div 
                    style={{ 
                        width: isSidebarOpen ? 340 : 0, 
                        minWidth: isSidebarOpen ? 340 : 0, 
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                        overflow: 'hidden' 
                    }}
                    className="shrink-0 border-r border-slate-200 bg-[#fbfcfd] flex flex-col relative z-20"
                >
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Table2 className="h-4 w-4 text-slate-400" />
                                <h3 className="text-[13px] font-bold text-slate-600 uppercase tracking-tight">Tables</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Search className="h-3.5 w-3.5" /></button>
                                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><X className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>

                        {!disabled && (
                            <Button 
                                type="button"
                                onClick={() => setIsSelectionDialogOpen(true)}
                                className="w-full h-9 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-md shadow-primary/10 flex items-center justify-center gap-2 group transition-all"
                            >
                                <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
                                Thêm MetaSet
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="flex-1 bg-[#fbfcfd]">
                        <div className="flex flex-col">
                            {nodes.map(node => {
                                const isSelected = selectedNodeId === node.id;
                                const item = node.data.item;
                                return (
                                    <div key={node.id} className="flex flex-col">
                                        {/* Table Header Row */}
                                        <div 
                                            onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                                            className={`group flex items-center justify-between px-4 py-3 cursor-pointer border-b border-slate-100 transition-all ${
                                                isSelected ? 'bg-[#ebf0ff] border-l-4 border-l-primary' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                                                    <Database className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[12px] font-bold truncate leading-tight ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                                        {metaSets.find(ms => (ms.metaCode || ms.code) === item.metaCode)?.name || item.endpointAlias || item.metaCode}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isSelected ? 'text-primary/60' : 'text-slate-400'}`}>
                                                        {item.metaCode}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? 'rotate-90 text-primary' : 'text-slate-400'}`} />
                                            </div>
                                        </div>

                                        {/* Expanded Fields Section (DrawSQL style) */}
                                        {isSelected && (
                                            <div className="bg-white p-4 space-y-3 border-b border-slate-200 shadow-inner">
                                                {/* Fields List */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Columns</span>
                                                        {!disabled && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => setConfigNodeId(node.id)}
                                                                className="text-[10px] font-black text-primary hover:underline uppercase flex items-center gap-1"
                                                            >
                                                                <ListFilter className="h-2.5 w-2.5" />
                                                                Import
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 mt-1">
                                                        {(item.selectedFields || []).length > 0 ? (
                                                            (item.selectedFields || []).map((field, idx: number) => {
                                                                const isPk = field.fieldName?.toLowerCase() === 'id';
                                                                return (
                                                                    <div key={idx} className="flex items-center gap-2 p-1.5 bg-slate-50/50 border border-slate-100 rounded-lg group/field hover:bg-slate-50 hover:border-slate-200 transition-colors">
                                                                        <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
                                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                {isPk ? (
                                                                                    <Key size={10} className="text-amber-500 shrink-0" />
                                                                                ) : (
                                                                                    <Circle size={6} className="text-slate-200 shrink-0 mx-0.5" />
                                                                                )}
                                                                                <input 
                                                                                    className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-full focus:text-primary transition-colors"
                                                                                    value={field.alias || field.fieldName}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setNodes(nds => nds.map(n => n.id === node.id ? {
                                                                                            ...n,
                                                                                            data: { 
                                                                                                ...n.data, 
                                                                                                item: { 
                                                                                                    ...n.data.item, 
                                                                                                    selectedFields: (item.selectedFields || []).map((f, i: number) => 
                                                                                                        i === idx ? { ...f, alias: val } : f
                                                                                                    )
                                                                                                } 
                                                                                            }
                                                                                        } : n));
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <select 
                                                                                    className="bg-white border-none text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tighter outline-none cursor-pointer hover:text-primary transition-colors appearance-none"
                                                                                    value={field.dataType || 'STRING'}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setNodes(nds => nds.map(n => n.id === node.id ? {
                                                                                            ...n,
                                                                                            data: { 
                                                                                                ...n.data, 
                                                                                                item: { 
                                                                                                    ...n.data.item, 
                                                                                                    selectedFields: (item.selectedFields || []).map((f, i: number) => 
                                                                                                        i === idx ? { ...f, dataType: val } : f
                                                                                                    )
                                                                                                } 
                                                                                            }
                                                                                        } : n));
                                                                                    }}
                                                                                >
                                                                                    <option value="STRING">STRING</option>
                                                                                    <option value="LONG">LONG</option>
                                                                                    <option value="INT">INT</option>
                                                                                    <option value="BOOLEAN">BOOLEAN</option>
                                                                                    <option value="DATE">DATE</option>
                                                                                    <option value="JSON">JSON</option>
                                                                                    <option value="ARRAY">ARRAY</option>
                                                                                    <option value="OBJECT">OBJECT</option>
                                                                                </select>
                                                                                {!disabled && (
                                                                                    <button 
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setNodes(nds => nds.map(n => n.id === node.id ? {
                                                                                                ...n,
                                                                                                data: { 
                                                                                                    ...n.data, 
                                                                                                    item: { 
                                                                                                        ...n.data.item, 
                                                                                                        selectedFields: (item.selectedFields || []).filter((_, i: number) => i !== idx)
                                                                                                    } 
                                                                                                }
                                                                                            } : n));
                                                                                        }}
                                                                                        className="opacity-0 group-hover/field:opacity-100 p-0.5 hover:bg-rose-50 rounded text-rose-300 hover:text-rose-500 transition-all"
                                                                                    >
                                                                                        <X size={10} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="py-4 px-2 border-2 border-dashed border-slate-50 rounded-xl flex flex-col items-center justify-center bg-slate-50/30">
                                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No fields selected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Node Actions */}
                                                {!disabled && (
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                                                        <Button 
                                                            type="button"
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                const newField = { fieldName: `field_${(item.selectedFields || []).length + 1}`, dataType: 'STRING', alias: `field_${(item.selectedFields || []).length + 1}`, included: true };
                                                                setNodes(nds => nds.map(n => n.id === node.id ? {
                                                                    ...n,
                                                                    data: { 
                                                                        ...n.data, 
                                                                        item: { 
                                                                            ...n.data.item, 
                                                                            selectedFields: [...(item.selectedFields || []), newField]
                                                                        } 
                                                                    }
                                                                } : n));
                                                            }}
                                                            className="flex-1 h-8 text-[10px] font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm"
                                                        >
                                                            <Plus size={12} className="mr-1.5 text-primary" />
                                                            Add Column
                                                        </Button>
                                                        <Button 
                                                            type="button"
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setNodes(nds => nds.filter(n => n.id !== node.id));
                                                                setEdges(eds => eds.filter(e => e.source !== node.id && e.target !== node.id));
                                                                setSelectedNodeId(null);
                                                            }}
                                                            className="h-7 px-2 border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {nodes.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <div className="p-3 bg-slate-50 rounded-full border-2 border-dashed border-slate-200">
                                        <Box className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Diagram is empty.<br/>Add your first MetaSet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{nodes.length} MetaSets trong gói</span>
                    </div>
                </div>

                {/* Main Content Area: Canvas */}
                <div className="flex-1 flex flex-col relative bg-slate-50/50 min-w-0">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={NODE_TYPES}
                        edgeTypes={EDGE_TYPES}
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        onPaneClick={() => {
                            setSelectedNodeId(null);
                            setConfigNodeId(null);
                        }}
                        fitView
                        colorMode="light"
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls className="!bg-white !border-slate-200 !shadow-lg rounded-xl overflow-hidden" />
                        
                        {!disabled && (
                            <Panel position="top-left" className="flex gap-3">
                                <Button 
                                    type="button"
                                    onClick={() => setIsSelectionDialogOpen(true)}
                                    className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl h-11 px-6 font-bold flex items-center gap-2 group transition-all active:scale-95"
                                >
                                    <Plus className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform" />
                                    Thêm MetaSet
                                </Button>

                                <Button 
                                    type="button"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl h-11 px-4 font-bold flex items-center transition-all active:scale-95"
                                >
                                    <Layout className={`h-4 w-4 ${isSidebarOpen ? 'text-primary' : 'text-slate-400'}`} />
                                </Button>
                            </Panel>
                        )}

                        {!disabled && (
                            <Panel position="top-right">
                                <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl shadow-slate-200/40">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auto-Sync Active</span>
                                </div>
                            </Panel>
                        )}

                        {disabled && (
                            <Panel position="top-left">
                                <Button 
                                    type="button"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl h-11 px-4 font-bold flex items-center transition-all active:scale-95"
                                >
                                    <Layout className={`h-4 w-4 ${isSidebarOpen ? 'text-primary' : 'text-slate-400'}`} />
                                    <span className="ml-2 text-xs font-bold uppercase tracking-widest text-slate-400">Cấu trúc</span>
                                </Button>
                            </Panel>
                        )}

                    </ReactFlow>
                </div>
            </div>

            <MetaSetSelectionDialog 
                isOpen={isSelectionDialogOpen}
                onClose={() => setIsSelectionDialogOpen(false)}
                metaSets={metaSets}
                onSelect={addMetaSetToCanvas}
                disabled={disabled}
            />
        </>
    );
};
