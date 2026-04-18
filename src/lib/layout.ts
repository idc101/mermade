import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.edgeNode': '60',
  'elk.layered.spacing.edgeNodeBetweenLayers': '60',
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
};

const calculateNodeSize = (label: string, hasIcon: boolean) => {
  const charWidth = 9;
  const padding = 40;
  const iconSpace = hasIcon ? 24 : 0;
  const width = Math.max(120, (label.length * charWidth) + padding + iconSpace);
  const height = 50;
  return { width, height };
};

export const getLayoutedElements = async (nodes: Node[], edges: Edge[], direction = 'DOWN') => {
  const isHorizontal = direction === 'RIGHT' || direction === 'LR';
  const elkDirection = isHorizontal ? 'RIGHT' : 'DOWN';

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': elkDirection,
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    },
    children: [] as any[],
    edges: [] as any[],
  };

  // Map to build the hierarchy
  const nodeMap = new Map<string, any>();

  // Initialize all nodes in the map first
  nodes.forEach((node) => {
    const isSubgraph = node.type === 'subgraphNode';
    const { width: dynamicWidth, height: dynamicHeight } = isSubgraph 
      ? { width: 0, height: 0 } 
      : calculateNodeSize(node.data.label || '', !!node.data.icon);

    const elkNode = {
      id: node.id,
      width: isSubgraph ? (node.style?.width as number || 0) : (node.style?.width as number || dynamicWidth),
      height: isSubgraph ? (node.style?.height as number || 0) : (node.style?.height as number || dynamicHeight),
      children: isSubgraph ? [] : undefined,
      layoutOptions: isSubgraph ? { 
        'elk.padding': '[top=100,left=40,bottom=40,right=40]', // Extra space for title
      } : {},
    };
    nodeMap.set(node.id, elkNode);
  });

  // Build the hierarchy
  nodes.forEach((node) => {
    const elkNode = nodeMap.get(node.id);
    if (node.parentNode) {
      const parent = nodeMap.get(node.parentNode);
      if (parent) {
        parent.children.push(elkNode);
      } else {
        elkGraph.children.push(elkNode);
      }
    } else {
      elkGraph.children.push(elkNode);
    }
  });

  // Find the lowest common ancestor for an edge
  const getLCA = (sourceId: string, targetId: string): any => {
    const getPath = (id: string) => {
      const path: string[] = [];
      let current = nodes.find(n => n.id === id);
      while (current) {
        path.unshift(current.id);
        current = nodes.find(n => n.id === current?.parentNode);
      }
      return path;
    };

    const sourcePath = getPath(sourceId);
    const targetPath = getPath(targetId);

    let lcaId = 'root';
    for (let i = 0; i < Math.min(sourcePath.length, sourcePath.length); i++) {
      if (sourcePath[i] === targetPath[i]) {
        // If the common node is a subgraph, it's a potential LCA
        const node = nodes.find(n => n.id === sourcePath[i]);
        if (node?.type === 'subgraphNode') {
          lcaId = node.id;
        }
      } else {
        break;
      }
    }

    return lcaId === 'root' ? elkGraph : nodeMap.get(lcaId);
  };

  // Add edges to their LCA container
  edges.forEach((edge) => {
    const container = getLCA(edge.source, edge.target);
    if (!container.edges) container.edges = [];
    
    container.edges.push({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    });
  });

  const layoutedGraph = await elk.layout(elkGraph);

  // Flatten the nodes back to ReactFlow format
  const flattenNodes = (elkNode: any, parentX = 0, parentY = 0): any[] => {
    const originalNode = nodes.find((n) => n.id === elkNode.id);
    if (!originalNode) return [];

    const isSubgraph = originalNode.type === 'subgraphNode';
    
    // ReactFlow positions are relative to parent for children
    // ELK positions are relative to parent
    const x = elkNode.x;
    const y = elkNode.y;

    const result = [{
      ...originalNode,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
      style: {
        ...originalNode.style,
        width: elkNode.width,
        height: elkNode.height,
      },
    }];

    if (elkNode.children) {
      elkNode.children.forEach((child: any) => {
        result.push(...flattenNodes(child, x, y));
      });
    }

    return result;
  };

  const layoutedNodes = layoutedGraph.children?.flatMap((child: any) => flattenNodes(child)) || [];

  return { nodes: layoutedNodes, edges };
};
