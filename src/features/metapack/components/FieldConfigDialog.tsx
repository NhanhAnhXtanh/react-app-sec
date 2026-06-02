import React, { useState, useEffect, useMemo } from 'react';
import { ListFilter, Search, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { metaSetVersionApi } from '@/api/metasetversion.api';
import { MetaPackField } from '../types/metapack';

interface FieldConfigDialogProps {
    open: boolean;
    onClose: () => void;
    metaCode: string;
    selectedFields: MetaPackField[];
    onSave: (fields: MetaPackField[]) => void;
    disabled?: boolean;
}

export const FieldConfigDialog: React.FC<FieldConfigDialogProps> = ({ 
    open, onClose, metaCode, selectedFields, onSave, disabled = false 
}) => {
    const [fields, setFields] = useState<MetaPackField[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open && metaCode) {
            setLoading(true);
            metaSetVersionApi.listByMetaCode(metaCode)
                .then(versions => {
                    if (versions && versions.length > 0) {
                        const latest = versions.sort((a, b) => b.versionNo - a.versionNo)[0];
                        if (latest.fieldData) {
                            try {
                                const parsedFields = JSON.parse(latest.fieldData);
                                const mapped = parsedFields.map((f: any) => {
                                    const existing = selectedFields.find(sf => sf.fieldName === f.name);
                                    return {
                                        fieldName: f.name,
                                        alias: existing?.alias || f.name,
                                        type: f.dataType,
                                        included: !!existing
                                    };
                                });
                                setFields(mapped);
                            } catch (e) { console.error(e); }
                        }
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, metaCode, selectedFields]);

    const filteredFields = useMemo(() => {
        return fields.filter(f => 
            f.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            f.alias.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [fields, searchTerm]);

    const handleToggleAll = (included: boolean) => {
        setFields(fields.map(f => ({ ...f, included })));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 bg-slate-50 border-b">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <ListFilter className="h-6 w-6" />
                        </div>
                        Cấu hình trường dữ liệu
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 mt-1.5 font-medium">
                        Chọn và đặt tên alias cho các trường dữ liệu từ MetaSet: <span className="text-primary font-bold px-2 py-0.5 bg-primary/5 rounded-md ml-1 font-mono">{metaCode}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-white flex flex-col min-h-0">
                    <div className="relative mb-6">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Tìm kiếm theo tên trường hoặc alias..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 border-slate-200 bg-slate-50/50 rounded-xl focus-visible:ring-primary/20"
                        />
                    </div>

                    <ScrollArea className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/20">
                        <Table>
                            <TableHeader className="bg-slate-100/80 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="w-[60px] text-center">
                                        <Checkbox 
                                            checked={fields.length > 0 && fields.every(f => f.included)}
                                            onCheckedChange={(v) => handleToggleAll(!!v)}
                                            disabled={disabled}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tên trường gốc</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Kiểu dữ liệu</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Alias (Hiển thị API)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <span className="text-sm font-medium text-slate-500 italic">Đang tải danh sách trường...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredFields.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <X className="h-10 w-10" />
                                                <span className="text-sm font-medium">Không tìm thấy trường nào</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFields.map((field, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-100/50 transition-colors border-slate-100 group">
                                            <TableCell className="text-center">
                                                <Checkbox 
                                                    checked={field.included}
                                                    onCheckedChange={(v) => {
                                                        const newFields = [...fields];
                                                        const targetIdx = fields.findIndex(f => f.fieldName === field.fieldName);
                                                        newFields[targetIdx] = { ...field, included: !!v };
                                                        setFields(newFields);
                                                    }}
                                                    disabled={disabled}
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{field.fieldName}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-mono text-[10px] px-2 py-0">
                                                    {field.type || 'UNKNOWN'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={field.alias}
                                                    onChange={(e) => {
                                                        const newFields = [...fields];
                                                        const targetIdx = fields.findIndex(f => f.fieldName === field.fieldName);
                                                        newFields[targetIdx] = { ...field, alias: e.target.value };
                                                        setFields(newFields);
                                                    }}
                                                    placeholder={field.fieldName}
                                                    disabled={disabled}
                                                    className="h-8 text-sm bg-transparent border-transparent hover:border-slate-300 focus:bg-white focus:border-primary/50 transition-all font-medium"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-8 bg-slate-50/80 border-t gap-3">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 h-11 font-bold border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm">Huỷ bỏ</Button>
                    <Button 
                        type="button"
                        disabled={disabled || loading} 
                        onClick={() => {
                            onSave(fields.filter(f => f.included));
                            onClose();
                        }}
                        className="rounded-xl px-8 h-11 font-extrabold shadow-lg shadow-primary/20 bg-primary hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <Check className="h-5 w-5" />
                        Lưu cấu hình
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
