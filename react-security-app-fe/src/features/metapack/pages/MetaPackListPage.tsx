import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type RowSelectionState,
    type SortingState,
} from '@tanstack/react-table';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Filter, MoreHorizontal, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { metaSetApi } from '@/api/metaset.api';
import type { MetaSet } from '@/model/metaset.types';
import { SearchInput } from '@/shared/form/SearchInput';
import { TablePagination } from '@/shared/table/TablePagination';
import { metapackApi } from '../api/metapack-api';
import { MetaPackDto, MetaPackVersionItemDto } from '../types/metapack';

const statusClassName: Record<MetaPackDto['status'], string> = {
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
    DISCONTINUED: 'bg-slate-100 text-slate-700 border-slate-200',
};

type SourceSummary = {
    code: string;
    name: string;
};

type MetaPackListRow = MetaPackDto & {
    sourceSummaries: SourceSummary[];
    sourceCodes: string[];
    sourceNames: string[];
};

const collectMetaCodes = (items?: MetaPackVersionItemDto[]): string[] => {
    if (!items || items.length === 0) return [];

    const result = new Set<string>();
    const visit = (node: MetaPackVersionItemDto) => {
        if (node.metaCode?.trim()) {
            result.add(node.metaCode.trim());
        }
        (node.children || []).forEach(visit);
    };

    items.forEach(visit);
    return Array.from(result);
};

