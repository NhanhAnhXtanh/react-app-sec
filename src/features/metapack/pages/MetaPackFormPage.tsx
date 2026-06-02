import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft, PlusCircle, Trash2, Layout, Zap, Settings, History, Users, Edit, ListFilter, Share2, List } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { MetaPackRegistrationsTab } from '../components/MetaPackRegistrationsTab';
import { metapackApi } from '../api/metapack-api';
import { metaSetApi } from '@/api/metaset.api';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import type { MetaSet } from '@/model/metaset.types';
import type { MetaPackVersionDto, MetaPackVersionItemDto } from '../types/metapack';
import type { FieldItem } from '@/model/metasync.types';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type FormData = {
    code: string;
    name: string;
    description: string;
    status: 'DRAFT' | 'PUBLISHED' | 'DISCONTINUED';
    maxRequestsPerMinute: number | null;
    maxRequestsPerDay: number | null;
};

type FormMode = 'create' | 'edit' | 'view';
type FormTab = 'overview' | 'schema' | 'config' | 'versions' | 'registrations';

import { MetaPackVisualDesigner } from '../components/diagram/MetaPackVisualDesigner';
import { FieldConfigDialog } from '../components/FieldConfigDialog';

const SchemaNodeBuilder: React.FC<{
    item: MetaPackVersionItemDto;
    metaSets: MetaSet[];
    parentFields?: FieldItem[]; // Fields of the parent MetaSet
    onUpdate: (updatedItem: MetaPackVersionItemDto) => void;
    onDelete: () => void;
    depth?: number;
    disabled?: boolean;
}> = ({ item, metaSets, parentFields = [], onUpdate, onDelete, depth = 0, disabled = false }) => {
    const [configOpen, setConfigOpen] = useState(false);
    const [currentFields, setCurrentFields] = useState<FieldItem[]>([]);

    // Fetch fields of current MetaSet for relationship picker (of children)
    useEffect(() => {
        if (item.metaCode) {
            metaSetVersionApi.listByMetaCode(item.metaCode)
                .then(versions => {
                    if (versions && versions.length > 0) {
                        const latest = versions.sort((a, b) => b.versionNo - a.versionNo)[0];
                        if (latest.fieldData) {
                            try {
                                setCurrentFields(JSON.parse(latest.fieldData));
                            } catch (e) { console.error(e); }
                        }
                    }
                })
                .catch(err => console.error(err));
        }
    }, [item.metaCode]);

    return (
        <div 
            className={`p-6 border rounded-2xl bg-background shadow-sm mb-5 transition-all hover:shadow-md border-border/50 relative group ${
                depth === 0 ? 'border-l-4 border-l-primary' : ''
            }`} 
            style={{ marginLeft: `${depth * 28}px` }}
        >
            <div className="flex flex-wrap items-start gap-5">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                        <Layout className="h-3 w-3" />
                        Tên trường (Field Name)
                    </Label>
                    <Input 
                        placeholder="ví dụ: danhsachSanPham" 
                        value={item.endpointAlias}
                        onChange={(e) => onUpdate({ ...item, endpointAlias: e.target.value })}
                        required
                        disabled={disabled}
                        className="bg-muted/10 border-border/40 h-10 focus-visible:ring-primary/20 font-medium"
                    />
                </div>
                <div className="w-[180px] space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Kiểu dữ liệu</Label>
                    <Select 
                        value={item.returnType} 
                        onValueChange={(val: any) => onUpdate({ ...item, returnType: val })}
                        disabled={disabled}
                    >
                        <SelectTrigger className="bg-muted/10 border-border/40 h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-xl">
                            <SelectItem value="ARRAY" className="font-medium">Mảng (Array)</SelectItem>
                            <SelectItem value="OBJECT" className="font-medium">Đối tượng (Object)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-[240px] space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Nguồn dữ liệu (MetaSet)</Label>
                    <Select 
                        value={item.metaCode} 
                        onValueChange={(val: any) => onUpdate({ ...item, metaCode: val })}
                        disabled={disabled}
                    >
                        <SelectTrigger className="bg-muted/10 border-border/40 h-10">
                            <SelectValue placeholder="Chọn MetaSet nguồn" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-xl max-h-[300px]">
                            {metaSets.map(ms => (
                                <SelectItem key={ms.code} value={ms.code} className="py-2.5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-sm text-foreground/90">{ms.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">{ms.code}</span>
                                            {ms.status && <span className="text-[9px] text-muted-foreground italic">• {ms.status}</span>}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                        <Settings className="h-3 w-3" />
                        Trường dữ liệu trả về
                    </Label>
                    <div className="flex items-center gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setConfigOpen(true)}
                            className="h-10 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all flex-1 justify-start font-medium rounded-xl"
                        >
                            <ListFilter className="mr-2 h-4 w-4" />
                            {item.selectedFields && item.selectedFields.length > 0 
                                ? `Đã chọn ${item.selectedFields.length} trường` 
                                : 'Cấu hình trường trả về'}
                        </Button>
                        {item.selectedFields && item.selectedFields.length > 0 && (
                            <Badge className="h-10 px-3 bg-primary/10 text-primary border-none rounded-xl font-bold">
                                {item.selectedFields.length}
                            </Badge>
                        )}
                    </div>
                </div>
                {!disabled && (
                    <div className="pt-8">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors" 
                            onClick={onDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Relationship Configuration (Only for non-root nodes) */}
            {depth > 0 && (
                <div className="mt-5 p-5 bg-primary/[0.03] rounded-2xl border border-primary/10 flex flex-wrap items-end gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex-1 min-w-[220px] space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-primary/70 flex items-center gap-1.5">
                            <Zap className="h-3 w-3" />
                            Trường nguồn (Parent Field)
                        </Label>
                        <Select 
                            value={item.parentField || ''} 
                            onValueChange={(val: any) => onUpdate({ ...item, parentField: val })}
                            disabled={disabled || parentFields.length === 0}
                        >
                            <SelectTrigger className="bg-white border-primary/20 h-10 text-xs font-mono focus:ring-primary/20 rounded-xl">
                                <SelectValue placeholder={parentFields.length === 0 ? "Chưa có danh sách trường" : "Chọn trường nguồn"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl max-h-[250px]">
                                {parentFields.map(pf => (
                                    <SelectItem key={pf.id} value={pf.name} className="font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{pf.name}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-60">[{pf.dataType}]</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex items-center justify-center pb-2.5">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-primary/30 uppercase mb-1.5 tracking-tighter">Connect</span>
                            <div className="h-px w-10 bg-primary/20 relative">
                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/40" />
                                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/40" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[220px] space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-primary/70 flex items-center gap-1.5">
                            <Layout className="h-3 w-3" />
                            Trường đích (Child Field)
                        </Label>
                        <Select 
                            value={item.childField || ''} 
                            onValueChange={(val: any) => onUpdate({ ...item, childField: val })}
                            disabled={disabled || currentFields.length === 0}
                        >
                            <SelectTrigger className="bg-white border-primary/20 h-10 text-xs font-mono focus:ring-primary/20 rounded-xl">
                                <SelectValue placeholder={currentFields.length === 0 ? "Đang tải..." : "Chọn trường đích"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl max-h-[250px]">
                                {currentFields.map(cf => (
                                    <SelectItem key={cf.id} value={cf.name} className="font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{cf.name}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-60">[{cf.dataType}]</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[180px] space-y-2">
                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-primary/70">Loại quan hệ</Label>
                        <Select 
                            value={item.relationType || 'ONE_TO_MANY'} 
                            onValueChange={(val: any) => onUpdate({ ...item, relationType: val })}
                            disabled={disabled}
                        >
                            <SelectTrigger className="bg-white border-primary/20 h-10 text-xs font-bold rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl">
                                <SelectItem value="ONE_TO_ONE" className="text-xs font-bold">1 - 1 (One to One)</SelectItem>
                                <SelectItem value="ONE_TO_MANY" className="text-xs font-bold">1 - N (One to Many)</SelectItem>
                                <SelectItem value="MANY_TO_ONE" className="text-xs font-bold">N - 1 (Many to One)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <FieldConfigDialog 
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                metaCode={item.metaCode}
                selectedFields={item.selectedFields || []}
                onSave={(fields) => onUpdate({ ...item, selectedFields: fields })}
                disabled={disabled}
            />

            <div className="mt-8 border-l-2 border-primary/10 pl-8 ml-3 space-y-6">
                {item.children?.map((child, childIndex) => (
                    <SchemaNodeBuilder
                        key={childIndex}
                        item={child}
                        metaSets={metaSets}
                        parentFields={currentFields}
                        disabled={disabled}
                        depth={depth + 1}
                        onUpdate={(updatedChild) => {
                            const newChildren = [...(item.children || [])];
                            newChildren[childIndex] = updatedChild;
                            onUpdate({ ...item, children: newChildren });
                        }}
                        onDelete={() => {
                            const newChildren = (item.children || []).filter((_, i) => i !== childIndex);
                            onUpdate({ ...item, children: newChildren });
                        }}
                    />
                ))}
                
                {!disabled && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="border-dashed h-10 px-5 text-xs font-bold bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 text-primary transition-all rounded-xl"
                        onClick={() => {
                            onUpdate({
                                ...item,
                                children: [...(item.children || []), { endpointAlias: '', returnType: 'ARRAY', metaCode: '', parentField: 'id', childField: '', relationType: 'ONE_TO_MANY' }]
                            });
                        }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm node con (Sub-node)
                    </Button>
                )}
            </div>
        </div>
    );
};

interface Props {
    mode?: FormMode;
}

export const MetaPackFormPage: React.FC<Props> = ({ mode: initialMode }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine mode from route if not provided
    const mode = initialMode || (location.pathname.endsWith('/edit') ? 'edit' : id ? 'view' : 'create');
    const isEdit = mode === 'edit';
    const isView = mode === 'view';
    const isCreate = mode === 'create';

    const [loading, setLoading] = useState(false);
    const [metaSets, setMetaSets] = useState<MetaSet[]>([]);
    const [versionItems, setVersionItems] = useState<MetaPackVersionItemDto[]>([]);
    const [versions, setVersions] = useState<MetaPackVersionDto[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<MetaPackVersionDto | null>(null);
    const [activeTab, setActiveTab] = useState<FormTab>('overview');
    const [configMode, setConfigMode] = useState<'list' | 'diagram'>('list');

    const [formData, setFormData] = useState<FormData>({
        code: '',
        name: '',
        description: '',
        status: 'DRAFT',
        maxRequestsPerMinute: 60,
        maxRequestsPerDay: 10000,
    });

    useEffect(() => {
        const fetchMetaSets = async () => {
            try {
                const list = await metaSetApi.listAll();
                setMetaSets(list);
            } catch (error) {
                console.error('Failed to fetch MetaSets:', error);
            }
        };
        fetchMetaSets();
    }, []);

    useEffect(() => {
        if (id) {
            const fetchPack = async () => {
                try {
                    const data = await metapackApi.getById(id);
                    setFormData({
                        code: data.code || '',
                        name: data.name || '',
                        description: data.description || '',
                        status: data.status as any || 'DRAFT',
                        maxRequestsPerMinute: data.maxRequestsPerMinute || null,
                        maxRequestsPerDay: data.maxRequestsPerDay || null,
                    });
                    setVersionItems(data.versionItems || []);
                } catch (error) {
                    console.error('Failed to fetch MetaPack:', error);
                }
            };
            fetchPack();
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            setVersions([]);
            return;
        }

        const fetchVersions = async () => {
            try {
                setVersionsLoading(true);
                const data = await metapackApi.getVersions(id);
                setVersions(data);
                setSelectedVersion(data[0] || null);
            } catch (error) {
                console.error('Failed to fetch MetaPack versions:', error);
                setVersions([]);
                setSelectedVersion(null);
            } finally {
                setVersionsLoading(false);
            }
        };

        fetchVersions();
    }, [id]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { 
                ...formData, 
                versionItems,
                maxRequestsPerMinute: formData.maxRequestsPerMinute ?? undefined,
                maxRequestsPerDay: formData.maxRequestsPerDay ?? undefined
            };
            console.log("Submitting MetaPack Payload:", payload);
            let savedId = id;
            if (isEdit && id) {
                await metapackApi.update(id, payload);
                setVersions(await metapackApi.getVersions(id));
                toast.success('Cập nhật MetaPack thành công');
                navigate(`/metapacks/${id}`);
            } else {
                const response = await metapackApi.create(payload);
                savedId = response.id;
                setVersions(await metapackApi.getVersions(savedId));
                toast.success('Tạo mới MetaPack thành công');
                navigate(`/metapacks/${savedId}`);
            }
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Lưu thay đổi thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const countVersionNodes = (dataConfig?: string) => {
        if (!dataConfig) return 0;
        try {
            const walk = (items: MetaPackVersionItemDto[]): number =>
                items.reduce((total, item) => total + 1 + walk(item.children || []), 0);
            const items = JSON.parse(dataConfig) as MetaPackVersionItemDto[];
            return Array.isArray(items) ? walk(items) : 0;
        } catch {
            return 0;
        }
    };

    const formatDateTime = (value?: string) => {
        if (!value) return '-';
        return new Intl.DateTimeFormat('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(value));
    };

    const TABS: Array<{ key: FormTab; label: string; icon: React.ReactNode; hidden?: boolean }> = [
        { key: 'overview', label: 'Thông tin chung', icon: <Layout className="h-4 w-4 mr-2" /> },
        { key: 'schema', label: 'Cấu trúc dữ liệu', icon: <Zap className="h-4 w-4 mr-2" /> },
        { key: 'config', label: 'Cấu hình Rate Limit', icon: <Settings className="h-4 w-4 mr-2" /> },
        { key: 'versions', label: 'Phiên bản', icon: <History className="h-4 w-4 mr-2" />, hidden: isCreate },
        { key: 'registrations', label: 'Quản lý Đăng ký', icon: <Users className="h-4 w-4 mr-2" />, hidden: isCreate },
    ];

    return (
        <div className="min-h-full bg-background">
            <div className="mx-auto max-w-[1400px] space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                            if (isEdit) {
                                navigate(`/metapacks/${id}`);
                            } else {
                                navigate('/metapacks');
                            }
                        }} 
                        className="mt-1 h-9 w-9 rounded-full border-border bg-card shadow-sm hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {isView ? formData.name : isEdit ? 'Chỉnh sửa MetaPack' : 'Tạo mới MetaPack'}
                            </h1>
                            {isView && (
                                <div className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                    formData.status === 'PUBLISHED' ? 'bg-green-500/10 border-green-500/30 text-green-600' :
                                    formData.status === 'DRAFT' ? 'bg-slate-500/10 border-slate-500/30 text-slate-600' :
                                    'bg-red-500/10 border-red-500/30 text-red-600'
                                }`}>
                                    {formData.status}
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                                {id ? `ID: ${formData.code}` : 'NEW_METAPACK'}
                            </span>
                            <span>MetaPack Configuration</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isView ? (
                        <Button 
                            onClick={() => navigate(`/metapacks/${id}/edit`)} 
                            className="h-10 rounded-lg px-5 font-semibold"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                        </Button>
                    ) : (
                        <>
                            <Button 
                                type="button"
                                variant="ghost" 
                                className="h-10 px-5 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    if (isEdit) {
                                        navigate(`/metapacks/${id}`);
                                    } else {
                                        navigate('/metapacks');
                                    }
                                }}
                            >
                                Hủy bỏ
                            </Button>
                            <Button 
                                type="submit"
                                form="metapack-form"
                                disabled={loading} 
                                className="h-10 rounded-lg px-5 font-semibold"
                            >
                                {loading ? (
                                    <span className="flex items-center"><Save className="mr-2 h-4 w-4 animate-pulse" /> Đang lưu...</span>
                                ) : (
                                    <span className="flex items-center"><Save className="mr-2 h-4 w-4" /> Lưu cấu hình</span>
                                )}
                            </Button>
                        </>
                    )}
                </div>
                </div>

                <div className="rounded-xl border bg-card p-1 shadow-sm">
                <div className="flex flex-wrap gap-1">
                    {TABS.filter(t => !t.hidden).map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

                    <form id="metapack-form" onSubmit={onSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                    <div className="border-b px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Layout className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">Định danh, mô tả và trạng thái phát hành của MetaPack.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6 p-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="code" className="text-sm font-semibold">Mã định danh</Label>
                                                    <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">Tự động</span>
                                                </div>
                                                <div className="relative">
                                                    <Input 
                                                        id="code" 
                                                        value={formData.code} 
                                                        onChange={(e) => setFormData({...formData, code: e.target.value})} 
                                                        disabled={true} 
                                                        placeholder="Hệ thống tự động sinh..."
                                                        className="h-11 rounded-lg bg-muted/60 font-mono text-sm disabled:cursor-default disabled:opacity-100"
                                                    />
                                                </div>
                                                <p className="px-1 text-xs text-muted-foreground">
                                                    Được cấp phát tự động: 000001, 000002...
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="flex items-center gap-1 text-sm font-semibold">
                                                    Tên hiển thị <span className="text-destructive">*</span>
                                                </Label>
                                                <Input 
                                                    id="name" 
                                                    value={formData.name} 
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                                    placeholder="VD: Gói thông tin sinh viên tổng hợp"
                                                    required
                                                    disabled={isView}
                                                    className="h-11 rounded-lg disabled:cursor-default disabled:bg-muted/60 disabled:opacity-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-semibold">Mô tả mục đích</Label>
                                            <Textarea 
                                                id="description" 
                                                value={formData.description} 
                                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                                placeholder="Mô tả chi tiết nội dung và cách sử dụng gói dữ liệu này..."
                                                rows={4} 
                                                disabled={isView}
                                                className="resize-none rounded-lg disabled:cursor-default disabled:bg-muted/60 disabled:opacity-100"
                                            />
                                        </div>

                                        <div className="w-full max-w-sm space-y-2">
                                            <Label className="text-sm font-semibold">Trạng thái phát hành</Label>
                                            <Select 
                                                value={formData.status} 
                                                onValueChange={(val: any) => setFormData({...formData, status: val})}
                                                disabled={isView}
                                            >
                                                <SelectTrigger className="h-11 rounded-lg disabled:cursor-default disabled:bg-muted/60 disabled:opacity-100">
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border/40 shadow-xl">
                                                    <SelectItem value="DRAFT" className="py-3 focus:bg-slate-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">Bản nháp (Draft)</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Internal use only</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="PUBLISHED" className="py-3 focus:bg-green-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">Phát hành (Published)</span>
                                                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Available for consumers</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="DISCONTINUED" className="py-3 focus:bg-red-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">Ngừng hỗ trợ (Discontinued)</span>
                                                                <span className="text-[10px] text-red-600 font-bold uppercase tracking-tight">End of life</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'schema' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-border/40 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <Zap className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground/90 leading-tight">Cấu trúc Dữ liệu Đầu ra</h3>
                                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Định nghĩa cấu trúc JSON sẽ trả về khi gọi API</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-muted p-1 rounded-xl border border-border/20">
                                            <Button 
                                                type="button"
                                                variant={configMode === 'list' ? 'secondary' : 'ghost'} 
                                                size="sm" 
                                                onClick={() => setConfigMode('list')}
                                                className={`h-8 px-3 text-[11px] font-bold rounded-lg transition-all ${configMode === 'list' ? 'shadow-sm bg-background hover:bg-background' : ''}`}
                                            >
                                                <List className="mr-1.5 h-3.5 w-3.5" /> Danh sách
                                            </Button>
                                            <Button 
                                                type="button"
                                                variant={configMode === 'diagram' ? 'secondary' : 'ghost'} 
                                                size="sm" 
                                                onClick={() => setConfigMode('diagram')}
                                                className={`h-8 px-3 text-[11px] font-bold rounded-lg transition-all ${configMode === 'diagram' ? 'shadow-sm bg-background hover:bg-background' : ''}`}
                                            >
                                                <Share2 className="mr-1.5 h-3.5 w-3.5" /> Sơ đồ (Flow)
                                            </Button>
                                        </div>

                                        <div className="h-6 w-px bg-border/40 mx-2" />

                                        {!isView && configMode === 'list' && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setVersionItems([...versionItems, { endpointAlias: '', returnType: 'OBJECT', metaCode: '', parentField: 'id', childField: '', relationType: 'ONE_TO_MANY' }])}
                                                className="h-9 px-4 font-bold border-primary/20 text-primary hover:bg-primary/5 rounded-xl transition-all"
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Thêm Root Node
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {configMode === 'diagram' ? (
                                    <MetaPackVisualDesigner 
                                        items={versionItems}
                                        metaSets={metaSets}
                                        onUpdate={setVersionItems}
                                        disabled={isView}
                                    />
                                ) : (
                                    <div className="space-y-4 min-h-[400px]">
                                        {versionItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-3xl bg-muted/20 border-border/50">
                                                <div className="p-5 bg-background rounded-full shadow-sm mb-5">
                                                    <Layout className="h-10 w-10 text-muted-foreground/30" />
                                                </div>
                                                <p className="text-muted-foreground font-bold tracking-tight">Chưa có cấu trúc dữ liệu nào.</p>
                                                <p className="text-[11px] text-muted-foreground/60 mt-1 uppercase font-black tracking-widest">Bắt đầu bằng cách thêm root node</p>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    className="mt-6 rounded-xl px-6 h-10 font-bold shadow-sm"
                                                    onClick={() => setVersionItems([{ endpointAlias: '', returnType: 'OBJECT', metaCode: '' }])}
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Bắt đầu tạo cấu trúc
                                                </Button>
                                            </div>
                                        ) : (
                                            versionItems.map((item, index) => (
                                                <SchemaNodeBuilder
                                                    key={index}
                                                    item={item}
                                                    metaSets={metaSets}
                                                    disabled={isView}
                                                    onUpdate={(updatedItem) => {
                                                        const newItems = [...versionItems];
                                                        newItems[index] = updatedItem;
                                                        setVersionItems(newItems);
                                                    }}
                                                    onDelete={() => {
                                                        const newItems = versionItems.filter((_, i) => i !== index);
                                                        setVersionItems(newItems);
                                                    }}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'config' && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Settings className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground/90">Giới hạn truy cập (Rate Limit)</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">Thiết lập giới hạn lưu lượng truy cập mặc định để bảo vệ tài nguyên hệ thống.</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <Card className="border-border/40 shadow-sm overflow-hidden rounded-3xl bg-background">
                                            <CardContent className="p-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b border-border/40">
                                                    <div className="p-10 space-y-5 transition-colors hover:bg-slate-50/30">
                                                        <div className="flex items-center space-x-2.5 text-primary">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <Zap className="h-4 w-4" />
                                                            </div>
                                                            <Label htmlFor="maxRequestsPerMinute" className="text-base font-bold">Requests mỗi Phút</Label>
                                                        </div>
                                                        <div className="relative group">
                                                            <Input 
                                                                id="maxRequestsPerMinute" 
                                                                type="number" 
                                                                value={formData.maxRequestsPerMinute ?? ''} 
                                                                onChange={(e) => setFormData({...formData, maxRequestsPerMinute: e.target.value ? parseInt(e.target.value) : null})} 
                                                                disabled={isView}
                                                                className="h-16 text-3xl font-extrabold shadow-none border-none bg-accent/20 focus-visible:ring-0 rounded-2xl px-6 transition-all group-hover:bg-accent/40"
                                                                placeholder="60"
                                                            />
                                                            <span className="absolute right-6 top-5 text-muted-foreground/60 font-bold text-sm tracking-tighter">REQ/MIN</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            Kiểm soát tốc độ request tức thời. Giúp hệ thống tránh được tình trạng quá tải cục bộ.
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="p-10 space-y-5 transition-colors hover:bg-slate-50/30">
                                                        <div className="flex items-center space-x-2.5 text-blue-600">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <Layout className="h-4 w-4" />
                                                            </div>
                                                            <Label htmlFor="maxRequestsPerDay" className="text-base font-bold">Requests mỗi Ngày</Label>
                                                        </div>
                                                        <div className="relative group">
                                                            <Input 
                                                                id="maxRequestsPerDay" 
                                                                type="number" 
                                                                value={formData.maxRequestsPerDay ?? ''} 
                                                                onChange={(e) => setFormData({...formData, maxRequestsPerDay: e.target.value ? parseInt(e.target.value) : null})} 
                                                                disabled={isView}
                                                                className="h-16 text-3xl font-extrabold shadow-none border-none bg-accent/20 focus-visible:ring-0 rounded-2xl px-6 transition-all group-hover:bg-accent/40"
                                                                placeholder="10,000"
                                                            />
                                                            <span className="absolute right-6 top-5 text-muted-foreground/60 font-bold text-sm tracking-tighter">REQ/DAY</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            Hạn mức lưu lượng tối đa trong chu kỳ 24 giờ cho mỗi đơn vị đăng ký sử dụng.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-6 bg-primary/[0.02] flex items-center justify-between border-t border-border/40 px-10">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-border/40 flex items-center justify-center text-primary">
                                                            <Zap className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-extrabold text-foreground/80 tracking-tight">Thuật toán Token Bucket</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Active Rate Limiting Strategy</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20 shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[10px] font-extrabold text-green-700 uppercase tracking-widest">System Protected</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    <div className="lg:col-span-1 space-y-6">
                                        <Card className="border-border/50 shadow-sm bg-muted/10 border-dashed rounded-3xl">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-bold flex items-center text-foreground/70">
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Lưu ý quan trọng
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-5">
                                                <div className="space-y-4">
                                                    {[
                                                        "Giá trị mặc định sẽ áp dụng cho tất cả thuê bao mới đăng ký.",
                                                        "Để cấu hình riêng cho từng đối tác, hãy vào mục Quản lý Đăng ký.",
                                                        "Đặt giá trị là 0 hoặc bỏ trống để không áp dụng giới hạn.",
                                                        "Mọi thay đổi sẽ có hiệu lực ngay lập tức trên hệ thống Gateway."
                                                    ].map((note, i) => (
                                                        <div key={i} className="flex items-start space-x-3 group">
                                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                                                            <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="pt-6 border-t border-border/40 mt-4">
                                                    <div className="p-4 bg-background rounded-2xl border border-border/40 shadow-inner space-y-2">
                                                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Giám sát hệ thống</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-foreground/80">API Gateway</span>
                                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">CONNECTED</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'versions' && (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Lịch sử phiên bản</CardTitle>
                                        <CardDescription>
                                            Mỗi version được tạo khi hash của JSON cấu hình trả về thay đổi.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-28">Version</TableHead>
                                                    <TableHead className="w-32">Trạng thái</TableHead>
                                                    <TableHead className="w-28">Node</TableHead>
                                                    <TableHead>Data hash</TableHead>
                                                    <TableHead className="w-44">Ngày tạo</TableHead>
                                                    <TableHead className="w-24"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {versionsLoading && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                            Đang tải phiên bản...
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {!versionsLoading && versions.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                            Chưa có phiên bản MetaPack nào.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {!versionsLoading && versions.map((version) => (
                                                    <TableRow
                                                        key={version.id}
                                                        data-state={selectedVersion?.id === version.id ? 'selected' : undefined}
                                                    >
                                                        <TableCell className="font-mono font-semibold">
                                                            v{version.versionNumber}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{version.status || 'DRAFT'}</Badge>
                                                        </TableCell>
                                                        <TableCell>{countVersionNodes(version.dataConfig)}</TableCell>
                                                        <TableCell>
                                                            <span className="block max-w-[420px] truncate font-mono text-xs text-muted-foreground">
                                                                {version.dataHash || '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDateTime(version.createdAt)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedVersion(version)}
                                                            >
                                                                Xem JSON
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                {selectedVersion && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                JSON cấu hình v{selectedVersion.versionNumber}
                                            </CardTitle>
                                            <CardDescription>
                                                Đây là dữ liệu `config_data` dùng để tính `data_hash`.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
                                                {selectedVersion.dataConfig || '[]'}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {activeTab === 'registrations' && id && (
                            <div className="space-y-6">
                                <MetaPackRegistrationsTab packId={id} />
                            </div>
                        )}
                    </form>
                </div>
            </div>
    );
};
