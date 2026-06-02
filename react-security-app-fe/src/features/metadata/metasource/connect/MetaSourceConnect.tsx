import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { metaSourceApi } from '@/api/metasource.api';
import { metaSourceConnectApi } from '@/api/metasource-connect.api';
import { withSearch } from '@/shared/router/withSearch';
import { getMetaSourceByIdKey } from '../metasource.cache';
import { SchemaTree } from '@/features/metadata/sourcecontrol/dbcontrol/tree/SchemaTree';
import { SchemaDiagram } from '@/features/metadata/sourcecontrol/dbcontrol/diagram/SchemaDiagram';
import { QueryPanel } from '@/features/metadata/sourcecontrol/dbcontrol/query/QueryPanel';
import { RestApiConnect } from '@/features/metadata/sourcecontrol/restcontrol/RestApiConnect';
import { MetaSyncExtractDialog } from '@/features/metadata/metasync/detail/MetaSyncExtractDialog';
import { metaSyncApi } from '@/api/metasync.api';
import { parseConnectorConfig } from '@/features/metadata/metasource/connector-schemas';
import type { Schema, SchemaTable } from '@/features/metadata/sourcecontrol/dbcontrol/types';
import type { MetaSync, FieldItem } from '@/model/metasync.types';
import type { MetaSyncExtractPayload } from '@/api/metasync.api';

function metaSyncsToSchema(metaSyncs: MetaSync[]): Schema {
	const tables: SchemaTable[] = metaSyncs
		.filter((ms) => !ms.deleted && !!ms.metaCode)
		.map((ms) => {
			const fields: FieldItem[] = ms.fieldData ? (JSON.parse(ms.fieldData) as FieldItem[]) : [];
			return {
				name: ms.metaCode!,
				fields: fields.map((f) => ({
					name: f.name,
					type: f.dataType,
					nullable: f.isNull,
					pk: f.isPrimaryKey,
					fk: null,
				})),
			};
		});
	return { tables };
}

type Tab = 'query' | 'diagram';

