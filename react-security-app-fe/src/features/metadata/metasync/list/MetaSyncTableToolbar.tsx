import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/shared/form/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { metaSourceApi } from '@/api/metasource.api';
import { organizationApi, domainApi } from '@/api/catalog.api';
import type { MetaSyncFilters } from '@/api/metasync.api';

type Props = {
  keyword: string;
  filters: MetaSyncFilters;
  selectedCount: number;
  onKeywordChange: (value: string) => void;
  onFiltersChange: (filters: MetaSyncFilters) => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
};

const ALL = '__all__';

export function MetaSyncTableToolbar({
  keyword,
  filters,
  selectedCount,
  onKeywordChange,
  onFiltersChange,
  onEditSelected,
  onDeleteSelected,
}: Props) {
  const editEnabled = selectedCount === 1;

  const { data: sourcesData } = useQuery({
    queryKey: ['meta-sources', 'filter-list'],
    queryFn: () => metaSourceApi.search({ pageIndex: 0, pageSize: 1000 }),
    staleTime: 60_000,
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations', 'filter-list'],
    queryFn: () => organizationApi.listAll(),
    staleTime: 60_000,
  });

  const { data: domainsData } = useQuery({
    queryKey: ['domains', 'filter-list'],
    queryFn: () => domainApi.listAll(),
    staleTime: 60_000,
  });

  const sources = sourcesData?.items ?? [];
  const orgs = orgsData ?? [];
  const domains = domainsData ?? [];

  const setFilter = (key: keyof MetaSyncFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={keyword}
          onValueChange={onKeywordChange}
          placeholder="Tìm theo code, tên MetaSync…"
        />

        <Select
          value={filters.dataSourceId ?? ALL}
          onValueChange={(v) => setFilter('dataSourceId', v === ALL ? undefined : v)}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Tất cả nguồn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả nguồn</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.organizationId ?? ALL}
          onValueChange={(v) => setFilter('organizationId', v === ALL ? undefined : v)}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Tất cả tổ chức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả tổ chức</SelectItem>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.domainId ?? ALL}
          onValueChange={(v) => setFilter('domainId', v === ALL ? undefined : v)}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Tất cả lĩnh vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả lĩnh vực</SelectItem>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        </div>
      </div>
    </div>
  );
}
