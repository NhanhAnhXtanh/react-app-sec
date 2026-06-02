import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Cookie,
  Copy,
  Ellipsis,
  FileText,
  Filter,
  Globe,
  History,
  Image as ImageIcon,
  Link2,
  ListFilter,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Table2,
  WrapText,
  TextCursorInput,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  metaSourceConnectApi,
  type ApiAuthConfigDTO,
  type ApiAuthType,
  type ApiBodyConfigDTO,
  type ApiBodyType,
  type ApiConfigDTO,
  type ApiHeaderDTO,
  type ApiQueryParamDTO,
  type RestProxyHeader,
  type RestProxyResult,
} from '@/api/metasource-connect.api';
import { metaSetApi } from '@/api/metaset.api';
import type { MetaSet } from '@/model/metaset.types';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const BODY_TYPES: ApiBodyType[] = ['NONE', 'JSON', 'FORM_DATA', 'URL_ENCODED', 'RAW'];
const AUTH_TYPES: ApiAuthType[] = ['NONE', 'BEARER', 'BASIC', 'API_KEY'];
const RESPONSE_FORMATS = ['JSON', 'Raw', 'HTML', 'XML', 'JavaScript', 'Hex', 'Base64'] as const;

type Method = (typeof METHODS)[number];
type Tab = 'docs' | 'params' | 'auth' | 'headers' | 'body' | 'scripts' | 'settings' | 'cookies';
type ResponseTab = 'body' | 'cookies' | 'headers' | 'tests';
type ScriptTab = 'pre-request' | 'post-response';
type ResponseFormat = (typeof RESPONSE_FORMATS)[number];
type VisualizeOption = 'preview' | 'table' | 'linear-chart' | 'bar-graph' | 'prompt';

type Props = {
  metaSourceId: string;
  baseUrl: string;
  selected: MetaSet | null;
  onSaved: (updated: MetaSet) => void;
};

function emptyRow(): ApiQueryParamDTO {
  return { key: '', value: '' };
}

function emptyHeader(): ApiHeaderDTO {
  return { key: '', value: '', canEdit: true };
}

function defaultAuth(): ApiAuthConfigDTO {
  return { authType: 'NONE' };
}

function defaultBody(): ApiBodyConfigDTO {
  return { bodyType: 'NONE' };
}

function getPrimaryMetaSetOperation(ms: MetaSet | null) {
  const operations = ms?.operations?.filter((operation) => operation.enabled !== false) ?? [];
  if (!operations.length) return null;

  const primaryOperationCode = ms?.endpointConfig?.primaryOperationCode?.trim();
  if (primaryOperationCode) {
    const byCode = operations.find((operation) => operation.code?.trim() === primaryOperationCode);
    if (byCode) return byCode;
  }

  const primaryOperationType = ms?.endpointConfig?.primaryOperationType?.trim();
  if (primaryOperationType) {
    const byType = operations.find((operation) => operation.operationType === primaryOperationType);
    if (byType) return byType;
  }

  return operations[0];
}

function configFromMetaSet(ms: MetaSet | null): ApiConfigDTO {
  const structuredOperation = getPrimaryMetaSetOperation(ms);
  return {
    method: structuredOperation?.method ?? 'GET',
    endpointPath: structuredOperation?.endpoint ?? ms?.endpointPath ?? '',
    headers: ms?.apiSetting?.headers?.map((header) => ({
      ...emptyHeader(),
      key: header.key,
      value: header.value,
    })) ?? [],
    auth: ms?.apiSetting?.auth
      ? {
          authType: ms.apiSetting.auth.authType,
          username: ms.apiSetting.auth.username ?? undefined,
          password: ms.apiSetting.auth.password ?? undefined,
          bearerToken: ms.apiSetting.auth.bearerToken ?? undefined,
          apiKeyName: ms.apiSetting.auth.apiKeyName ?? undefined,
          apiKeyValue: ms.apiSetting.auth.apiKeyValue ?? undefined,
          apiKeyPlacement: ms.apiSetting.auth.apiKeyPlacement ?? undefined,
        }
      : defaultAuth(),
    body: defaultBody(),
    queryParams: [],
  };
}

