import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/shared/form/SearchInput';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { organizationApi, domainApi } from '@/api/catalog.api';
import { metaSourceApi } from '@/api/metasource.api';
import type { ColumnFiltersState } from '@tanstack/react-table';

type Props = {
  keyword: string;
  selectedCount: number;
  onKeywordChange: (value: string) => void;
  filters: ColumnFiltersState;
  onFilterChange: (id: string, value: string) => void;
  onCreateDialog?: () => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
};

export function MetaSetTableToolbar({
  keyword,
  selectedCount,
  onKeywordChange,
  filters,
  onFilterChange,
  onCreateDialog,
  onEditSelected,
  onDeleteSelected,
}: Props) {
  const editEnabled = selectedCount === 1;

  const orgQuery = useQuery({
    queryKey: ['organizations', 'listAll'],
    queryFn: organizationApi.listAll,
  });

  const domainQuery = useQuery({
    queryKey: ['domains', 'listAll'],
    queryFn: domainApi.listAll,
  });

  const sourceQuery = useQuery({
    queryKey: ['metaSources', 'listAll'],
    queryFn: metaSourceApi.listAll,
  });

  const getFilterValue = (id: string) => {
    return (filters.find((f) => f.id === id)?.value as string) || '';
  };

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={keyword}
          onValueChange={onKeywordChange}
          placeholder="Tìm theo code, tên…"
          className="w-64"
        />

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedCount} đã chọn
            </span>
          )}
          {onEditSelected && (
            <Button
              type="button"
              variant="outline"
              onClick={onEditSelected}
              disabled={!editEnabled}
              title={editEnabled ? 'Sửa dòng đã chọn' : 'Chọn đúng 1 dòng để sửa'}
            >
              Sửa
            </Button>
          )}
          {onDeleteSelected && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
            >
              Xoá đã chọn
            </Button>
          )}
          {onCreateDialog && (
            <Button type="button" onClick={onCreateDialog}>
              + Tạo mới
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Lọc theo meta code..."
          value={getFilterValue('metaCode')}
          onChange={(e) => onFilterChange('metaCode', e.target.value)}
          className="w-48 bg-background h-8 text-sm"
        />

        <Select
          value={getFilterValue('organizationId')}
          onValueChange={(val) => onFilterChange('organizationId', val === 'ALL' ? '' : val)}
        >
          <SelectTrigger className="w-48 bg-background h-8">
            <SelectValue placeholder="Chọn tổ chức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">-- Tất cả tổ chức --</SelectItem>
            {orgQuery.data?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={getFilterValue('domainId')}
          onValueChange={(val) => onFilterChange('domainId', val === 'ALL' ? '' : val)}
        >
          <SelectTrigger className="w-48 bg-background h-8">
            <SelectValue placeholder="Chọn lĩnh vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">-- Tất cả lĩnh vực --</SelectItem>
            {domainQuery.data?.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={getFilterValue('metaSourceId')}
          onValueChange={(val) => onFilterChange('metaSourceId', val === 'ALL' ? '' : val)}
        >
          <SelectTrigger className="w-48 bg-background h-8">
            <SelectValue placeholder="Chọn nguồn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">-- Tất cả nguồn --</SelectItem>
            {sourceQuery.data?.map((src) => (
              <SelectItem key={src.id} value={src.id}>
                {src.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
