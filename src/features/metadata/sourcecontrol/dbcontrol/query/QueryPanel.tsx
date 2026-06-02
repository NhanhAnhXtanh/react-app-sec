import { useEffect, useRef, useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as Mon from 'monaco-editor';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { metaSourceConnectApi } from '@/api/metasource-connect.api';
import type { QueryResult, Schema } from '../types';

type Props = {
  metaSourceId: string;
  schema: Schema;
};

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'ON', 'AS',
  'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'DISTINCT', 'HAVING',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'RETURNING',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
];

// Auto-quote identifiers that start with a digit or contain special chars,
// applied silently before sending to the backend so the editor stays clean.
function normalizeSql(sql: string): string {
  return sql.replace(
    /\b(FROM|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|UPDATE|INTO|TABLE)\s+([^\s"'(,;]+)/gi,
    (_, keyword, ident) =>
      /^[a-z_][a-z0-9_]*$/i.test(ident)
        ? `${keyword} ${ident}`
        : `${keyword} "${ident.replace(/"/g, '""')}"`,
  );
}

const SAMPLE_SNIPPETS = (firstTable?: string) => [
  {
    label: 'select-from',
    insertText: firstTable
      ? `SELECT * FROM ${firstTable} LIMIT 100;`
      : 'SELECT * FROM \${1:table_name} LIMIT 100;',
    detail: 'SELECT * FROM table',
  },
];

export function QueryPanel({ metaSourceId, schema }: Props) {
  const [sql, setSql] = useState(
    schema.tables[0] ? `SELECT * FROM ${schema.tables[0].name} LIMIT 100;` : '',
  );

  // Khi schema load xong và sql vẫn rỗng, tự điền query mặc định
  useEffect(() => {
    if (sql === '' && schema.tables[0]) {
      setSql(`SELECT * FROM ${schema.tables[0].name} LIMIT 100;`);
    }
  }, [schema.tables]);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const providerRef = useRef<Mon.IDisposable | null>(null);

  const runMutation = useMutation({
    mutationFn: (q: string) => metaSourceConnectApi.executeQuery(metaSourceId, normalizeSql(q)),
    onSuccess: (r) => {
      setResult(r);
      setError(null);
    },
    onError: (e) => {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    },
  });

  // Re-register completion provider when schema changes
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    providerRef.current?.dispose();
    providerRef.current = registerSqlCompletion(monaco, schema);

    return () => {
      providerRef.current?.dispose();
      providerRef.current = null;
    };
  }, [schema]);

  const handleMount = (
    editor: Mon.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    monacoRef.current = monaco;
    providerRef.current = registerSqlCompletion(monaco, schema);
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => runMutation.mutate(editor.getValue()),
    );
    editor.onKeyDown((event) => {
      if (
        event.browserEvent.code === 'Space' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        editor.trigger('keyboard', 'type', { text: ' ' });
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col border-b border-border bg-muted/30">
        <div className="h-44">
          <Editor
            height="100%"
            language="sql"
            theme="vs-dark"
            value={sql}
            onChange={(v) => setSql(v ?? '')}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnCommitCharacter: false,
              acceptSuggestionOnEnter: 'off',
              wordBasedSuggestions: 'off',
              inlineSuggest: { enabled: false },
              parameterHints: { enabled: false },
            }}
          />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-2">
          <Button
            type="button"
            size="sm"
            onClick={() => runMutation.mutate(sql)}
            disabled={runMutation.isPending}
          >
            {runMutation.isPending ? 'Đang chạy…' : 'Run'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Ctrl+Enter để chạy
          </span>
          {result && (
            <span className="ml-auto text-xs text-muted-foreground">
              {result.count} row · {result.latencyMs}ms
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {error && (
          <div className="mb-2 rounded border border-destructive/50 bg-destructive/10 p-2 font-mono text-xs text-destructive">
            {error}
          </div>
        )}
        {!result && !error && (
          <p className="text-sm text-muted-foreground">
            Chạy query để xem kết quả. (Ctrl+Enter)
          </p>
        )}
        {result && result.rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>
        )}
        {result && result.rows.length > 0 && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th
                    key={c}
                    className="sticky top-0 border-b border-border bg-muted px-2 py-1 text-left font-mono font-semibold"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  {result.columns.map((c) => (
                    <td
                      key={c}
                      className="border-b border-border px-2 py-1 font-mono"
                    >
                      {renderCell(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function renderCell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function registerSqlCompletion(monaco: Monaco, schema: Schema): Mon.IDisposable {
  const tableNames = schema.tables.map((t) => t.name);
  const fieldsByTable = new Map<string, string[]>();
  for (const t of schema.tables) {
    fieldsByTable.set(t.name, t.fields.map((f) => f.name));
  }

  return monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: [],
    provideCompletionItems: (
      model: Mon.editor.ITextModel,
      position: Mon.Position,
    ) => {
      const word = model.getWordUntilPosition(position);
      const range: Mon.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Detect "table." prefix → suggest columns of that table
      const lineUpToCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const dotMatch = /(\w+)\.\w*$/.exec(lineUpToCursor);
      if (dotMatch) {
        const tableName = dotMatch[1];
        const cols = fieldsByTable.get(tableName);
        if (cols) {
          return {
            suggestions: cols.map((c) => ({
              label: c,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: c,
              detail: `${tableName}.${c}`,
              range,
            })),
          };
        }
      }

      const suggestions: Mon.languages.CompletionItem[] = [
        ...tableNames.map((t) => ({
          label: t,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: t,
          detail: 'table',
          range,
        })),
        ...SQL_KEYWORDS.map((k) => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range,
        })),
        ...SAMPLE_SNIPPETS(schema.tables[0]?.name).map((s) => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: s.detail,
          range,
        })),
      ];
      return { suggestions };
    },
  });
}
