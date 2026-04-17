import dagre from 'dagre';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 150;
const nodeHeight = 50;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    if (node.type === 'subgraphNode') {
       // Subgraphs don't have a fixed size yet, dagre will compute it if we don't set it?
       // Actually dagre needs some initial size or it might not work well.
       dagreGraph.setNode(node.id, { width: 0, height: 0 });
    } else {
       dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
    
    if (node.parentNode) {
      dagreGraph.setParent(node.id, node.parentNode);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let x = nodeWithPosition.x - (nodeWithPosition.width || nodeWidth) / 2;
    let y = nodeWithPosition.y - (nodeWithPosition.height || nodeHeight) / 2;

    // If node has a parent, its position must be relative to the parent in ReactFlow
    if (node.parentNode) {
      const parentWithPosition = dagreGraph.node(node.parentNode);
      const parentX = parentWithPosition.x - (parentWithPosition.width || 0) / 2;
      const parentY = parentWithPosition.y - (parentWithPosition.height || 0) / 2;
      x -= parentX;
      y -= parentY;
    }

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
      style: node.type === 'subgraphNode' ? { 
        ...node.style,
        width: nodeWithPosition.width, 
        height: nodeWithPosition.height 
      } : node.style,
    };
  });

  return { nodes: layoutedNodes, edges };
};
