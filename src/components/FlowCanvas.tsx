import ReactFlow, { Background, Controls, ConnectionMode } from 'reactflow';
import { useMemo } from 'react';
import type { 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  Connection, 
  OnNodesDelete, 
  OnEdgesDelete 
} from 'reactflow';
import FloatingConnectionLine from './FloatingConnectionLine';
import { nodeTypes as nodeTypesConst, edgeTypes as edgeTypesConst, defaultEdgeOptions } from '../constants';
import { Sidebar } from './Sidebar';
import type { CustomNodeData, SubgraphNodeData } from '../types';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodesDelete: OnNodesDelete;
  onEdgesDelete: OnEdgesDelete;
  onSelectionChange: (params: { nodes: Node[]; edges: Edge[] }) => void;
  selectedElement: Node | Edge | null;
  onUpdateNode: (id: string, data: Partial<CustomNodeData | SubgraphNodeData>) => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesDelete,
  onEdgesDelete,
  onSelectionChange,
  selectedElement,
  onUpdateNode,
}: FlowCanvasProps) {
  const nodeTypes = useMemo(() => nodeTypesConst, []);
  const edgeTypes = useMemo(() => edgeTypesConst, []);

  const selectedNode = selectedElement && 'data' in selectedElement 
    ? nodes.find(n => n.id === selectedElement.id) || null 
    : null;

  return (
    <div style={{ flex: 1, position: 'relative', backgroundColor: '#ffffff' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <Sidebar selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
      </ReactFlow>
    </div>
  );
}
