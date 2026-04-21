import { useCallback, useState, useRef, useEffect } from 'react';
import { useStore, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getEdgeParams } from '../lib/floatingEdge';

interface FloatingEdgeProps extends EdgeProps {
  onUpdateEdge?: (id: string, data: any) => void;
}

function FloatingEdge({ id, source, target, markerEnd, style, label, data, onUpdateEdge, selected }: FloatingEdgeProps) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));
  const allEdges = useStore(useCallback((store) => store.edges, []));
  const allNodes = useStore(useCallback((store) => Array.from(store.nodeInternals.values()), []));

  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  
  const [localOffset, setLocalOffset] = useState(data?.labelOffset || { x: 0, y: 0 });
  const [localControlPoint, setLocalControlPoint] = useState(data?.controlPoint || null);

  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const controlStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDraggingLabel) {
      setLocalOffset(data?.labelOffset || { x: 0, y: 0 });
    }
  }, [data?.labelOffset, isDraggingLabel]);

  useEffect(() => {
    if (!isDraggingHandle) {
      setLocalControlPoint(data?.controlPoint || null);
    }
  }, [data?.controlPoint, isDraggingHandle]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode, allEdges, id, allNodes);

  let finalPath = '';
  let labelX = 0;
  let labelY = 0;

  if (localControlPoint) {
    // If we have a control point, we create a stepped path through it
    // From source to control point
    const [path1] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: localControlPoint.x,
      targetY: localControlPoint.y,
    });
    
    // From control point to target
    const [path2, lx, ly] = getSmoothStepPath({
      sourceX: localControlPoint.x,
      sourceY: localControlPoint.y,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
    });
    
    finalPath = `${path1} ${path2}`;
    labelX = lx;
    labelY = ly;
  } else {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });
    finalPath = path;
    labelX = lx;
    labelY = ly;
  }

  const onMouseDownLabel = (event: React.MouseEvent) => {
    setIsDraggingLabel(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    offsetStart.current = { ...localOffset };
    event.stopPropagation();
  };

  const onMouseDownHandle = (event: React.MouseEvent) => {
    setIsDraggingHandle(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    
    // Default control point to middle if not set
    const startCP = localControlPoint || { x: (sx + tx) / 2, y: (sy + ty) / 2 };
    controlStart.current = { ...startCP };
    setLocalControlPoint(startCP);
    event.stopPropagation();
  };

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (isDraggingLabel) {
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setLocalOffset({
        x: offsetStart.current.x + dx,
        y: offsetStart.current.y + dy,
      });
    } else if (isDraggingHandle) {
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setLocalControlPoint({
        x: controlStart.current.x + dx,
        y: controlStart.current.y + dy,
      });
    }
  }, [isDraggingLabel, isDraggingHandle]);

  const onMouseUp = useCallback(() => {
    if (isDraggingLabel || isDraggingHandle) {
      if (isDraggingLabel) {
        onUpdateEdge?.(id, { labelOffset: localOffset });
      } else {
        onUpdateEdge?.(id, { controlPoint: localControlPoint });
      }
      setIsDraggingLabel(false);
      setIsDraggingHandle(false);
    }
  }, [isDraggingLabel, isDraggingHandle, id, localOffset, localControlPoint, onUpdateEdge]);

  useEffect(() => {
    if (isDraggingLabel || isDraggingHandle) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDraggingLabel, isDraggingHandle, onMouseMove, onMouseUp]);

  const finalX = labelX + localOffset.x;
  const finalY = labelY + localOffset.y;

  return (
    <>
      <BaseEdge path={finalPath} markerEnd={markerEnd} style={style} />
      
      {selected && (
        <circle
          cx={localControlPoint?.x || (sx + tx) / 2}
          cy={localControlPoint?.y || (sy + ty) / 2}
          r={5}
          fill="#3b82f6"
          style={{ cursor: 'move', pointerEvents: 'all' }}
          onMouseDown={onMouseDownHandle}
        />
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${finalX}px,${finalY}px)`,
              pointerEvents: 'all',
              cursor: 'move',
              backgroundColor: 'white',
              padding: '2px 4px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '10px'
            }}
            className="nodrag nopan edge-label"
            onMouseDown={onMouseDownLabel}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default FloatingEdge;
