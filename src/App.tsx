import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
  addEdge,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import type {
  OnNodesChange,
  OnEdgesChange,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import FloatingEdge from './components/FloatingEdge';
import FloatingConnectionLine from './components/FloatingConnectionLine';
import { parseMermaid, serializeMermaid } from './lib/parser';
import { getLayoutedElements } from './lib/layout';

import { toPng } from 'html-to-image';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
};

const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#333',
  },
};

const initialText = `flowchart TD
  WebApp[Web Application]
  DB[(PostgreSQL Database)]
  Cache[(Redis)]

  WebApp -->|Reads/Writes user data| DB
  WebApp -->|Fetches session| Cache`;

const STORAGE_KEY = 'arrows-diagram-text';

function App() {
  const [text, setText] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || initialText;
  });
  const [nodes, setNodes] = useState<Node[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text);
  }, [text]);

  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const isInternalUpdate = useRef(false);

  const exportSvg = useCallback(() => {
    const svg = document.querySelector('.react-flow__renderer svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'diagram.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }, []);

  const exportPng = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      toPng(viewport, {
        backgroundColor: '#fafafa',
      }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = dataUrl;
        link.click();
      });
    }
  }, []);

  // Sync text -> nodes/edges
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const { nodes: parsedNodes, edges: parsedEdges, config } = parseMermaid(text);
    
    // Ensure all parsed edges use the floating type
    const floatingEdges = parsedEdges.map(edge => ({
      ...edge,
      type: 'floating',
      markerEnd: 'url(#arrowhead)',
    }));

    // If no positions are stored in config, auto-layout
    const hasPositions = Object.keys(config.nodes).length > 0;
    if (!hasPositions && parsedNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(parsedNodes, floatingEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes(parsedNodes);
      setEdges(floatingEdges);
    }
  }, [text]);

  const syncToText = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    isInternalUpdate.current = true;
    const mermaidLines = text.split('%% --- arrows-config --- %%')[0].trim().split('\n');
    const header = mermaidLines[0] || 'flowchart TD';
    
    // Reconstruct semantic part
    const nodeDefs = newNodes.map(n => `  ${n.id}[${n.data.label || n.id}]`).join('\n');
    const edgeDefs = newEdges.map(e => `  ${e.source} -->${e.label ? `|${e.label}|` : ''} ${e.target}`).join('\n');
    
    const newMermaidPart = `${header}\n${nodeDefs}\n\n${edgeDefs}`;
    const newFullText = serializeMermaid(newNodes, newEdges, newMermaidPart);
    setText(newFullText);
  }, [text]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        isInternalUpdate.current = true;
        const newText = serializeMermaid(nextNodes, edges, text.split('%% --- arrows-config --- %%')[0]);
        setText(newText);
        return nextNodes;
      });
    },
    [edges, text]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const edgeId = `${params.source}-${params.target}`;
      const newEdge: Edge = {
        ...params,
        id: edgeId,
        source: params.source,
        target: params.target,
        type: 'floating',
        markerEnd: 'url(#arrowhead)',
      };
      
      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds);
        syncToText(nodes, nextEdges);
        return nextEdges;
      });
    },
    [nodes, syncToText]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      setNodes((nds) => {
        const nextNodes = nds.filter((node) => !deletedNodes.some((dn) => dn.id === node.id));
        syncToText(nextNodes, edges);
        return nextNodes;
      });
    },
    [edges, syncToText]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setEdges((eds) => {
        const nextEdges = eds.filter((edge) => !deletedEdges.some((de) => de.id === edge.id));
        syncToText(nodes, nextEdges);
        return nextEdges;
      });
    },
    [nodes, syncToText]
  );

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedElement(nodes[0] || edges[0] || null);
  }, []);

  const updateSelectedNode = (data: any) => {
    if (!selectedElement || !('data' in selectedElement)) return;
    
    setNodes((nds) => {
      const nextNodes = nds.map((node) => {
        if (node.id === selectedElement.id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      });
      syncToText(nextNodes, edges);
      return nextNodes;
    });
  };

  const addNewNode = useCallback(() => {
    const id = `node_${Math.random().toString(36).substring(2, 11)}`;
    const newNode: Node = {
      id,
      type: 'customNode',
      data: { label: 'New Service', icon: 'Square', color: '#ffffff' },
      position: { x: 100, y: 100 },
    };
    
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    syncToText(nextNodes, edges);
  }, [nodes, edges, syncToText]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', color: 'black' }}>
      <div style={{ width: '400px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <div style={{ padding: '10px', backgroundColor: '#f5f5f5', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Mermaid Editor</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={addNewNode}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
            >
              + Node
            </button>
            <button 
              onClick={exportPng}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              PNG
            </button>
            <button 
              onClick={exportSvg}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              SVG
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'black',
          }}
        />
      </div>

      <div style={{ flex: 1, position: 'relative', backgroundColor: '#fafafa' }}>
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
          
          {selectedElement && 'data' in selectedElement && (() => {
            const currentNode = nodes.find(n => n.id === selectedElement.id);
            if (!currentNode) return null;
            return (
              <Panel position="top-right" style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Node Styles</div>
                <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                  <label>Label:</label>
                  <input
                    type="text"
                    value={currentNode.data.label || ''}
                    onChange={(e) => updateSelectedNode({ label: e.target.value })}
                    style={{ marginBottom: '5px', padding: '2px' }}
                  />
                  <label>Color:</label>
                  <input
                    type="color"
                    value={currentNode.data.color || '#ffffff'}
                    onChange={(e) => updateSelectedNode({ color: e.target.value })}
                  />
                  <label>Icon:</label>
                  <select
                    value={currentNode.data.icon || 'Square'}
                    onChange={(e) => updateSelectedNode({ icon: e.target.value })}
                  >
                    <option value="Square">Square</option>
                    <option value="Database">Database</option>
                    <option value="Server">Server</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Cpu">CPU</option>
                    <option value="MessageCircle">Queue</option>
                  </select>
                </div>
              </Panel>
            );
          })()}
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