export function MetaSourceConnect() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [tab, setTab] = useState<Tab>('query');
	const [extractOpen, setExtractOpen] = useState(false);

	const search = useMemo(() => {
		const s = searchParams.toString();
		return s ? `?${s}` : '';
	}, [searchParams]);

	const queryClient = useQueryClient();

	const itemQuery = useQuery({
		queryKey: id ? getMetaSourceByIdKey(id) : ['meta-sources', 'byId', '__none__'],
		queryFn: () => metaSourceApi.getById(id!),
		enabled: !!id,
	});

	const rawMetaSyncQuery = useQuery({
		queryKey: ['meta-source-metasyncs', id],
		queryFn: () => metaSourceConnectApi.listMetaSyncs(id!),
		enabled: !!id,
		staleTime: 30_000,
	});

	const schemaData = useMemo(() => {
		return rawMetaSyncQuery.data ? metaSyncsToSchema(rawMetaSyncQuery.data) : undefined;
	}, [rawMetaSyncQuery.data]);

	const extractMutation = useMutation({
		mutationFn: ({ syncId, payload }: { syncId: string; payload: MetaSyncExtractPayload }) =>
			metaSyncApi.extractToMetaSet(syncId, payload),
		onSuccess: (metaSets) => {
			setExtractOpen(false);
			if (metaSets && metaSets.id) {
				navigate(withSearch(`/meta-sets/${metaSets.id}`, search));
				return;
			}
			navigate(withSearch('/meta-sets', search));
		},
	});

	// Poll schema on mount. Backend deduplicates by field hash and versions only real changes.
	const syncMutation = useMutation({
		mutationFn: () => metaSourceConnectApi.syncSource(id!),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['meta-source-metasyncs', id] });
		},
	});

	useEffect(() => {
		if (id) {
			syncMutation.mutate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const isSchemaLoading = rawMetaSyncQuery.isLoading;
	const isSchemaError = rawMetaSyncQuery.isError;
	const schemaError = rawMetaSyncQuery.error;

	const goBack = () => {
		if (!id) {
			navigate('/meta-sources');
			return;
		}
		navigate(withSearch(`/meta-sources/${id}`, search));
	};

	const item = itemQuery.data;
	const offlineMessage =
		syncMutation.data?.syncMode === 'OFFLINE'
			? syncMutation.data.message ?? 'Đang dùng MetaSync cache ở chế độ offline.'
			: null;
	const isOfflineMode =
		!!offlineMessage ||
		rawMetaSyncQuery.data?.some((metaSync) => metaSync.status === 'OFFLINE');

	const baseUrl = useMemo(() => {
		if (item?.connectorType !== 'REST' || !item.connectorConfig) return null;
		const cfg = parseConnectorConfig(item.connectorConfig);
		return (cfg.baseUrl as string | undefined) ?? null;
	}, [item]);

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background">
			<header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2">
				<Button type="button" variant="outline" size="sm" onClick={goBack}>
					← Đóng
				</Button>
				<h1 className="truncate text-base font-semibold">
					Source Connect
					{item && (
						<span className="ml-2 font-mono text-xs text-muted-foreground">
							{item.code} · {item.name}
						</span>
					)}
				</h1>
				{item?.connectorType && (
					<span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
						{item.connectorType}
					</span>
				)}
				{baseUrl && (
					<span className="truncate font-mono text-xs text-muted-foreground">
						{baseUrl}
					</span>
				)}
				{isOfflineMode && (
					<span
						className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700"
						title={offlineMessage ?? 'Đang dùng MetaSync cache ở chế độ offline.'}
					>
						Offline
					</span>
				)}
				<div className="ml-auto">
					<Button
						type="button"
						size="sm"
						disabled={!id || isSchemaLoading || !rawMetaSyncQuery.data?.length}
						onClick={() => setExtractOpen(true)}
					>
						Extract → MetaSet
					</Button>
				</div>
			</header>

			{!id ? (
				<div className="p-6 text-sm text-destructive">Thiếu id MetaSource.</div>
			) : itemQuery.isError ? (
				<div className="p-6 text-sm text-destructive">
					Không tải được MetaSource {id}.
				</div>
			) : itemQuery.isLoading ? (
				<div className="p-6 text-sm text-muted-foreground">Đang tải…</div>
			) : item?.connectorType === 'REST' ? (
				<RestApiConnect metaSource={item} />
			) : isSchemaLoading ? (
				<div className="p-6 text-sm text-muted-foreground">Đang fetch schema…</div>
			) : isSchemaError ? (
				<div className="p-6 text-sm text-destructive">
					Lỗi fetch schema:{' '}
					{schemaError instanceof Error
						? schemaError.message
						: 'Unknown'}
				</div>
			) : !schemaData ? (
				<div className="p-6 text-sm text-muted-foreground">Chưa có schema.</div>
			) : (
				<div className="flex min-h-0 flex-1">
					<aside className="w-72 shrink-0 overflow-y-auto border-r border-border bg-muted/20 p-2">
						<div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Schema
						</div>
						<SchemaTree schema={schemaData} />
					</aside>

					<main className="flex min-w-0 flex-1 flex-col">
						<nav className="flex shrink-0 items-center border-b border-border bg-card px-2">
							<TabButton
								label="Query"
								active={tab === 'query'}
								onClick={() => setTab('query')}
							/>
							<TabButton
								label="Diagram"
								active={tab === 'diagram'}
								onClick={() => setTab('diagram')}
							/>
						</nav>

						<div className={`min-h-0 flex-1 ${tab === 'query' ? '' : 'hidden'}`}>
							<QueryPanel metaSourceId={id} schema={schemaData} />
						</div>
						<div className={`min-h-0 flex-1 ${tab === 'diagram' ? '' : 'hidden'}`}>
							<SchemaDiagram schema={schemaData} />
						</div>
					</main>
				</div>
			)}

			<MetaSyncExtractDialog
				open={extractOpen}
				metaSourceId={id ?? null}
				metaSourceName={
					item ? `${item.code}${item.name ? ` · ${item.name}` : ''}` : null
				}
				sourceMetaSyncs={rawMetaSyncQuery.data}
				busy={extractMutation.isPending}
				onConfirm={(payload, syncId) => {
					if (syncId) extractMutation.mutate({ syncId, payload });
				}}
				onCancel={() => setExtractOpen(false)}
			/>
		</div>
	);
}

function TabButton({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`px-4 py-2 text-sm font-medium transition-colors ${active
					? 'border-b-2 border-primary text-primary'
					: 'text-muted-foreground hover:text-foreground'
				}`}
		>
			{label}
		</button>
	);
}
