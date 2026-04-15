import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import * as Icons from 'lucide-react';

const CustomNode = ({ data, selected }: NodeProps) => {
  const Icon = (Icons as any)[data.icon] || Icons.Square;

  return (
    <div
      className={`custom-node px-4 py-2 shadow-md rounded-md border-2 transition-all ${
        selected ? 'border-blue-500 scale-105' : 'border-gray-200'
      }`}
      style={{
        backgroundColor: data.color || '#ffffff',
        minWidth: '150px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
      }}
    >
      {/* 4 Handles for Floating Edges - Visible on hover with a plus sign */}
      <Handle 
        type="source" 
        position={Position.Top} 
        id="t" 
        className="custom-handle"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="r" 
        className="custom-handle"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="b" 
        className="custom-handle"
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="l" 
        className="custom-handle"
      />
      
      <Icon size={18} />
      <div className="font-bold text-sm text-black">{data.label}</div>
    </div>
  );
};

export default memo(CustomNode);
