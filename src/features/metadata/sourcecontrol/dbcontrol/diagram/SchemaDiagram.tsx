import { useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Schema } from '../types';
import { TableNode, type TableNodeData } from './TableNode';

const NODE_TYPES = { table: TableNode } as const;

function layoutNodes(schema: Schema): Node<TableNodeData>[] {
  return schema.tables.map((t, i) => ({
    id: t.name,
    type: 'table',
    position: { x: (i % 3) * 320, y: Math.floor(i / 3) * 280 },
    data: { table: t },
  }));
}

function buildEdges(schema: Schema): Edge[] {
  const edges: Edge[] = [];
  for (const t of schema.tables) {
    for (const f of t.fields) {
      if (!f.fk) continue;
      edges.push({
        id: `${t.name}.${f.name}->${f.fk.table}.${f.fk.field}`,
        source: t.name,
        sourceHandle: `${f.name}-r`,
        target: f.fk.table,
        targetHandle: `${f.fk.field}-l`,
        animated: false,
      });
    }
  }
  return edges;
}

type Props = { schema: Schema };

export function SchemaDiagram({ schema }: Props) {
  const initialNodes = useMemo(() => layoutNodes(schema), [schema]);
  const edges = useMemo(() => buildEdges(schema), [schema]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        defaultNodes={initialNodes}
        defaultEdges={edges}
        nodeTypes={NODE_TYPES}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={16} />
        <Controls position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
