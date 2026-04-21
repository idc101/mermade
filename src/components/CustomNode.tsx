import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';
import type { CustomNodeData } from '../types';

const isValidLucideIcon = (iconName: string): iconName is keyof typeof LucideIcons => {
  return iconName in LucideIcons;
};

const CustomNode = ({ data, selected, style }: NodeProps<CustomNodeData>) => {
  const isIconify = data.icon && data.icon.includes(':');
  const LucideIcon = data.icon && !isIconify && isValidLucideIcon(data.icon) 
    ? (LucideIcons[data.icon] as React.ElementType) 
    : null;

  return (
    <div
      className={`custom-node rounded-sm ${selected ? 'selected' : ''}`}
      style={{
        ...style,
        position: 'relative',
        backgroundColor: data.color || '#fff2cc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 10px',
      }}
    >
      {/* 12 Handles for Floating Edges (3 on each side) */}
      <Handle type="source" position={Position.Top} id="t1" className="custom-handle" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Top} id="t2" className="custom-handle" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Top} id="t3" className="custom-handle" style={{ left: '75%' }} />

      <Handle type="source" position={Position.Right} id="r1" className="custom-handle" style={{ top: '25%' }} />
      <Handle type="source" position={Position.Right} id="r2" className="custom-handle" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} id="r3" className="custom-handle" style={{ top: '75%' }} />

      <Handle type="source" position={Position.Bottom} id="b1" className="custom-handle" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="b2" className="custom-handle" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="b3" className="custom-handle" style={{ left: '75%' }} />

      <Handle type="source" position={Position.Left} id="l1" className="custom-handle" style={{ top: '25%' }} />
      <Handle type="source" position={Position.Left} id="l2" className="custom-handle" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Left} id="l3" className="custom-handle" style={{ top: '75%' }} />
      
      {data.icon && (
        isIconify ? (
          <IconifyIcon icon={data.icon} width={16} height={16} className="flex-shrink-0" />
        ) : LucideIcon ? (
          <LucideIcon size={16} className="flex-shrink-0" />
        ) : null
      )}
      <div 
        className="text-center font-medium text-sm text-black leading-tight"
        style={{ textAlign: 'center', flexGrow: 0, whiteSpace: 'pre-wrap' }}
      >
        {data.label?.split(/<br\s*\/?>|\\n|\n/g).map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
};

export default memo(CustomNode);
