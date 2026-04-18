import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const elk = new ELK();

const nodeWidth = 180;
const nodeHeight = 60;

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
};

export const getLayoutedElements = async (nodes: Node[], edges: Edge[], direction = 'DOWN') => {
  const isHorizontal = direction === 'RIGHT' || direction === 'LR';
  const elkDirection = isHorizontal ? 'RIGHT' : 'DOWN';

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': elkDirection,
    },
    children: [] as any[],
    edges: [] as any[],
  };

  // Map to build the hierarchy
  const nodeMap = new Map<string, any>();

  // Initialize all nodes in the map first
  nodes.forEach((node) => {
    const isSubgraph = node.type === 'subgraphNode';
    const elkNode = {
      id: node.id,
      // ELK requires an initial width/height for all nodes. 
      // For compound nodes (subgraphs), it will calculate the size from children, 
      // but providing 0 prevents a "TypeError: Cannot read properties of null (reading 'pe')"
      width: isSubgraph ? node.width || 0 : (node.width || nodeWidth),
      height: isSubgraph ? node.height || 0 : (node.height || nodeHeight),
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
        // Parent not found, put it in root
        elkGraph.children.push(elkNode);
      }
    } else {
      elkGraph.children.push(elkNode);
    }
  });

  // Add edges
  edges.forEach((edge) => {
    // We need to find the lowest common ancestor for the edge
    // For simplicity, if we don't find it, we put it in root.
    // ELK prefers edges to be at the level where they connect.
    elkGraph.edges.push({
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
