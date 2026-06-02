import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MetaPackRegistration } from '../types/metapack';
import { metapackApi } from '../api/metapack-api';

interface MetaPackRegistrationsTabProps {
    packId: string;
}

export const MetaPackRegistrationsTab: React.FC<MetaPackRegistrationsTabProps> = ({ packId }) => {
    const [registrations, setRegistrations] = useState<MetaPackRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Approval Dialog State
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
    const [selectedReg, setSelectedReg] = useState<MetaPackRegistration | null>(null);
    const [apiSettings, setApiSettings] = useState('{\n  "authType": "API_KEY",\n  "headerName": "X-API-Key"\n}');
    const [customLimitPm, setCustomLimitPm] = useState('');
    const [customLimitPd, setCustomLimitPd] = useState('');

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const data = await metapackApi.getRegistrations(packId);
            setRegistrations(data);
        } catch (error) {
            console.error('Failed to fetch registrations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (packId) fetchRegistrations();
    }, [packId]);

    const openApproval = (reg: MetaPackRegistration) => {
        setSelectedReg(reg);
        setIsApprovalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedReg) return;
        try {
            await metapackApi.approveRegistration(
                selectedReg.id,
                apiSettings,
                customLimitPm ? parseInt(customLimitPm) : undefined,
                customLimitPd ? parseInt(customLimitPd) : undefined
            );
            setIsApprovalOpen(false);
            fetchRegistrations(); // refresh
        } catch (error) {
            console.error('Failed to approve', error);
        }
    };

    const handleRevoke = async (regId: string) => {
        if (confirm('Bạn có chắc chắn muốn thu hồi quyền truy cập này?')) {
            try {
                await metapackApi.revokeRegistration(regId);
                fetchRegistrations();
            } catch (error) {
                console.error('Failed to revoke', error);
            }
        }
    };

    if (loading) return <div>Đang tải danh sách đăng ký...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Danh sách Đối tác đăng ký</h3>
                <Button variant="outline" onClick={fetchRegistrations}>Làm mới</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Đối tác</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>API Key</TableHead>
                                <TableHead>Ngày đăng ký</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        Chưa có lượt đăng ký nào.
                                    </TableCell>
                                </TableRow>
                            ) : registrations.map((reg) => (
                                <TableRow key={reg.id}>
                                    <TableCell className="font-medium">{reg.subscriberName}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            reg.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {reg.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {reg.apiKey ? (
                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                {reg.apiKey.substring(0, 8)}...
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        {reg.status === 'PENDING' && (
                                            <Button size="sm" onClick={() => openApproval(reg)}>Phê duyệt</Button>
                                        )}
                                        {reg.status === 'APPROVED' && (
                                            <Button size="sm" variant="destructive" onClick={() => handleRevoke(reg.id)}>Thu hồi</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Approval Dialog */}
            <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phê duyệt Đăng ký</DialogTitle>
                        <DialogDescription>
                            Duyệt yêu cầu khai thác dữ liệu từ đối tác <strong>{selectedReg?.subscriberName}</strong>. 
                            Hệ thống sẽ tự động tạo API Key.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Cấu hình API (Gửi cho đối tác)</Label>
                            <Textarea 
                                value={apiSettings} 
                                onChange={(e) => setApiSettings(e.target.value)} 
                                rows={4} 
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Rate Limit (Phút)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="Mặc định của gói"
                                    value={customLimitPm}
                                    onChange={(e) => setCustomLimitPm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Rate Limit (Ngày)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="Mặc định của gói"
                                    value={customLimitPd}
                                    onChange={(e) => setCustomLimitPd(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApprovalOpen(false)}>Hủy</Button>
                        <Button onClick={handleApprove}>Phê duyệt & Tạo Key</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
