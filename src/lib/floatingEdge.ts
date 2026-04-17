import { Position, internalsSymbol } from 'reactflow';
import type { Node } from 'reactflow';

// returns the position (top, right, bottom or left) of a node relative to another node
function getParams(nodeA: Node, nodeB: Node, offset = 0): [number, number, Position] {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;

  // when the nodes are further apart horizontally than vertically, we use left/right
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // otherwise we use top/bottom
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position, offset);
  return [x, y, position];
}

function getHandleCoordsByPosition(node: Node, handlePosition: Position, offset = 0) {
  // all handles are positioned relative to the node's top left corner
  const handle = node[internalsSymbol]?.handleBounds?.source?.find(
    (h) => h.position === handlePosition
  );

  let offsetX = (node.width ?? 0) / 2;
  let offsetY = (node.height ?? 0) / 2;

  // if the handle bounds are available, we can use them to get the exact position
  if (handle) {
    offsetX = handle.x + handle.width / 2;
    offsetY = handle.y + handle.height / 2;
  } else {
    // fallback if handles are not yet initialized
    switch (handlePosition) {
      case Position.Left:
        offsetX = 0;
        break;
      case Position.Right:
        offsetX = node.width ?? 0;
        break;
      case Position.Top:
        offsetY = 0;
        break;
      case Position.Bottom:
        offsetY = node.height ?? 0;
        break;
    }
  }

  // Apply offset to move the point away from the node border
  switch (handlePosition) {
    case Position.Left:
      offsetX -= offset;
      break;
    case Position.Right:
      offsetX += offset;
      break;
    case Position.Top:
      offsetY -= offset;
      break;
    case Position.Bottom:
      offsetY += offset;
      break;
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
export function getEdgeParams(source: Node, target: Node) {
  const [sx, sy, sourcePos] = getParams(source, target);
  // Using an offset for the target so the arrowhead isn't hidden by the node
  const [tx, ty, targetPos] = getParams(target, source, 10);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
