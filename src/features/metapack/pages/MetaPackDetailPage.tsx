import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { metapackApi } from '../api/metapack-api';
import { MetaPackDto } from '../types/metapack';
import { MetaPackRegistrationsTab } from '../components/MetaPackRegistrationsTab';

export const MetaPackDetailPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pack, setPack] = useState<MetaPackDto | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'info' | 'structure' | 'versions' | 'registrations'>('info');

    useEffect(() => {
        const fetchPack = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await metapackApi.getById(id);
                setPack(data);
            } catch (error) {
                console.error('Failed to fetch MetaPack:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPack();
    }, [id]);

    if (loading) return <div className="p-6">Đang tải dữ liệu...</div>;
    if (!pack) return <div className="p-6">Không tìm thấy MetaPack.</div>;

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/metapacks')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{pack.name}</h1>
                        <p className="text-muted-foreground text-sm font-mono">{pack.code}</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => navigate(`/metapacks/${pack.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
                </div>
            </div>

            <div className="flex border-b mb-4">
                <button 
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('info')}
                >
                    Thông tin chung
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'structure' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('structure')}
                >
                    Cấu trúc dữ liệu
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'versions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('versions')}
                >
                    Phiên bản
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'registrations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('registrations')}
                >
                    Quản lý Đăng ký
                </button>
            </div>

            {activeTab === 'info' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết gói dữ liệu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                <p className="font-medium">{pack.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phiên bản hiện tại</p>
                                <p className="font-medium">{pack.currentVersionId ? 'Có phiên bản' : 'Chưa thiết lập'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rate limit (phút)</p>
                                <p className="font-medium">{pack.maxRequestsPerMinute || '60'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rate limit (ngày)</p>
                                <p className="font-medium">{pack.maxRequestsPerDay || '10000'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Mô tả</p>
                                <p className="whitespace-pre-wrap mt-1">{pack.description || 'Không có mô tả'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'structure' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cấu trúc gói dữ liệu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!pack.versionItems || pack.versionItems.length === 0) ? (
                            <div className="py-8 text-center text-muted-foreground italic">
                                Chưa có cấu trúc dữ liệu nào được thiết lập.
                            </div>
                        ) : (
                            <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                                {pack.versionItems.map((item, index) => (
                                    <div key={item.id} className="p-3 bg-background rounded-md border shadow-sm flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{index + 1}</span>
                                            <div>
                                                <p className="font-semibold text-sm">{item.endpointAlias}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{item.metaCode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{item.returnType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'versions' && (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        Tính năng quản lý các Version của MetaPack sẽ được phát triển trong giai đoạn sau.
                    </CardContent>
                </Card>
            )}

            {activeTab === 'registrations' && (
                <MetaPackRegistrationsTab packId={pack.id} />
            )}
        </div>
    );
};
