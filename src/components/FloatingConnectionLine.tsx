import { getSmoothStepPath } from 'reactflow';
import type { ConnectionLineComponentProps, Node } from 'reactflow';
import { getEdgeParams } from '../lib/floatingEdge';

const FloatingConnectionLine = ({
  toX,
  toY,
  fromNode,
}: ConnectionLineComponentProps) => {
  if (!fromNode) {
    return null;
  }

  const targetNode: Node = {
    id: 'connection-target',
    width: 1,
    height: 1,
    position: { x: toX, y: toY },
    positionAbsolute: { x: toX, y: toY },
    data: {},
  };

  const { sx, sy, sourcePos, targetPos } = getEdgeParams(fromNode, targetNode, [], 'connection');

  const [edgePath] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#333"
        strokeWidth={1.5}
        className="animated"
        d={edgePath}
      />
    </g>
  );
};

export default FloatingConnectionLine;
