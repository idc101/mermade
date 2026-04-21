import { useState, useCallback, useEffect, useRef } from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  MarkerType,
} from 'reactflow';
import type {
  OnNodesChange,
  OnEdgesChange,
  Node,
  Edge,
  Connection,
} from 'reactflow';
import { parseMermaid, clearConfig } from '../lib/parser';
import { buildMermaidText, syncVisualConfigToText } from '../lib/serializer';
import { getLayoutedElements } from '../lib/layout';
import type { CustomNodeData, SubgraphNodeData } from '../types';
import { initialText, STORAGE_KEY } from '../constants';

export function useDiagramState() {
  const [text, setTextState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || initialText;
  });
  const textRef = useRef(text);
  
  const setText = useCallback((newText: string) => {
    textRef.current = newText;
    setTextState(newText);
  }, []);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const isInternalUpdate = useRef(false);
  const lastSemanticText = useRef<string>('');
  const layoutBaseline = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, text);
  }, [text]);

  // Sync text -> nodes/edges
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const { nodes: parsedNodes, edges: parsedEdges, config, mermaidText, success } = parseMermaid(text);
    
    // If parsing fails but there is text, don't clear the diagram (prevents flicker while typing)
    if (!success && text.trim().length > 0) {
      return;
    }

    const floatingEdges = parsedEdges.map(edge => ({
      ...edge,
      type: 'floating',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#000',
      },
    }));

    const isHorizontal = mermaidText.includes('graph LR') || mermaidText.includes('flowchart LR');
    const elkDirection = isHorizontal ? 'RIGHT' : 'DOWN';

    if (mermaidText !== lastSemanticText.current) {
      lastSemanticText.current = mermaidText;
      
      const updateLayout = async () => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(parsedNodes, floatingEdges, elkDirection);
        layoutBaseline.current = { nodes: layoutedNodes, edges: layoutedEdges };

        // Apply config on top of layouted baseline
        const mergedNodes = layoutedNodes.map(ln => {
          const visual = config.nodes[ln.id];
          if (!visual) return ln;
          return {
            ...ln,
            position: { x: visual.x ?? ln.position.x, y: visual.y ?? ln.position.y },
            style: { 
              ...ln.style, 
              width: visual.width ?? ln.style?.width, 
              height: visual.height ?? ln.style?.height 
            },
            data: { 
              ...ln.data, 
              color: visual.color ?? ln.data.color, 
              icon: visual.icon ?? ln.data.icon 
            }
          };
        });

        const mergedEdges = layoutedEdges.map(le => {
          const visual = config.edges[le.id];
          if (!visual) return le;
          return {
            ...le,
            animated: visual.animated ?? le.animated,
            style: { ...le.style, stroke: visual.stroke ?? le.style?.stroke }
          };
        });

        setNodes(mergedNodes);
        setEdges(mergedEdges);
      };

      updateLayout();
    } else {
      // Semantic text didn't change, but config might have (e.g. manual edit in editor)
      // Update nodes from parsed state (which includes config) but keep existing baseline
      setNodes(parsedNodes);
      setEdges(floatingEdges);
    }
  }, [text]);

  const syncToText = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    isInternalUpdate.current = true;
    const newFullText = buildMermaidText(
      newNodes, 
      newEdges, 
      textRef.current, 
      layoutBaseline.current.nodes, 
      layoutBaseline.current.edges
    );
    setText(newFullText);
  }, [setText]);

  const syncVisualToText = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    isInternalUpdate.current = true;
    const newFullText = syncVisualConfigToText(
      newNodes, 
      newEdges, 
      textRef.current, 
      layoutBaseline.current.nodes, 
      layoutBaseline.current.edges
    );
    setText(newFullText);
  }, [setText]);

  // Debounced versions for frequent updates (like dragging)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSyncVisualToText = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncVisualToText(newNodes, newEdges);
    }, 200);
  }, [syncVisualToText]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        const hasPositionChange = changes.some(c => c.type === 'position' || c.type === 'dimensions');
        
        if (hasPositionChange) {
           debouncedSyncVisualToText(nextNodes, edges);
        }
        return nextNodes;
      });
    },
    [edges, debouncedSyncVisualToText]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const edgeId = `${params.source}-${params.target}-${Date.now()}`;
      const newEdge: Edge = {
        ...params,
        id: edgeId,
        source: params.source,
        target: params.target,
        type: 'floating',
        markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#000',
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
        const deletedIds = new Set(deletedNodes.map(n => n.id));
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
          !deletedIds.has(node.id) && 
          !childIdsToDelete.has(node.id)
        );
        
        setEdges(eds => {
           const nextEdges = eds.filter(edge => 
             !deletedIds.has(edge.source) && !deletedIds.has(edge.target) &&
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

  const updateSelectedNode = useCallback((id: string, data: Partial<CustomNodeData | SubgraphNodeData>) => {
    setNodes((nds) => {
      const nextNodes = nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      });
      
      syncVisualToText(nextNodes, edges);
      return nextNodes;
    });
  }, [edges, syncVisualToText]);

  const updateSelectedEdge = useCallback((id: string, data: any) => {
    setEdges((eds) => {
      const nextEdges = eds.map((edge) => {
        if (edge.id === id) {
          return { ...edge, data: { ...edge.data, ...data } };
        }
        return edge;
      });

      syncVisualToText(nodes, nextEdges);
      return nextEdges;
    });
  }, [nodes, syncVisualToText]);

  const handleAutoLayout = useCallback(async () => {
    const cleanedText = clearConfig(textRef.current);
    const { nodes: parsedNodes, edges: parsedEdges, mermaidText, success } = parseMermaid(cleanedText);
    
    if (!success) return;

    const floatingEdges = parsedEdges.map(edge => ({
      ...edge,
      type: 'floating',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#000',
      },
    }));

    const isHorizontal = mermaidText.includes('graph LR') || mermaidText.includes('flowchart LR');
    const elkDirection = isHorizontal ? 'RIGHT' : 'DOWN';

    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(parsedNodes, floatingEdges, elkDirection);
    
    layoutBaseline.current = { nodes: layoutedNodes, edges: layoutedEdges };
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    isInternalUpdate.current = true;
    // Pass the layouted nodes as baseline so buildMermaidText sees no difference and skips config
    const newText = buildMermaidText(layoutedNodes, layoutedEdges, cleanedText, layoutedNodes, layoutedEdges);
    setText(newText);
    lastSemanticText.current = mermaidText;
  }, [setText]);

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

  return {
    text,
    setText,
    nodes,
    setNodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    onEdgesDelete,
    handleAutoLayout,
    addNewNode,
    addNewSubgraph,
    updateSelectedNode,
    updateSelectedEdge,
  };
}
