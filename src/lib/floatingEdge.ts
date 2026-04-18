import { Position, internalsSymbol } from 'reactflow';
import type { Node, Edge } from 'reactflow';

// returns the position (top, right, bottom or left) of a node relative to another node
function getParams(nodeA: Node, nodeB: Node): Position {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;

  const width = nodeA.width ?? 1;
  const height = nodeA.height ?? 1;

  // Normalize the difference by dimensions to account for aspect ratio
  const nx = dx / width;
  const ny = dy / height;

  if (Math.abs(nx) > Math.abs(ny)) {
    return nx > 0 ? Position.Right : Position.Left;
  } else {
    return ny > 0 ? Position.Bottom : Position.Top;
  }
}

function getHandleCoordsByPosition(
  node: Node, 
  handlePosition: Position, 
  allNodes: Node[],
  allEdges: Edge[], 
  edgeId: string,
  isTarget: boolean,
  offset = 0
) {
  // all handles are positioned relative to the node's top left corner
  const handles = (node[internalsSymbol]?.handleBounds?.source ?? []).filter(
    (h) => h.position === handlePosition
  );

  // Fallback if no handles are found
  if (handles.length === 0) {
    let offsetX = (node.width ?? 0) / 2;
    let offsetY = (node.height ?? 0) / 2;

    switch (handlePosition) {
      case Position.Left: offsetX = 0; break;
      case Position.Right: offsetX = node.width ?? 0; break;
      case Position.Top: offsetY = 0; break;
      case Position.Bottom: offsetY = node.height ?? 0; break;
    }

    // Apply offset
    switch (handlePosition) {
      case Position.Left: offsetX -= offset; break;
      case Position.Right: offsetX += offset; break;
      case Position.Top: offsetY -= offset; break;
      case Position.Bottom: offsetY += offset; break;
    }

    return [
      (node.positionAbsolute?.x ?? 0) + offsetX,
      (node.positionAbsolute?.y ?? 0) + offsetY,
    ];
  }

  // Find all edges connected to THIS node on THIS side
  const edgesOnThisSide = allEdges.filter(e => {
    const isSource = e.source === node.id;
    const isTargetOfEdge = e.target === node.id;
    
    if (!isSource && !isTargetOfEdge) return false;

    const otherNodeId = isSource ? e.target : e.source;
    const otherNode = allNodes.find(n => n.id === otherNodeId);
    if (!otherNode) return false;

    // Check if this edge's preferred side on THIS node matches handlePosition
    const preferredSide = isSource 
        ? getParams(node, otherNode) 
        : getParams(node, otherNode); // getParams is symmetric in logic but we pass it as nodeA
    
    return preferredSide === handlePosition;
  }).sort((a, b) => a.id.localeCompare(b.id));

  // Find the index of the current edge
  const index = edgesOnThisSide.findIndex(e => e.id === edgeId);
  const count = edgesOnThisSide.length;

  // Map index/count to a handle index
  // We have 3 handles: [0, 1, 2] where 1 is center.
  let handleIndex = 1; // Default to center

  if (count > 1) {
    if (count === 2) {
        handleIndex = index === 0 ? 0 : 2;
    } else {
        handleIndex = index % handles.length;
    }
  }

  const handle = handles[handleIndex] || handles[0];

  let offsetX = handle.x + handle.width / 2;
  let offsetY = handle.y + handle.height / 2;

  // Apply offset
  switch (handlePosition) {
    case Position.Left: offsetX -= offset; break;
    case Position.Right: offsetX += offset; break;
    case Position.Top: offsetY -= offset; break;
    case Position.Bottom: offsetY += offset; break;
  }

  return [
    (node.positionAbsolute?.x ?? 0) + offsetX,
    (node.positionAbsolute?.y ?? 0) + offsetY,
  ];
}

function getNodeCenter(node: Node) {
  return {
    x: (node.positionAbsolute?.x ?? 0) + (node.width ?? 0) / 2,
    y: (node.positionAbsolute?.y ?? 0) + (node.height ?? 0) / 2,
  };
}

// returns the handle positions and coordinates for an edge between two nodes
export function getEdgeParams(source: Node, target: Node, allEdges: Edge[], edgeId: string, allNodes: Node[] = []) {
  // If allNodes is not provided, we at least have source and target
  const nodes = allNodes.length > 0 ? allNodes : [source, target];
    
  const sourcePos = getParams(source, target);
  const targetPos = getParams(target, source);

  const [sx, sy] = getHandleCoordsByPosition(source, sourcePos, nodes, allEdges, edgeId, false);
  // Using an offset for the target so the arrowhead isn't hidden by the node
  const [tx, ty] = getHandleCoordsByPosition(target, targetPos, nodes, allEdges, edgeId, true, 10);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
