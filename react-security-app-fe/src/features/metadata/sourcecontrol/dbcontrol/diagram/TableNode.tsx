import { Handle, Position, type NodeProps } from '@xyflow/react';
import { KeyRound, Link2 } from 'lucide-react';
import type { SchemaTable } from '../types';

export type TableNodeData = { table: SchemaTable };

export function TableNode({ data }: NodeProps) {
  const { table } = data as TableNodeData;
  return (
    <div className="rounded-lg border border-border bg-card text-foreground shadow-md">
      <div className="border-b border-border bg-muted px-3 py-1.5 font-mono text-xs font-semibold">
        {table.name}
      </div>
      <ul className="divide-y divide-border">
        {table.fields.map((f) => (
          <li
            key={f.name}
            className="relative flex items-center gap-1.5 px-3 py-1 text-xs"
          >
            {f.pk ? (
              <KeyRound className="h-3 w-3 text-amber-500" aria-hidden />
            ) : f.fk ? (
              <Link2 className="h-3 w-3 text-blue-500" aria-hidden />
            ) : (
              <span className="h-3 w-3" />
            )}
            <span className="font-mono">{f.name}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              {f.type}
            </span>

            {/* anchors so edges can attach per-field */}
            <Handle
              id={`${f.name}-l`}
              type="target"
              position={Position.Left}
              className="!h-2 !w-2 !border-0 !bg-transparent"
            />
            <Handle
              id={`${f.name}-r`}
              type="source"
              position={Position.Right}
              className="!h-2 !w-2 !border-0 !bg-transparent"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
