import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';
import type { CustomNodeData } from '../types';

const isValidLucideIcon = (iconName: string): iconName is keyof typeof LucideIcons => {
  return iconName in LucideIcons;
};

const CustomNode = ({ data, selected }: NodeProps<CustomNodeData>) => {
  const isIconify = data.icon && data.icon.includes(':');
  const LucideIcon = data.icon && !isIconify && isValidLucideIcon(data.icon) 
    ? (LucideIcons[data.icon] as React.ElementType) 
    : null;

  return (
    <div
      className={`custom-node px-4 py-3 rounded-sm flex items-center justify-center gap-2 ${
        selected ? 'selected' : ''
      }`}
      style={{
        minWidth: '120px',
        position: 'relative',
      }}
    >
      {/* 4 Handles for Floating Edges */}
      <Handle type="source" position={Position.Top} id="t" className="custom-handle" />
      <Handle type="source" position={Position.Right} id="r" className="custom-handle" />
      <Handle type="source" position={Position.Bottom} id="b" className="custom-handle" />
      <Handle type="source" position={Position.Left} id="l" className="custom-handle" />
      
      {data.icon && (
        isIconify ? (
          <IconifyIcon icon={data.icon} width={16} height={16} />
        ) : LucideIcon ? (
          <LucideIcon size={16} />
        ) : null
      )}
      <div className="text-center font-medium text-sm text-black leading-tight">
        {data.label}
      </div>
    </div>
  );
};

export default memo(CustomNode);
