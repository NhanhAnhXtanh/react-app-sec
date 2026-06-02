import { useQuery } from '@tanstack/react-query';
import { Database, ChevronRight } from 'lucide-react';
import { metaSourceApi } from '@/api/metasource.api';
import type { MetaSource } from '@/model/metasource.types';

type Props = {
  onSelect: (source: MetaSource) => void;
};

export function MetaSourceListView({ onSelect }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['meta-sources', 'sidebar'],
    queryFn: () => metaSourceApi.search({ pageIndex: 0, pageSize: 1000 }),
    staleTime: 60_000,
  });

  const sources = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Đang tải danh sách Data Sources...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-40 text-destructive text-sm">
        Không thể tải danh sách Data Sources.
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Chưa có Data Source nào.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sources.map((src) => (
        <button
          key={src.id}
          type="button"
          onClick={() => onSelect(src)}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm hover:border-primary/50 hover:bg-accent transition-colors group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
            <Database className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{src.name}</p>
            <p className="text-xs text-muted-foreground truncate">{src.code}</p>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      ))}
    </div>
  );
}
