import type { QueryClient } from '@tanstack/react-query';
import type { MetaSetVersion } from '@/model/metasetversion.types';

const LIST_PREFIX = ['meta-set-versions', 'list'] as const;
const BY_ID_PREFIX = ['meta-set-versions', 'byId'] as const;

export function getMetaSetVersionListKey(
  metaCode: string | null,
): readonly unknown[] {
  return [...LIST_PREFIX, metaCode ?? '__none__'];
}

export function getMetaSetVersionByIdKey(id: string): readonly unknown[] {
  return [...BY_ID_PREFIX, id];
}

export function appendMetaSetVersionToList(
  qc: QueryClient,
  metaCode: string,
  item: MetaSetVersion,
): void {
  qc.setQueryData<MetaSetVersion[]>(
    getMetaSetVersionListKey(metaCode),
    (old) => (old ? [item, ...old] : [item]),
  );
}

export function removeMetaSetVersionFromList(
  qc: QueryClient,
  metaCode: string,
  id: string,
): void {
  qc.setQueryData<MetaSetVersion[]>(
    getMetaSetVersionListKey(metaCode),
    (old) => (old ? old.filter((v) => v.id !== id) : old),
  );
}

