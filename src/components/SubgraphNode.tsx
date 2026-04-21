import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const SubgraphNode = ({ data }: NodeProps) => {
  return (
    <>
      <div 
        className="subgraph-label absolute top-4 left-0 right-0 pointer-events-none text-center font-semibold text-sm text-black uppercase tracking-wider"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {data.label?.split(/<br\s*\/?>|\\n|\n/g).map((line: string, i: number, arr: string[]) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
      
      {/* 12 Handles for Floating Edges (3 on each side) */}
      <Handle type="source" position={Position.Top} id="t1" className="custom-handle" style={{ pointerEvents: 'all', left: '25%' }} />
      <Handle type="source" position={Position.Top} id="t2" className="custom-handle" style={{ pointerEvents: 'all', left: '50%' }} />
      <Handle type="source" position={Position.Top} id="t3" className="custom-handle" style={{ pointerEvents: 'all', left: '75%' }} />

      <Handle type="source" position={Position.Right} id="r1" className="custom-handle" style={{ pointerEvents: 'all', top: '25%' }} />
      <Handle type="source" position={Position.Right} id="r2" className="custom-handle" style={{ pointerEvents: 'all', top: '50%' }} />
      <Handle type="source" position={Position.Right} id="r3" className="custom-handle" style={{ pointerEvents: 'all', top: '75%' }} />

      <Handle type="source" position={Position.Bottom} id="b1" className="custom-handle" style={{ pointerEvents: 'all', left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="b2" className="custom-handle" style={{ pointerEvents: 'all', left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="b3" className="custom-handle" style={{ pointerEvents: 'all', left: '75%' }} />

      <Handle type="source" position={Position.Left} id="l1" className="custom-handle" style={{ pointerEvents: 'all', top: '25%' }} />
      <Handle type="source" position={Position.Left} id="l2" className="custom-handle" style={{ pointerEvents: 'all', top: '50%' }} />
      <Handle type="source" position={Position.Left} id="l3" className="custom-handle" style={{ pointerEvents: 'all', top: '75%' }} />
    </>
  );
};

export default memo(SubgraphNode);
