import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const SubgraphNode = ({ data }: NodeProps) => {
  return (
    <>
      <div className="subgraph-label absolute top-4 left-0 right-0 pointer-events-none text-center font-semibold text-sm text-black uppercase tracking-wider">
        {data.label}
      </div>
      
      {/* 4 Handles for Floating Edges */}
      <Handle type="source" position={Position.Top} id="t" className="custom-handle" style={{ pointerEvents: 'all' }} />
      <Handle type="source" position={Position.Right} id="r" className="custom-handle" style={{ pointerEvents: 'all' }} />
      <Handle type="source" position={Position.Bottom} id="b" className="custom-handle" style={{ pointerEvents: 'all' }} />
      <Handle type="source" position={Position.Left} id="l" className="custom-handle" style={{ pointerEvents: 'all' }} />
    </>
  );
};

export default memo(SubgraphNode);
