import { useState } from 'react';
import { ChevronRight, KeyRound, Link2, Table as TableIcon } from 'lucide-react';
import type { Schema, SchemaField } from '../types';

type Props = {
  schema: Schema;
  onSelectTable?: (name: string) => void;
};

export function SchemaTree({ schema, onSelectTable }: Props) {
  return (
    <ul className="select-none text-sm">
      {schema.tables.map((t) => (
        <TreeNode key={t.name} table={t} onSelect={onSelectTable} />
      ))}
    </ul>
  );
}

function TreeNode({
  table,
  onSelect,
}: {
  table: { name: string; fields: SchemaField[] };
  onSelect?: (name: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          onSelect?.(table.name);
        }}
        className="flex w-full items-center gap-1 rounded px-2 py-1 hover:bg-muted"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        />
        <TableIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate font-medium">{table.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {table.fields.length}
        </span>
      </button>

      {open && (
        <ul className="ml-5 border-l border-border">
          {table.fields.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs"
              title={`${f.type}${f.nullable ? ' • nullable' : ''}`}
            >
              {f.pk ? (
                <KeyRound className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
              ) : f.fk ? (
                <Link2 className="h-3 w-3 shrink-0 text-blue-500" aria-hidden />
              ) : (
                <span className="inline-block h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{f.name}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {f.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
