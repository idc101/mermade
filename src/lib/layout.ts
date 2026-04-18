import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const elk = new (ELK as any).default ? new (ELK as any).default() : new (ELK as any)();

const nodeWidth = 180;
const nodeHeight = 60;

export const getLayoutedElements = async (nodes: Node[], edges: Edge[], direction = 'DOWN'): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const isHorizontal = direction === 'RIGHT';
  
  // ELK expects a specific nested structure for hierarchical layout
  // We need to build a tree of nodes
  const elkNodes: any[] = [];
  const elkEdges: any[] = edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  // Create a map for quick access
  const nodeMap = new Map<string, any>();

  // Initialize elk nodes
  nodes.forEach((node) => {
    const isSubgraph = node.type === 'subgraphNode';
    const elkNode = {
      id: node.id,
      width: isSubgraph ? undefined : (node.style?.width as number ?? nodeWidth),
      height: isSubgraph ? undefined : (node.style?.height as number ?? nodeHeight),
      children: isSubgraph ? [] : undefined,
      layoutOptions: {
        'elk.padding': '[top=60,left=40,bottom=40,right=40]',
      },
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
        elkNodes.push(elkNode);
      }
    } else {
      elkNodes.push(elkNode);
    }
  });

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeLayered': '80',
      'elk.spacing.edgeNode': '50',
      'elk.layered.spacing.edgeEdgeLayered': '50',
      'elk.spacing.edgeEdge': '50',
      'elk.padding': '[top=50,left=50,bottom=50,right=50]',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layoutedGraph = await elk.layout(graph);

  // Flatten the nodes back and apply positions
  const newNodes: Node[] = [];
  
  const processElkNode = (elkNode: any) => {
    const originalNode = nodes.find(n => n.id === elkNode.id);
    if (!originalNode) return;

    newNodes.push({
      ...originalNode,
      position: { x: elkNode.x, y: elkNode.y },
      style: {
        ...originalNode.style,
        width: elkNode.width,
        height: elkNode.height,
      },
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    });

    if (elkNode.children) {
      elkNode.children.forEach((child: any) => processElkNode(child));
    }
  };

  layoutedGraph.children?.forEach((child: any) => processElkNode(child));

  return { nodes: newNodes, edges };
};