export const MetaPackListPage: React.FC = () => {
    const [packs, setPacks] = useState<MetaPackDto[]>([]);
    const [metaSets, setMetaSets] = useState<MetaSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedSourceCodes, setSelectedSourceCodes] = useState<string[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const navigate = useNavigate();

    const fetchPacks = async () => {
        try {
            setLoading(true);
            const data = await metapackApi.getAll();
            setPacks(data);
        } catch (error) {
            console.error('Failed to fetch MetaPacks:', error);
            toast.error('Không tải được danh sách MetaPack');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPacks();
    }, []);

    useEffect(() => {
        const fetchMetaSets = async () => {
            try {
                const data = await metaSetApi.listAll();
                setMetaSets(data);
            } catch (error) {
                console.error('Failed to fetch MetaSets for MetaPack source filter:', error);
                toast.error('Không tải được danh sách nguồn dữ liệu');
            }
        };
        fetchMetaSets();
    }, []);

    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

    const packRows = useMemo<MetaPackListRow[]>(() => {
        const metaSetByCode = new Map<string, MetaSet>();
        const metaSetByMetaCode = new Map<string, MetaSet>();

        metaSets.forEach((metaSet) => {
            metaSetByCode.set(metaSet.code, metaSet);
            if (metaSet.metaCode) {
                metaSetByMetaCode.set(metaSet.metaCode, metaSet);
            }
        });

        return packs.map((pack) => {
            const sourceMap = new Map<string, SourceSummary>();

            collectMetaCodes(pack.versionItems).forEach((metaCode) => {
                const metaSet = metaSetByCode.get(metaCode) ?? metaSetByMetaCode.get(metaCode);
                if (metaSet?.metaSourceCode) {
                    sourceMap.set(metaSet.metaSourceCode, {
                        code: metaSet.metaSourceCode,
                        name: metaSet.metaSourceName || metaSet.metaSourceCode,
                    });
                }
            });

            const sourceSummaries = Array.from(sourceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            return {
                ...pack,
                sourceSummaries,
                sourceCodes: sourceSummaries.map((source) => source.code),
                sourceNames: sourceSummaries.map((source) => source.name),
            };
        });
    }, [metaSets, packs]);

    const availableSources = useMemo<SourceSummary[]>(() => {
        const sourceMap = new Map<string, SourceSummary>();
        packRows.forEach((row) => {
            row.sourceSummaries.forEach((source) => sourceMap.set(source.code, source));
        });
        return Array.from(sourceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [packRows]);

    const filteredRows = useMemo(() => {
        if (selectedSourceCodes.length === 0) {
            return packRows;
        }
        return packRows.filter((row) =>
            row.sourceCodes.some((sourceCode) => selectedSourceCodes.includes(sourceCode)),
        );
    }, [packRows, selectedSourceCodes]);

    const deletePack = async (pack: MetaPackDto) => {
        const confirmed = window.confirm(`Xoá MetaPack "${pack.name || pack.code}"?`);
        if (!confirmed) return;

        try {
            await metapackApi.delete(pack.id);
            setPacks((current) => current.filter((item) => item.id !== pack.id));
            setRowSelection((current) => {
                const { [pack.id]: _removed, ...rest } = current;
                return rest;
            });
            toast.success('Đã xoá MetaPack');
        } catch (error) {
            console.error('Failed to delete MetaPack:', error);
            toast.error('Xoá MetaPack thất bại');
        }
    };

    const deleteSelected = async () => {
        if (selectedIds.length === 0) return;
        const confirmed = window.confirm(`Xoá ${selectedIds.length} MetaPack đã chọn?`);
        if (!confirmed) return;

        try {
            await Promise.all(selectedIds.map((id) => metapackApi.delete(id)));
            setPacks((current) => current.filter((item) => !selectedIds.includes(item.id)));
            setRowSelection({});
            toast.success('Đã xoá các MetaPack đã chọn');
        } catch (error) {
            console.error('Failed to delete selected MetaPacks:', error);
            toast.error('Xoá MetaPack thất bại');
        }
    };

    const columns = useMemo<ColumnDef<MetaPackListRow>[]>(
        () => [
            {
                id: 'select',
                enableSorting: false,
                size: 40,
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Chọn tất cả dòng trong trang"
                        checked={
                            table.getRowModel().rows.length === 0
                                ? false
                                : table.getIsAllPageRowsSelected()
                                  ? true
                                  : table.getIsSomePageRowsSelected()
                                    ? 'indeterminate'
                                    : false
                        }
                        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Chọn MetaPack ${row.original.code}`}
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onCheckedChange={() => row.toggleSelected(!row.getIsSelected())}
                    />
                ),
            },
            {
                accessorKey: 'code',
                header: 'Code',
                cell: (info) => <span className="font-mono text-sm">{String(info.getValue() ?? '-')}</span>,
            },
            {
                accessorKey: 'name',
                header: 'Tên MetaPack',
                cell: (info) => <span className="font-medium">{String(info.getValue() ?? '-')}</span>,
            },
            {
                accessorKey: 'description',
                header: 'Mô tả',
                enableSorting: false,
                cell: (info) => (
                    <span className="line-clamp-1 max-w-[360px] text-sm text-muted-foreground">
                        {String(info.getValue() || 'Chưa có mô tả')}
                    </span>
                ),
            },
            {
                id: 'sources',
                accessorFn: (row) => row.sourceNames.join(', '),
                header: 'Nguồn dữ liệu',
                enableSorting: false,
                cell: ({ row }) => {
                    const sources = row.original.sourceSummaries;
                    if (sources.length === 0) {
                        return <span className="text-sm text-muted-foreground">Chưa xác định</span>;
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {sources.map((source) => (
                                <Badge key={source.code} variant="outline" className="text-xs">
                                    {source.name}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Trạng thái',
                cell: (info) => {
                    const status = info.getValue<MetaPackDto['status']>();
                    return (
                        <Badge variant="outline" className={statusClassName[status]}>
                            {status}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'maxRequestsPerMinute',
                header: 'Rate limit',
                cell: (info) => (
                    <span className="text-sm text-muted-foreground">
                        {info.getValue<number | undefined>() || '∞'}/m
                    </span>
                ),
            },
            {
                accessorKey: 'maxRequestsPerDay',
                header: 'Daily limit',
                cell: (info) => (
                    <span className="text-sm text-muted-foreground">
                        {info.getValue<number | undefined>() || '∞'}/d
                    </span>
                ),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                size: 64,
                cell: ({ row }) => {
                    const pack = row.original;
                    return (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={`Hành động cho ${pack.code}`}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/metapacks/${pack.id}`)}>
                                    Xem
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/metapacks/${pack.id}/edit`)}>
                                    Sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => deletePack(pack)}>
                                    Xoá
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [navigate, selectedIds],
    );

    const table = useReactTable({
        data: filteredRows,
        columns,
        state: {
            globalFilter,
            sorting,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
        getRowId: (row) => row.id,
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        enableRowSelection: true,
    });

    const editSelected = () => {
        if (selectedIds.length !== 1) return;
        navigate(`/metapacks/${selectedIds[0]}/edit`);
    };

    return (
        <section className="space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">MetaPacks</h1>
                    <p className="text-sm text-slate-500">
                        Quản lý các gói dữ liệu (Data Packages) cung cấp cho đối tác.
                    </p>
                </div>
                <Button onClick={() => navigate('/metapacks/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo MetaPack
                </Button>
            </header>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-2 border-b border-border bg-muted/40 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchInput
                            value={globalFilter}
                            onValueChange={setGlobalFilter}
                            placeholder="Tìm theo code, tên MetaPack..."
                        />
                        <div className="w-full max-w-md">
                            <BaseCombobox.Root
                                multiple
                                autoHighlight
                                items={availableSources.map((source) => source.code)}
                                value={selectedSourceCodes}
                                onValueChange={(values) => setSelectedSourceCodes((values ?? []) as string[])}
                            >
                                <BaseCombobox.Chips
                                    className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-2 py-1 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
                                >
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <BaseCombobox.Value>
                                        {(values) => (
                                            <>
                                                {(values as string[]).map((value) => {
                                                    const source = availableSources.find((item) => item.code === value);
                                                    return (
                                                        <BaseCombobox.Chip
                                                            key={value}
                                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium"
                                                        >
                                                            <span>{source?.name || value}</span>
                                                            <BaseCombobox.ChipRemove className="rounded-sm text-muted-foreground hover:text-foreground">
                                                                <X className="h-3 w-3" />
                                                            </BaseCombobox.ChipRemove>
                                                        </BaseCombobox.Chip>
                                                    );
                                                })}
                                                <BaseCombobox.Input
                                                    placeholder="Lọc theo nguồn dữ liệu..."
                                                    className="min-w-24 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                                                />
                                            </>
                                        )}
                                    </BaseCombobox.Value>
                                </BaseCombobox.Chips>
                                <BaseCombobox.Portal>
                                    <BaseCombobox.Positioner className="z-50 mt-1 w-[var(--anchor-width)]">
                                        <BaseCombobox.Popup className="overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
                                            <BaseCombobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
                                                Không tìm thấy nguồn dữ liệu.
                                            </BaseCombobox.Empty>
                                            <BaseCombobox.List className="max-h-64 overflow-auto p-1">
                                                {availableSources.map((source) => (
                                                    <BaseCombobox.Item
                                                        key={source.code}
                                                        value={source.code}
                                                        className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                                                    >
                                                        <span className="flex h-4 w-4 items-center justify-center">
                                                            <BaseCombobox.ItemIndicator>
                                                                <Check className="h-4 w-4" />
                                                            </BaseCombobox.ItemIndicator>
                                                        </span>
                                                        <div className="flex min-w-0 flex-col">
                                                            <span className="truncate font-medium">{source.name}</span>
                                                            <span className="truncate font-mono text-xs text-muted-foreground">
                                                                {source.code}
                                                            </span>
                                                        </div>
                                                    </BaseCombobox.Item>
                                                ))}
                                            </BaseCombobox.List>
                                        </BaseCombobox.Popup>
                                    </BaseCombobox.Positioner>
                                </BaseCombobox.Portal>
                            </BaseCombobox.Root>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            {selectedIds.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {selectedIds.length} đã chọn
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={editSelected}
                                disabled={selectedIds.length !== 1}
                                title={selectedIds.length === 1 ? 'Sửa dòng đã chọn' : 'Chọn đúng 1 dòng để sửa'}
                            >
                                Sửa
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={deleteSelected}
                                disabled={selectedIds.length === 0}
                            >
                                Xoá đã chọn
                            </Button>
                        </div>
                    </div>
                </div>

                <Table className="rounded-md border-0">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();
                                    return (
                                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                                            {header.isPlaceholder ? null : canSort ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {sorted === 'asc' && (
                                                        <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                                                    )}
                                                    {sorted === 'desc' && (
                                                        <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                                                    )}
                                                    {!sorted && (
                                                        <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">
                                    Đang tải...
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading && table.getRowModel().rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={table.getAllLeafColumns().length} className="h-24 text-center text-muted-foreground">
                                    Chưa có MetaPack nào.
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>

                <TablePagination table={table} />
            </div>
        </section>
    );
};
