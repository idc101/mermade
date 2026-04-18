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
import { buildMermaidText } from '../lib/serializer';
import { getLayoutedElements } from '../lib/layout';
import type { CustomNodeData, SubgraphNodeData } from '../types';
import { initialText, STORAGE_KEY } from '../constants';

export function useDiagramState() {
  const [text, setText] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || initialText;
  });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const isInternalUpdate = useRef(false);

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

    const updateLayout = async () => {
      const { nodes: parsedNodes, edges: parsedEdges, config, mermaidText } = parseMermaid(text);
      
      // Ensure all parsed edges use the floating type
      const floatingEdges = parsedEdges.map(edge => ({
        ...edge,
        type: 'floating',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#000',
        },
      }));

      // Determine direction from mermaid text
      const isHorizontal = mermaidText.includes('graph LR') || mermaidText.includes('flowchart LR');
      const elkDirection = isHorizontal ? 'RIGHT' : 'DOWN';

      // If no positions are stored in config, auto-layout
      const hasPositions = Object.keys(config.nodes).length > 0;
      if (!hasPositions && parsedNodes.length > 0) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(parsedNodes, floatingEdges, elkDirection);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } else {
        setNodes(parsedNodes);
        setEdges(floatingEdges);
      }
    };

    updateLayout();
  }, [text]);

  const syncToText = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    isInternalUpdate.current = true;
    const newFullText = buildMermaidText(newNodes, newEdges, text);
    setText(newFullText);
  }, [text]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        isInternalUpdate.current = true;
        const newText = buildMermaidText(nextNodes, edges, text);
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

  const updateSelectedNode = useCallback((id: string, data: Partial<CustomNodeData | SubgraphNodeData>) => {
    setNodes((nds) => {
      const nextNodes = nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      });
      syncToText(nextNodes, edges);
      return nextNodes;
    });
  }, [edges, syncToText]);

  const handleAutoLayout = useCallback(async () => {
    const cleanedText = clearConfig(text);
    const { nodes: parsedNodes, edges: parsedEdges, mermaidText } = parseMermaid(cleanedText);
    
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
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    isInternalUpdate.current = true;
    const newText = buildMermaidText(layoutedNodes, layoutedEdges, cleanedText);
    setText(newText);
  }, [text]);

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
  };
}
