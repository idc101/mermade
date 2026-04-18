import dagre from 'dagre';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const nodeWidth = 180;
const nodeHeight = 60;

export const getLayoutedElements = async (nodes: Node[], edges: Edge[], direction = 'DOWN') => {
  const isHorizontal = direction === 'RIGHT' || direction === 'LR';
  const dagreDirection = isHorizontal ? 'LR' : 'TB';
  
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: dagreDirection,
    ranksep: 100,
    nodesep: 80,
  });

  // 1. Setup nodes in dagre
  nodes.forEach((node) => {
    const isSubgraph = node.type === 'subgraphNode';
    if (isSubgraph) {
       dagreGraph.setNode(node.id, { width: 0, height: 0 }); // Size will be determined by children
    } else {
       dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  // 2. Set parents
  nodes.forEach((node) => {
    if (node.parentNode) {
      dagreGraph.setParent(node.id, node.parentNode);
    }
  });

  // 3. Setup edges in dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 4. Run layout
  dagre.layout(dagreGraph);

  // 5. Pre-calculate subgraph bounds manually based on children's final dagre positions
  // Dagre's compound layout gives children absolute positions.
  const subgraphBounds = new Map<string, { width: number; height: number; left: number; top: number }>();
  
  // Sort subgraphs by depth (if they were nested, but we only have 1 level for now)
  const subgraphs = nodes.filter(n => n.type === 'subgraphNode');
  
  subgraphs.forEach(sg => {
    const children = nodes.filter(n => n.parentNode === sg.id);
    if (children.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      children.forEach(child => {
        const dNode = dagreGraph.node(child.id);
        const w = dNode.width || nodeWidth;
        const h = dNode.height || nodeHeight;
        minX = Math.min(minX, dNode.x - w / 2);
        minY = Math.min(minY, dNode.y - h / 2);
        maxX = Math.max(maxX, dNode.x + w / 2);
        maxY = Math.max(maxY, dNode.y + h / 2);
      });

      const padding = 40;
      const topPadding = 60; // Extra space for title
      
      const width = (maxX - minX) + padding * 2;
      const height = (maxY - minY) + padding + topPadding;
      const left = minX - padding;
      const top = minY - topPadding;
      
      subgraphBounds.set(sg.id, { width, height, left, top });
    } else {
      subgraphBounds.set(sg.id, { width: 200, height: 150, left: 0, top: 0 });
    }
  });

  // 6. Build final layouted nodes with correct relative positioning
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isSubgraph = node.type === 'subgraphNode';
    
    let width, height, absLeft, absTop;

    if (isSubgraph) {
      const bounds = subgraphBounds.get(node.id)!;
      width = bounds.width;
      height = bounds.height;
      absLeft = bounds.left;
      absTop = bounds.top;
    } else {
      width = nodeWithPosition.width || nodeWidth;
      height = nodeWithPosition.height || nodeHeight;
      absLeft = nodeWithPosition.x - width / 2;
      absTop = nodeWithPosition.y - height / 2;
    }

    let x = absLeft;
    let y = absTop;

    if (node.parentNode) {
      const pBounds = subgraphBounds.get(node.parentNode);
      if (pBounds) {
        // Child position is relative to its parent's top-left in ReactFlow
        x = absLeft - pBounds.left;
        y = absTop - pBounds.top;
      }
    }

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
      style: { 
        ...node.style,
        width, 
        height 
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
