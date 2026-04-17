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
import { Icon as IconifyIcon } from '@iconify/react';

import CustomNode from './components/CustomNode';
import SubgraphNode from './components/SubgraphNode';
import FloatingEdge from './components/FloatingEdge';
import FloatingConnectionLine from './components/FloatingConnectionLine';
import { parseMermaid, serializeMermaid, clearConfig } from './lib/parser';
import { getLayoutedElements } from './lib/layout';

import { toPng } from 'html-to-image';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
  subgraphNode: SubgraphNode,
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
  subgraph DataLayer[Data Layer]
    DB[(PostgreSQL Database)]
    Cache[(Redis)]
  end
  WebApp[Web Application]

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
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#333',
      },
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
    const parts = text.split('%% --- arrows-config --- %%');
    const semanticPart = parts[0];
    const mermaidLines = semanticPart.trim().split('\n');
    const header = mermaidLines[0] || 'flowchart TD';

    const getNodeDef = (n: Node) => {
      const iconTag = n.data.icon ? `<icon icon="${n.data.icon}" /> ` : '';
      const label = n.data.label || n.id;
      const fullLabel = `${iconTag}${label}`.trim();
      
      let leftBracket = '[';
      let rightBracket = ']';
      
      if (n.data.shape === 'database') {
        leftBracket = '[(';
        rightBracket = ')]';
      } else if (n.data.shape === 'diamond') {
        leftBracket = '{';
        rightBracket = '}';
      }
      
      return `  ${n.id}${leftBracket}${fullLabel}${rightBracket}`;
    };

    const subgraphs = newNodes.filter(n => n.type === 'subgraphNode');
    const rootNodes = newNodes.filter(n => !n.parentNode && n.type !== 'subgraphNode');

    const subgraphDefs = subgraphs.map(sg => {
      const children = newNodes.filter(n => n.parentNode === sg.id);
      const childDefs = children.map(n => `    ${getNodeDef(n).trim()}`).join('\n');
      return `  subgraph ${sg.id}[${sg.data.label}]\n${childDefs}\n  end`;
    }).join('\n');
    
    const rootNodeDefs = rootNodes.map(n => getNodeDef(n)).join('\n');
    const edgeDefs = newEdges.map(e => `  ${e.source} -->${e.label ? `|${e.label}|` : ''} ${e.target}`).join('\n');
    
    const newMermaidPart = `${header}\n${subgraphDefs}\n${rootNodeDefs}\n\n${edgeDefs}`;
    const newFullText = serializeMermaid(newNodes, newEdges, newMermaidPart);
    setText(newFullText);
  }, [text]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        isInternalUpdate.current = true;
        const semanticPart = text.split('%% --- arrows-config --- %%')[0];
        const newText = serializeMermaid(nextNodes, edges, semanticPart);
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
        markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#333',
      },
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
        // Find children of deleted subgraphs
        const childIdsToDelete = new Set<string>();
        deletedNodes.forEach(dn => {
          if (dn.type === 'subgraphNode') {
            nds.forEach(n => {
              if (n.parentNode === dn.id) {
                childIdsToDelete.add(n.id);
              }
            });
          }
        });

        const nextNodes = nds.filter((node) => 
          !deletedNodes.some((dn) => dn.id === node.id) && 
          !childIdsToDelete.has(node.id)
        );
        
        // Also need to delete edges connected to these children
        setEdges(eds => {
           const nextEdges = eds.filter(edge => 
             !childIdsToDelete.has(edge.source) && !childIdsToDelete.has(edge.target)
           );
           syncToText(nextNodes, nextEdges);
           return nextEdges;
        });

        return nextNodes;
      });
    },
    [syncToText]
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

  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<string[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);

  useEffect(() => {
    if (!iconSearch || iconSearch.length < 2) {
      setIconResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingIcons(true);
      try {
        const response = await fetch(`https://api.iconify.design/search?query=${iconSearch}&limit=32`);
        const data = await response.json();
        setIconResults(data.icons || []);
      } catch (e) {
        console.error('Failed to search icons:', e);
      } finally {
        setIsSearchingIcons(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [iconSearch]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedElement(nodes[0] || edges[0] || null);
    setIconSearch('');
    setIconResults([]);
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

  const addNewSubgraph = useCallback(() => {
    const id = `subgraph_${Math.random().toString(36).substring(2, 11)}`;
    const newSubgraph: Node = {
      id,
      type: 'subgraphNode',
      data: { label: 'New Subgraph', color: 'rgba(240, 240, 240, 0.5)' },
      position: { x: 100, y: 100 },
      style: { width: 200, height: 200 },
    };
    
    const nextNodes = [...nodes, newSubgraph];
    setNodes(nextNodes);
    syncToText(nextNodes, edges);
  }, [nodes, edges, syncToText]);

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

  const handleAutoLayout = useCallback(() => {
    const cleanedText = clearConfig(text);
    const { nodes: parsedNodes, edges: parsedEdges } = parseMermaid(cleanedText);
    
    // Ensure all parsed edges use the floating type
    const floatingEdges = parsedEdges.map(edge => ({
      ...edge,
      type: 'floating',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#333',
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(parsedNodes, floatingEdges);
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Also update the text to clear the config and store new layouted positions
    isInternalUpdate.current = true;
    const newText = serializeMermaid(layoutedNodes, layoutedEdges, cleanedText);
    setText(newText);
  }, [text, edges]);

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
              onClick={addNewSubgraph}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
            >
              + Subgraph
            </button>
            <button 
              onClick={handleAutoLayout}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: '12px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            >
              Auto Layout
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
              <Panel position="top-right" style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }}>
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
                    style={{ marginBottom: '5px' }}
                  />
                  <label>Icon Search:</label>
                  <input
                    type="text"
                    placeholder="Search icons..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    style={{ marginBottom: '5px', padding: '2px' }}
                  />
                  {isSearchingIcons && <div style={{ fontSize: '10px' }}>Searching...</div>}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '5px', 
                    maxHeight: '120px', 
                    overflowY: 'auto',
                    border: '1px solid #eee',
                    padding: '5px',
                    borderRadius: '2px'
                  }}>
                    {iconResults.map(icon => (
                      <div 
                        key={icon}
                        onClick={() => updateSelectedNode({ icon })}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '4px', 
                          border: `1px solid ${currentNode.data.icon === icon ? '#3b82f6' : 'transparent'}`,
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: currentNode.data.icon === icon ? '#eff6ff' : 'transparent'
                        }}
                        title={icon}
                      >
                        <IconifyIcon icon={icon} width={20} height={20} />
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '5px', color: '#666' }}>
                    Current: {currentNode.data.icon || 'none'}
                  </div>
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
