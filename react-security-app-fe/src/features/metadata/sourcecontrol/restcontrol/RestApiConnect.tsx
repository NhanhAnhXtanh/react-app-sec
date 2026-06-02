import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MetaSource } from '@/model/metasource.types';
import type { MetaSet } from '@/model/metaset.types';
import { parseConnectorConfig } from '@/features/metadata/metasource/connector-schemas';
import { EndpointList } from './EndpointList';
import { PostmanPanel } from './PostmanPanel';

type Props = {
  metaSource: MetaSource;
};

export function RestApiConnect({ metaSource }: Props) {
  const [selected, setSelected] = useState<MetaSet | null>(null);
  const queryClient = useQueryClient();

  const cfg = parseConnectorConfig(metaSource.connectorConfig);
  const baseUrl = (cfg.baseUrl as string | undefined) ?? '';

  const handleSaved = (updated: MetaSet) => {
    setSelected(updated);
    void queryClient.invalidateQueries({
      queryKey: ['meta-sets', 'by-source', metaSource.id],
    });
  };

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-64 shrink-0 overflow-hidden border-r border-border bg-muted/20">
        <EndpointList
          metaSourceId={metaSource.id}
          selected={selected}
          onSelect={setSelected}
        />
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-card/40 px-6 text-center">
            <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              REST Source Control
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Chọn một endpoint để bắt đầu.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Danh sách bên trái lấy từ MetaSet của source này. Khi chọn xong, bạn có thể cấu hình request và test response giống Postman.
              </p>
            </div>
          </div>
        ) : (
          <PostmanPanel
            key={selected.id}
            metaSourceId={metaSource.id}
            baseUrl={baseUrl}
            selected={selected}
            onSaved={handleSaved}
          />
        )}
      </main>
    </div>
  );
}
