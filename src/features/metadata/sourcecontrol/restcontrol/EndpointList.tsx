import { useQuery } from '@tanstack/react-query';
import { metaSetApi } from '@/api/metaset.api';
import type { MetaSet } from '@/model/metaset.types';

type Props = {
  metaSourceId: string;
  selected: MetaSet | null;
  onSelect: (item: MetaSet) => void;
  onUpdated?: (item: MetaSet) => void;
};

export function EndpointList({ metaSourceId, selected, onSelect }: Props) {
  const query = useQuery({
    queryKey: ['meta-sets', 'by-source', metaSourceId],
    queryFn: () => metaSetApi.listBySource(metaSourceId),
    staleTime: 30_000,
  });

  const items = query.data ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Endpoints
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading && (
          <div className="p-3 text-xs text-muted-foreground">Đang tải…</div>
        )}
        {query.isError && (
          <div className="p-3 text-xs text-destructive">
            {query.error instanceof Error ? query.error.message : 'Lỗi'}
          </div>
        )}
        {!query.isLoading && items.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">Chưa có MetaSet nào.</div>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full border-b border-border/50 px-3 py-2 text-left transition-colors hover:bg-muted/60 ${selected?.id === item.id ? 'bg-muted' : ''
              }`}
          >
            <div className="flex items-center gap-2">
              {item.endpointPath && (
                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {getMethod(item)}
                </span>
              )}
              <span className="truncate text-xs font-medium">{item.name || item.code}</span>
            </div>
            {item.endpointPath && (
              <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {item.endpointPath}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function getMethod(item: MetaSet): string {
  const primaryCode = item.endpointConfig?.primaryOperationCode?.trim();
  const primaryType = item.endpointConfig?.primaryOperationType?.trim();
  const operations = item.operations?.filter((operation) => operation.enabled !== false) ?? [];
  const primaryOperation =
    (primaryCode
      ? operations.find((operation) => operation.code?.trim() === primaryCode)
      : undefined)
    ?? (primaryType
      ? operations.find((operation) => operation.operationType === primaryType)
      : undefined)
    ?? operations[0];
  return primaryOperation?.method ?? 'GET';
}