export function PostmanPanel({ metaSourceId, baseUrl, selected, onSaved }: Props) {
  const [config, setConfig] = useState<ApiConfigDTO>(() => configFromMetaSet(selected));
  const [tab, setTab] = useState<Tab>('params');
  const [responseTab, setResponseTab] = useState<ResponseTab>('body');
  const [scriptTab, setScriptTab] = useState<ScriptTab>('post-response');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('JSON');
  const [visualizeOption, setVisualizeOption] = useState<VisualizeOption>('preview');
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [visualizeMenuOpen, setVisualizeMenuOpen] = useState(false);
  const [preRequestScript, setPreRequestScript] = useState('// Chưa cấu hình pre-request script');
  const [postResponseScript, setPostResponseScript] = useState('// Viết script kiểm tra response tại đây');
  const [result, setResult] = useState<RestProxyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestPanePercent, setRequestPanePercent] = useState(54);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setConfig(configFromMetaSet(selected));
    setResult(null);
    setError(null);
    setResponseTab('body');
    setVisualizeOption('preview');
    setResponseFormat('JSON');
    setFormatMenuOpen(false);
    setVisualizeMenuOpen(false);
  }, [selected?.id]);

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (!rect.height) return;
      const nextPercent = ((event.clientY - rect.top) / rect.height) * 100;
      setRequestPanePercent(Math.min(88, Math.max(8, nextPercent)));
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  const method = config.method as Method;
  const params = config.queryParams?.length ? config.queryParams : [emptyRow()];
  const headers = config.headers?.length ? config.headers : [emptyHeader()];
  const auth = config.auth ?? defaultAuth();
  const body = config.body ?? defaultBody();

  const set = (patch: Partial<ApiConfigDTO>) => setConfig((current) => ({ ...current, ...patch }));

  const sendMutation = useMutation({
    mutationFn: () =>
      metaSourceConnectApi.restProxy(metaSourceId, {
        ...config,
        queryParams: params.filter((item) => item.key.trim()),
        headers: headers.filter((item) => item.key.trim()),
      }),
    onSuccess: (response) => {
      setResult(response);
      setError(null);
      if (response.status >= 200 && response.status < 300) {
        toast.success(`Gửi request thành công (${response.status})`);
      } else {
        toast.warning(`Request trả về trạng thái ${response.status}`);
      }
    },
    onError: (mutationError) => {
      setResult(null);
      setError(mutationError instanceof Error ? mutationError.message : 'Lỗi không xác định');
      toast.error('Gửi request thất bại');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('Chưa chọn endpoint');
      const saved: ApiConfigDTO = {
        ...config,
        endpointPath: config.endpointPath,
        queryParams: params.filter((item) => item.key.trim()),
        headers: headers.filter((item) => item.key.trim()),
      };
      const primaryOperation = getPrimaryMetaSetOperation(selected);
      const nextOperations = buildOperationsForSave(selected, saved, primaryOperation);
      const nextEndpointConfig = {
        basePath: selected.endpointConfig?.basePath ?? null,
        primaryOperationCode:
          selected.endpointConfig?.primaryOperationCode
          ?? primaryOperation?.code
          ?? nextOperations[0]?.code
          ?? null,
        primaryOperationType:
          selected.endpointConfig?.primaryOperationType
          ?? primaryOperation?.operationType
          ?? nextOperations[0]?.operationType
          ?? 'CUSTOM',
      };
      return metaSetApi.update(selected.id, {
        ...selected,
        endpointPath: config.endpointPath,
        endpointConfig: nextEndpointConfig,
        apiSetting: {
          auth: {
            authType: saved.auth?.authType ?? 'NONE',
            username: saved.auth?.username ?? null,
            password: saved.auth?.password ?? null,
            bearerToken: saved.auth?.bearerToken ?? null,
            apiKeyName: saved.auth?.apiKeyName ?? null,
            apiKeyValue: saved.auth?.apiKeyValue ?? null,
            apiKeyPlacement: saved.auth?.apiKeyPlacement ?? null,
          },
          headers: saved.headers ?? [],
          timeoutMs: selected.apiSetting?.timeoutMs ?? 30000,
        },
        operations: nextOperations,
      });
    },
    onSuccess: (updated) => {
      toast.success('Lưu cấu hình API thành công');
      onSaved(updated);
    },
    onError: () => {
      toast.error('Lỗi khi lưu cấu hình API');
    },
  });

  const previewUrl = buildPreviewUrl(baseUrl, config.endpointPath, params);
  const responseHeaders = useMemo(() => normalizeHeaders(result?.headers), [result]);
  const responseBytes = result?.body ? new Blob([result.body]).size : 0;
  const responseCookies = useMemo(() => extractCookies(normalizeHeaders(result?.headers)), [result]);
  const compiledPreview = useMemo(
    () => compileResponseBody(result?.body ?? '', responseFormat),
    [result?.body, responseFormat],
  );
  const testResults = useMemo(
    () => (result ? [`Status check: ${result.status >= 200 && result.status < 300 ? 'PASS' : 'WARN'} (${result.status})`] : []),
    [result],
  );
  const requestMeta = useMemo(
    () => [
      { label: 'Params', value: countActive(params), icon: ListFilter },
      { label: 'Headers', value: countActive(headers), icon: Globe },
      { label: 'Auth', value: auth.authType === 'NONE' ? 'None' : auth.authType, icon: ShieldCheck },
      { label: 'Body', value: body.bodyType, icon: TextCursorInput },
    ],
    [auth.authType, body.bodyType, headers, params],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <select
            value={method}
            onChange={(e) => set({ method: e.target.value })}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-primary shadow-sm"
          >
            {METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Input
            className="h-10 min-w-[16rem] flex-1 font-mono text-sm"
            placeholder="/api/v1/resource"
            value={config.endpointPath}
            onChange={(e) => set({ endpointPath: e.target.value })}
          />
          <Button type="button" className="h-10 px-5" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? 'Đang gửi…' : 'Send'}
          </Button>
          {selected && (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-5"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border/70 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono">{previewUrl}</span>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border/70 px-4 py-2">
          {requestMeta.map((item) => (
            <div key={item.label} className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={splitContainerRef} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0" style={{ height: `${requestPanePercent}%` }}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 border-b border-border bg-card px-2">
              {(['docs', 'params', 'auth', 'headers', 'body', 'scripts', 'settings', 'cookies'] as Tab[]).map((item) => (
                <PanelTabButton
                  key={item}
                  active={tab === item}
                  label={tabLabel(item)}
                  detail={getRequestTabDetail(item, params, headers, auth, body)}
                  onClick={() => setTab(item)}
                />
              ))}
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="min-h-full bg-background">
                {tab === 'docs' && (
                  <InfoPanel
                    icon={FileText}
                    title="Request docs"
                    description="Tài liệu nhanh cho endpoint hiện tại."
                    content={[
                      `Method: ${method}`,
                      `Path: ${config.endpointPath || 'Chưa cấu hình'}`,
                      `Base URL: ${baseUrl || 'Chưa có'}`,
                      `MetaSet: ${selected?.name || selected?.code || 'Chưa chọn'}`,
                    ]}
                  />
                )}
                {tab === 'params' && (
                  <KVTable rows={params} onChange={(rows) => set({ queryParams: rows })} placeholder={{ key: 'param', value: 'value' }} />
                )}
                {tab === 'auth' && <AuthPanel auth={auth} onChange={(value) => set({ auth: value })} />}
                {tab === 'headers' && (
                  <KVTable rows={headers} onChange={(rows) => set({ headers: rows })} placeholder={{ key: 'header', value: 'value' }} />
                )}
                {tab === 'body' && <BodyPanel body={body} onChange={(value) => set({ body: value })} />}
                {tab === 'scripts' && (
                  <ScriptsPanel
                    activeTab={scriptTab}
                    onTabChange={setScriptTab}
                    preRequestScript={preRequestScript}
                    postResponseScript={postResponseScript}
                    onPreRequestChange={setPreRequestScript}
                    onPostResponseChange={setPostResponseScript}
                  />
                )}
                {tab === 'settings' && (
                  <InfoPanel
                    icon={Settings2}
                    title="Request settings"
                    description="Các tuỳ chọn vận hành cho request."
                    content={[
                      `Response formatter: ${responseFormat}`,
                      `Preview mode: ${visualizeOption}`,
                      `Save target: ${selected ? 'MetaSet.apiSetting + primary operation' : 'Chưa có MetaSet'}`,
                    ]}
                  />
                )}
                {tab === 'cookies' && (
                  <InfoPanel
                    icon={Cookie}
                    title="Cookies"
                    description="Cookie được suy ra từ response headers hiện tại."
                    content={extractCookies(result?.headers ?? [])}
                    emptyMessage="Chưa có cookie nào trong response hiện tại."
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize request and response panels"
          onMouseDown={() => setIsDraggingDivider(true)}
          className={`group relative h-6 shrink-0 cursor-row-resize bg-muted/60 transition-colors ${isDraggingDivider ? 'bg-primary/10' : 'hover:bg-primary/10'}`}
        >
          <div className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 transition-colors ${isDraggingDivider ? 'bg-primary' : 'bg-border group-hover:bg-primary'}`} />
        </div>

        <div className="min-h-0 flex-1">
          <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-1">
                <ResponseTopTab active={responseTab === 'body'} onClick={() => setResponseTab('body')}>
                  Body
                </ResponseTopTab>
                <ResponseTopTab active={responseTab === 'cookies'} onClick={() => setResponseTab('cookies')}>
                  Cookies
                </ResponseTopTab>
                <ResponseTopTab active={responseTab === 'headers'} onClick={() => setResponseTab('headers')}>
                  Headers {result ? <span className="text-emerald-600">({responseHeaders.length})</span> : null}
                </ResponseTopTab>
                <ResponseTopTab active={responseTab === 'tests'} onClick={() => setResponseTab('tests')}>
                  Test Results
                </ResponseTopTab>
                <button type="button" className="ml-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <History className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {result && <StatusBadge status={result.status} />}
                {result && <span className="text-border">•</span>}
                {result && <ResponseMeta icon={Clock3} text={`${result.durationMs} ms`} />}
                {result && <span className="text-border">•</span>}
                {result && <ResponseMeta icon={Globe} text={formatBytes(responseBytes)} />}
                <button type="button" className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted hover:text-foreground">
                  <Code2 className="h-3.5 w-3.5" />
                  Save Response
                </button>
                <button type="button" className="rounded p-1 hover:bg-muted hover:text-foreground">
                  <Ellipsis className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-3">
                {responseTab === 'body' && (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setFormatMenuOpen((current) => !current);
                          setVisualizeMenuOpen(false);
                        }}
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {responseFormat}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      {formatMenuOpen && (
                        <div className="absolute left-0 top-10 z-20 min-w-[180px] overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-xl">
                          <MenuOption active={responseFormat === 'JSON'} icon={<Code2 className="h-4 w-4" />} label="JSON" onClick={() => { setResponseFormat('JSON'); setFormatMenuOpen(false); }} />
                          <MenuOption active={responseFormat === 'XML'} icon={<Code2 className="h-4 w-4" />} label="XML" onClick={() => { setResponseFormat('XML'); setFormatMenuOpen(false); }} />
                          <MenuOption active={responseFormat === 'HTML'} icon={<Code2 className="h-4 w-4" />} label="HTML" onClick={() => { setResponseFormat('HTML'); setFormatMenuOpen(false); }} />
                          <MenuOption active={responseFormat === 'JavaScript'} icon={<Code2 className="h-4 w-4" />} label="JavaScript" onClick={() => { setResponseFormat('JavaScript'); setFormatMenuOpen(false); }} />
                          <div className="my-1 h-px bg-border" />
                          <MenuOption active={responseFormat === 'Raw'} icon={<FileText className="h-4 w-4" />} label="Raw" onClick={() => { setResponseFormat('Raw'); setFormatMenuOpen(false); }} />
                          <MenuOption active={responseFormat === 'Hex'} icon={<Code2 className="h-4 w-4" />} label="Hex" onClick={() => { setResponseFormat('Hex'); setFormatMenuOpen(false); }} />
                          <MenuOption active={responseFormat === 'Base64'} icon={<Code2 className="h-4 w-4" />} label="Base64" onClick={() => { setResponseFormat('Base64'); setFormatMenuOpen(false); }} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVisualizeOption('preview');
                        setVisualizeMenuOpen(false);
                      }}
                      className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${visualizeOption === 'preview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setVisualizeMenuOpen((current) => !current);
                          setFormatMenuOpen(false);
                        }}
                        className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${visualizeOption !== 'preview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Visualize
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      {visualizeMenuOpen && (
                        <div className="absolute left-0 top-10 z-20 min-w-[190px] overflow-hidden rounded-xl border border-border bg-popover p-2 shadow-xl">
                          <MenuOption active={visualizeOption === 'table'} icon={<Table2 className="h-4 w-4" />} label="Table" onClick={() => { setVisualizeOption('table'); setVisualizeMenuOpen(false); }} />
                          <MenuOption active={visualizeOption === 'linear-chart'} icon={<TrendingUp className="h-4 w-4" />} label="Linear Chart" onClick={() => { setVisualizeOption('linear-chart'); setVisualizeMenuOpen(false); }} />
                          <MenuOption active={visualizeOption === 'bar-graph'} icon={<BarChart3 className="h-4 w-4" />} label="Bar Graph" onClick={() => { setVisualizeOption('bar-graph'); setVisualizeMenuOpen(false); }} />
                          <div className="my-1 h-px bg-border" />
                          <MenuOption active={visualizeOption === 'prompt'} icon={<TextCursorInput className="h-4 w-4" />} label="Set up with a prompt" onClick={() => { setVisualizeOption('prompt'); setVisualizeMenuOpen(false); }} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><RotateCcw className="h-4 w-4" /></button>
                <div className="mx-1 h-4 w-px bg-border" />
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><WrapText className="h-4 w-4" /></button>
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><Filter className="h-4 w-4" /></button>
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><Search className="h-4 w-4" /></button>
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><Copy className="h-4 w-4" /></button>
                <button type="button" className="rounded p-2 hover:bg-muted hover:text-foreground"><Link2 className="h-4 w-4" /></button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="min-h-full bg-background p-0">
                {error && (
                  <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
                    {error}
                  </div>
                )}
                {!result && !error && !sendMutation.isPending && (
                  <div className="m-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    Click <span className="font-medium text-foreground">Send</span> để chạy request và xem response.
                  </div>
                )}
                {result && responseTab === 'body' && visualizeOption === 'preview' && (
                  compiledPreview.kind === 'html' ? (
                    <HtmlPreview html={compiledPreview.content} />
                  ) : (
                    <CodeViewer content={compiledPreview.content} />
                  )
                )}
                {result && responseTab === 'body' && visualizeOption !== 'preview' && (
                  <div className="p-4">
                    <VisualizePanel body={result.body} format={responseFormat} mode={visualizeOption} />
                  </div>
                )}
                {result && responseTab === 'headers' && <HeadersTable rows={responseHeaders} />}
                {result && responseTab === 'cookies' && <SimpleListPanel title="Cookies" rows={responseCookies} emptyMessage="Response không có cookie." />}
                {result && responseTab === 'tests' && <SimpleListPanel title="Test Results" rows={testResults} emptyMessage="Chưa có test results." />}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildOperationsForSave(
  selected: MetaSet,
  saved: ApiConfigDTO,
  primaryOperation: NonNullable<ReturnType<typeof getPrimaryMetaSetOperation>> | null,
) {
  const currentOperations = selected.operations?.length
    ? selected.operations
    : [
        {
          code: 'default',
          name: 'Primary operation',
          operationType: 'CUSTOM' as const,
          method: 'GET' as const,
          endpoint: selected.endpointPath ?? '/',
          responseMode: 'DETAIL' as const,
          description: null,
          enabled: true,
        },
      ];
  const primaryCode = selected.endpointConfig?.primaryOperationCode?.trim() ?? primaryOperation?.code?.trim();
  const primaryType = selected.endpointConfig?.primaryOperationType?.trim() ?? primaryOperation?.operationType;
  let matched = false;
  const nextOperations = currentOperations.map((operation, index) => {
    const fallbackCode = operation.code?.trim() || `operation-${index}`;
    const isPrimary =
      (primaryCode && fallbackCode === primaryCode)
      || (primaryType && operation.operationType === primaryType)
      || (!primaryCode && !primaryType && index === 0);
    if (!isPrimary) {
      return operation;
    }
    matched = true;
    return {
      ...operation,
      method: (saved.method as typeof operation.method) ?? operation.method,
      endpoint: saved.endpointPath || operation.endpoint,
      enabled: true,
    };
  });
  if (matched) {
    return nextOperations;
  }
  return [
    ...nextOperations,
    {
      code: primaryCode ?? 'primary',
      name: primaryOperation?.name ?? 'Primary operation',
      operationType: (primaryType as typeof currentOperations[number]['operationType']) ?? 'CUSTOM',
      method: (saved.method as typeof currentOperations[number]['method']) ?? 'GET',
      endpoint: saved.endpointPath || '/',
      responseMode: primaryOperation?.responseMode ?? 'DETAIL',
      description: primaryOperation?.description ?? null,
      enabled: true,
    },
  ];
}

function KVTable<T extends { id?: string; key: string; value: string; canEdit?: boolean }>({
  rows,
  onChange,
  placeholder,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  placeholder: { key: string; value: string };
}) {
  const update = (index: number, field: 'key' | 'value', value: string) => {
    const next = [...rows] as T[];
    next[index] = { ...next[index], [field]: value };
    if (index === next.length - 1 && (next[index].key || next[index].value)) {
      next.push({ key: '', value: '' } as T);
    }
    onChange(next);
  };

  const remove = (index: number) => {
    if (rows.length === 1) return;
    onChange(rows.filter((_, currentIndex) => currentIndex !== index) as T[]);
  };

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th className="w-[45%] px-4 py-2 text-left font-medium text-muted-foreground">Key</th>
          <th className="w-[45%] px-4 py-2 text-left font-medium text-muted-foreground">Value</th>
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id ?? index} className="border-b border-border/60 bg-background">
            <td className="px-3 py-2">
              <input
                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-mono focus:border-ring focus:outline-none"
                placeholder={placeholder.key}
                value={row.key}
                readOnly={row.canEdit === false}
                onChange={(e) => update(index, 'key', e.target.value)}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-mono focus:border-ring focus:outline-none"
                placeholder={placeholder.value}
                value={row.value}
                onChange={(e) => update(index, 'value', e.target.value)}
              />
            </td>
            <td className="px-1 py-1 text-center">
              {row.canEdit !== false && rows.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                  ×
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuthPanel({ auth, onChange }: { auth: ApiAuthConfigDTO; onChange: (value: ApiAuthConfigDTO) => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Authorization</p>
            <p className="text-xs text-muted-foreground">Cấu hình xác thực cho request hiện tại.</p>
          </div>
          <Badge variant="outline">{auth.authType}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-24 shrink-0 text-xs text-muted-foreground">Auth type</label>
          <select
            value={auth.authType}
            onChange={(e) => onChange({ ...auth, authType: e.target.value as ApiAuthType })}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs"
          >
            {AUTH_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {auth.authType !== 'NONE' && (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="space-y-3">
            {auth.authType === 'BEARER' && (
              <LabelInput label="Token" value={auth.bearerToken ?? ''} onChange={(value) => onChange({ ...auth, bearerToken: value })} secret />
            )}
            {auth.authType === 'BASIC' && (
              <>
                <LabelInput label="Username" value={auth.username ?? ''} onChange={(value) => onChange({ ...auth, username: value })} />
                <LabelInput label="Password" value={auth.password ?? ''} onChange={(value) => onChange({ ...auth, password: value })} secret />
              </>
            )}
            {auth.authType === 'API_KEY' && (
              <>
                <LabelInput label="Key name" value={auth.apiKeyName ?? ''} onChange={(value) => onChange({ ...auth, apiKeyName: value })} />
                <LabelInput label="Key value" value={auth.apiKeyValue ?? ''} onChange={(value) => onChange({ ...auth, apiKeyValue: value })} secret />
                <div className="flex items-center gap-2">
                  <label className="w-24 shrink-0 text-xs text-muted-foreground">Placement</label>
                  <select
                    value={auth.apiKeyPlacement ?? 'HEADER'}
                    onChange={(e) => onChange({ ...auth, apiKeyPlacement: e.target.value as 'HEADER' | 'QUERY' })}
                    className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                  >
                    <option value="HEADER">Header</option>
                    <option value="QUERY">Query param</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {auth.authType === 'NONE' && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Request này đang không dùng authorization.
        </div>
      )}
    </div>
  );
}

function BodyPanel({ body, onChange }: { body: ApiBodyConfigDTO; onChange: (value: ApiBodyConfigDTO) => void }) {
  return (
    <div className="flex flex-col p-4">
      <div className="mb-4 rounded-lg border border-border bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Request body</p>
            <p className="text-xs text-muted-foreground">Chọn kiểu payload và nội dung gửi đi.</p>
          </div>
          <Badge variant="outline">{body.bodyType}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Body type</label>
          <select
            value={body.bodyType}
            onChange={(e) => onChange({ ...body, bodyType: e.target.value as ApiBodyType })}
            className="h-9 rounded-md border border-border bg-background px-3 text-xs"
          >
            {BODY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(body.bodyType === 'JSON' || body.bodyType === 'RAW') && (
        <Textarea
          className="min-h-[18rem] resize-y rounded-lg bg-background font-mono text-xs"
          placeholder={body.bodyType === 'JSON' ? '{"key": "value"}' : 'raw text'}
          value={body.rawContent ?? ''}
          onChange={(e) => onChange({ ...body, rawContent: e.target.value })}
        />
      )}

      {(body.bodyType === 'FORM_DATA' || body.bodyType === 'URL_ENCODED') && (
        <div className="overflow-hidden rounded-lg border border-border">
          <KVTable
            rows={
              body.bodyType === 'FORM_DATA'
                ? body.formDataFields?.length
                  ? body.formDataFields
                  : [{ key: '', value: '' }]
                : body.urlEncodedFields?.length
                  ? body.urlEncodedFields
                  : [{ key: '', value: '' }]
            }
            onChange={(rows) =>
              body.bodyType === 'FORM_DATA'
                ? onChange({ ...body, formDataFields: rows })
                : onChange({ ...body, urlEncodedFields: rows })
            }
            placeholder={{ key: 'field', value: 'value' }}
          />
        </div>
      )}

      {body.bodyType === 'NONE' && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Request hiện không gửi body.
        </div>
      )}
    </div>
  );
}

function LabelInput({
  label,
  value,
  onChange,
  secret,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-24 shrink-0 text-xs text-muted-foreground">{label}</label>
      <Input className="h-9 flex-1 text-xs font-mono" type={secret ? 'password' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function StatusBadge({ status, dark }: { status: number; dark?: boolean }) {
  const color =
    status >= 200 && status < 300
      ? dark ? 'bg-green-900/60 text-green-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      : status >= 300 && status < 400
        ? dark ? 'bg-yellow-900/60 text-yellow-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
        : dark ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${color}`}>{dark ? `${status} ${statusLabel(status)}` : status}</span>;
}

function tabLabel(tab: Tab): string {
  return tab === 'docs'
    ? 'Docs'
    : tab === 'params'
      ? 'Params'
      : tab === 'auth'
        ? 'Authorization'
        : tab === 'headers'
          ? 'Headers'
          : tab === 'body'
            ? 'Body'
            : tab === 'scripts'
              ? 'Scripts'
              : tab === 'settings'
                ? 'Settings'
                : 'Cookies';
}

function buildPreviewUrl(baseUrl: string, path: string, params: ApiQueryParamDTO[]): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : `/${path}`);
  const filled = params.filter((item) => item.key.trim());
  if (!filled.length) return normalizedBase;
  const queryString = filled.map((item) => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value ?? '')}`).join('&');
  return `${normalizedBase}?${queryString}`;
}

function countActive(rows: Array<{ key: string }>): number {
  return rows.filter((row) => row.key.trim()).length;
}

function getRequestTabDetail(
  tab: Tab,
  params: ApiQueryParamDTO[],
  headers: ApiHeaderDTO[],
  auth: ApiAuthConfigDTO,
  body: ApiBodyConfigDTO,
): string {
  if (tab === 'docs') return 'Info';
  if (tab === 'params') return `${countActive(params)}`;
  if (tab === 'auth') return auth.authType === 'NONE' ? 'None' : auth.authType;
  if (tab === 'headers') return `${countActive(headers)}`;
  if (tab === 'body') return body.bodyType;
  if (tab === 'scripts') return 'JS';
  if (tab === 'settings') return 'Config';
  return 'Jar';
}

function PanelTabButton({
  active,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
        active ? 'border-primary bg-background text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <span className="font-medium">{label}</span>
      <Badge variant={active ? 'secondary' : 'outline'} className="h-4 px-1.5 text-[10px]">
        {detail}
      </Badge>
    </button>
  );
}

function ResponseMeta({ icon: Icon, text, dark }: { icon: typeof Clock3; text: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function HeadersTable({ rows, dark }: { rows: RestProxyHeader[]; dark?: boolean }) {
  if (!rows.length) {
    return (
      <div className={`m-4 rounded-lg border border-dashed px-4 py-8 text-center text-sm ${dark ? 'border-white/10 bg-white/[0.02] text-slate-400' : 'border-border bg-muted/20 text-muted-foreground'}`}>
        Response không có headers để hiển thị.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${dark ? '' : 'rounded-lg border border-border'}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className={dark ? 'border-b border-white/10 bg-[#252526]' : 'border-b border-border bg-muted/40'}>
            <th className={`w-[35%] px-4 py-2 text-left font-medium ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>Header</th>
            <th className={`px-4 py-2 text-left font-medium ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.key}-${index}`} className={dark ? 'border-b border-white/5 bg-[#1f1f1f]' : 'border-b border-border/60 bg-background'}>
              <td className={`px-4 py-2 font-mono text-[11px] ${dark ? 'text-slate-100' : 'text-foreground'}`}>{row.key}</td>
              <td className={`px-4 py-2 font-mono text-[11px] break-all ${dark ? 'text-slate-400' : 'text-muted-foreground'}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScriptsPanel({
  activeTab,
  onTabChange,
  preRequestScript,
  postResponseScript,
  onPreRequestChange,
  onPostResponseChange,
}: {
  activeTab: ScriptTab;
  onTabChange: (tab: ScriptTab) => void;
  preRequestScript: string;
  postResponseScript: string;
  onPreRequestChange: (value: string) => void;
  onPostResponseChange: (value: string) => void;
}) {
  return (
    <div className="flex min-h-[22rem]">
      <div className="w-40 shrink-0 border-r border-border bg-muted/20 p-3">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onTabChange('pre-request')}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeTab === 'pre-request' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            }`}
          >
            Pre-request
          </button>
          <button
            type="button"
            onClick={() => onTabChange('post-response')}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeTab === 'post-response' ? 'bg-background font-medium text-foreground' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            }`}
          >
            Post-response
          </button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          Use JavaScript để viết test hoặc xử lý response theo flow Postman.
        </div>
        <Textarea
          className="min-h-[18rem] flex-1 rounded-none border-0 bg-background font-mono text-xs"
          value={activeTab === 'pre-request' ? preRequestScript : postResponseScript}
          onChange={(e) => (activeTab === 'pre-request' ? onPreRequestChange(e.target.value) : onPostResponseChange(e.target.value))}
        />
      </div>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  description,
  content,
  emptyMessage = 'Chưa có dữ liệu.',
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  content: string[];
  emptyMessage?: string;
}) {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">{title}</h4>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        {content.length ? (
          <div className="space-y-2">
            {content.map((line) => (
              <div key={line} className="rounded-md bg-muted/20 px-3 py-2 font-mono text-xs text-foreground">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuOption({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
    >
      <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">{active ? <Check className="h-4 w-4 text-foreground" /> : icon}</span>
      <span>{label}</span>
    </button>
  );
}

function VisualizePanel({
  body,
  format,
  mode,
  dark,
}: {
  body: string;
  format: ResponseFormat;
  mode: VisualizeOption;
  dark?: boolean;
}) {
  const formatted = formatBodyByMode(body, format);
  const jsonRows = useMemo(() => buildTableRows(body), [body]);
  const chartPoints = useMemo(() => buildChartPoints(body), [body]);
  return (
    <div className={`rounded-lg border p-4 ${dark ? 'border-white/10 bg-[#252526]' : 'border-border bg-background'}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Code2 className={`h-4 w-4 ${dark ? 'text-slate-400' : 'text-muted-foreground'}`} />
        {visualizeTitle(mode)}
      </div>
      {mode === 'prompt' ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          Nhập prompt để dựng custom visualization cho response này.
        </div>
      ) : mode === 'table' ? (
        jsonRows ? (
          <DataTable rows={jsonRows} />
        ) : (
          <pre className={`overflow-x-auto font-mono text-xs whitespace-pre-wrap break-all ${dark ? 'text-slate-100' : 'text-foreground'}`}>
            {formatted}
          </pre>
        )
      ) : (
        chartPoints ? (
          <ChartPreview points={chartPoints} mode={mode} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            {mode === 'linear-chart' ? 'Linear Chart cần JSON có trường số để dựng biểu đồ.' : 'Bar Graph cần JSON có trường số để dựng biểu đồ.'}
          </div>
        )
      )}
    </div>
  );
}

function ResponseTopTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b px-3 py-2 text-sm transition-colors ${
        active ? 'border-orange-400 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function CodeViewer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="grid min-h-full grid-cols-[56px_1fr] bg-background font-mono text-xs">
      <div className="select-none border-r border-border bg-muted/30 px-3 py-4 text-right text-muted-foreground">
        {lines.map((_, index) => (
          <div key={index} className="h-6 leading-6">
            {index + 1}
          </div>
        ))}
      </div>
      <pre className="overflow-x-auto px-5 py-4 whitespace-pre-wrap break-all text-foreground">
        {content}
      </pre>
    </div>
  );
}

function HtmlPreview({ html }: { html: string }) {
  return (
    <div className="h-full bg-background p-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <iframe title="HTML Preview" srcDoc={html} className="h-[28rem] w-full bg-white" sandbox="allow-same-origin" />
      </div>
    </div>
  );
}

function DataTable({ rows }: { rows: Array<Record<string, string | number | boolean | null>> }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left font-medium text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/60 bg-background">
              {columns.map((column) => (
                <td key={column} className="px-3 py-2 align-top font-mono text-[11px] text-foreground">
                  {stringifyCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartPreview({ points, mode }: { points: Array<{ label: string; value: number }>; mode: VisualizeOption }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  if (mode === 'linear-chart') {
    const width = 640;
    const height = 240;
    const path = points
      .map((point, index) => {
        const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * (width - 40) + 20;
        const y = height - (point.value / max) * (height - 40) - 20;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
          {points.map((point, index) => {
            const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * (width - 40) + 20;
            const y = height - (point.value / max) * (height - 40) - 20;
            return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" className="fill-primary" />;
          })}
        </svg>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {points.map((point) => (
            <span key={point.label}>{point.label}: {point.value}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      {points.map((point) => (
        <div key={point.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{point.label}</span>
            <span className="text-muted-foreground">{point.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded bg-muted">
            <div className="h-full rounded bg-primary" style={{ width: `${(point.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleListPanel({ title, rows, emptyMessage }: { title: string; rows: string[]; emptyMessage: string }) {
  if (!rows.length) {
    return <div className="m-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  }
  return (
    <div className="p-4">
      <div className="mb-3 text-sm font-medium text-foreground">{title}</div>
      <div className="overflow-hidden rounded-lg border border-border">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="border-b border-border/60 bg-background px-4 py-3 font-mono text-xs text-foreground last:border-b-0">
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${size} B`;
}

function statusLabel(status: number): string {
  if (status >= 200 && status < 300) return 'OK';
  if (status >= 300 && status < 400) return 'Redirect';
  if (status >= 400 && status < 500) return 'Error';
  if (status >= 500) return 'Server Error';
  return 'Unknown';
}

function visualizeTitle(mode: VisualizeOption): string {
  if (mode === 'table') return 'Table';
  if (mode === 'linear-chart') return 'Linear Chart';
  if (mode === 'bar-graph') return 'Bar Graph';
  if (mode === 'prompt') return 'Set up with a prompt';
  return 'Preview';
}

function extractCookies(headers: RestProxyHeader[]): string[] {
  return headers
    .filter((header) => {
      const key = header.key.toLowerCase();
      return key === 'set-cookie' || key === 'cookie';
    })
    .map((header) => header.value);
}

function normalizeHeaders(headers: RestProxyResult['headers'] | Record<string, string> | null | undefined): RestProxyHeader[] {
  if (!headers) return [];
  if (Array.isArray(headers)) {
    return headers.filter((header): header is RestProxyHeader => Boolean(header?.key));
  }
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function formatBodyByMode(raw: string, format: ResponseFormat): string {
  if (!raw) return '';
  if (format === 'JSON') {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  if (format === 'XML') {
    return prettyPrintMarkup(raw, 'application/xml');
  }
  if (format === 'HTML') {
    return prettyPrintMarkup(raw, 'text/html');
  }
  if (format === 'JavaScript') {
    return prettyPrintJavaScript(raw);
  }
  if (format === 'Base64') {
    return encodeBase64(raw);
  }
  if (format === 'Hex') {
    return Array.from(new TextEncoder().encode(raw))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join(' ');
  }
  return raw;
}

function compileResponseBody(raw: string, format: ResponseFormat): { kind: 'text' | 'html'; content: string } {
  if (format === 'HTML' && looksLikeHtml(raw)) {
    return { kind: 'html', content: raw };
  }
  return { kind: 'text', content: formatBodyByMode(raw, format) };
}

function prettyPrintMarkup(raw: string, mimeType: DOMParserSupportedType): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, mimeType);
    if (doc.querySelector('parsererror')) return raw;
    const serialized = new XMLSerializer().serializeToString(doc);
    return serialized.replace(/></g, '>\n<');
  } catch {
    return raw;
  }
}

function prettyPrintJavaScript(raw: string): string {
  return raw
    .replace(/;/g, ';\n')
    .replace(/\{/g, '{\n')
    .replace(/\}/g, '\n}\n')
    .replace(/,/g, ',\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function encodeBase64(raw: string): string {
  const bytes = new TextEncoder().encode(raw);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function looksLikeHtml(raw: string): boolean {
  const trimmed = raw.trim().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.startsWith('<body') || trimmed.startsWith('<div') || trimmed.startsWith('<span');
}

function buildTableRows(raw: string): Array<Record<string, string | number | boolean | null>> | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
      return parsed.slice(0, 50) as Array<Record<string, string | number | boolean | null>>;
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return [parsed as Record<string, string | number | boolean | null>];
    }
  } catch {
    return null;
  }
  return null;
}

function buildChartPoints(raw: string): Array<{ label: string; value: number }> | null {
  try {
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const points = rows
      .slice(0, 12)
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const entries = Object.entries(item as Record<string, unknown>);
        const numeric = entries.find(([, value]) => typeof value === 'number');
        if (!numeric) return null;
        const labelEntry = entries.find(([, value]) => typeof value === 'string');
        return {
          label: String(labelEntry?.[1] ?? `Item ${index + 1}`),
          value: Number(numeric[1]),
        };
      })
      .filter((item): item is { label: string; value: number } => Boolean(item));
    return points.length ? points : null;
  } catch {
    return null;
  }
}

function stringifyCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
