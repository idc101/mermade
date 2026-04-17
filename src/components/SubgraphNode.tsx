import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const SubgraphNode = ({ data }: NodeProps) => {
  return (
    <div
      className="subgraph-node border-2 border-dashed border-gray-400 rounded-lg p-4"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: data.color || 'rgba(240, 240, 240, 0.5)',
        minWidth: '50px',
        minHeight: '50px',
      }}
    >
      <div 
        className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2"
      >
        {data.label}
      </div>
      {/* 4 Handles for Floating Edges - Visible on hover with a plus sign */}
      <Handle 
        type="source" 
        position={Position.Top} 
        id="t" 
        className="custom-handle"
        style={{ pointerEvents: 'all' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="r" 
        className="custom-handle"
        style={{ pointerEvents: 'all' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="b" 
        className="custom-handle"
        style={{ pointerEvents: 'all' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="l" 
        className="custom-handle"
        style={{ pointerEvents: 'all' }}
      />
    </div>
  );
};

export default memo(SubgraphNode);
