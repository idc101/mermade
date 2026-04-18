import { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import { useDiagramState } from './hooks/useDiagramState';
import { useExport } from './hooks/useExport';
import { EditorPane } from './components/EditorPane';
import { FlowCanvas } from './components/FlowCanvas';

function App() {
  const {
    text,
    setText,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    onEdgesDelete,
    handleAutoLayout,
    addNewNode,
    addNewSubgraph,
    updateSelectedNode,
  } = useDiagramState();

  const { exportPng, exportSvg } = useExport();

  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedElement(nodes[0] || edges[0] || null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', color: 'black' }}>
      <EditorPane
        text={text}
        onTextChange={setText}
        onAddNode={addNewNode}
        onAddSubgraph={addNewSubgraph}
        onAutoLayout={handleAutoLayout}
        onExportPng={exportPng}
        onExportSvg={exportSvg}
      />

      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={onSelectionChange}
        selectedElement={selectedElement}
        onUpdateNode={updateSelectedNode}
      />
    </div>
  );
}

export default App;
