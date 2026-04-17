import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';

const CustomNode = ({ data, selected }: NodeProps) => {
  const isIconify = data.icon && data.icon.includes(':');
  const LucideIcon = !isIconify ? ((LucideIcons as any)[data.icon] || LucideIcons.Square) : null;

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
      
      {isIconify ? (
        <IconifyIcon icon={data.icon} width={18} height={18} />
      ) : (
        <LucideIcon size={18} />
      )}
      <div className="font-bold text-sm text-black">{data.label}</div>
    </div>
  );
};

export default memo(CustomNode);
