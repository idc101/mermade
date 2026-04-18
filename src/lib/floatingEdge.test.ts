import { describe, it, expect } from 'vitest';
import { getEdgeParams } from './floatingEdge';
import { Position, internalsSymbol } from 'reactflow';
import type { Node, Edge } from 'reactflow';

describe('getEdgeParams handle distribution', () => {
  const nodeA: Node = {
    id: 'A',
    position: { x: 0, y: 0 },
    positionAbsolute: { x: 0, y: 0 },
    width: 100,
    height: 50,
    data: {},
    [internalsSymbol]: {
      handleBounds: {
        source: [
          { id: 't1', position: Position.Top, x: 25, y: 0, width: 8, height: 8 },
          { id: 't2', position: Position.Top, x: 50, y: 0, width: 8, height: 8 },
          { id: 't3', position: Position.Top, x: 75, y: 0, width: 8, height: 8 },
          { id: 'b1', position: Position.Bottom, x: 25, y: 50, width: 8, height: 8 },
          { id: 'b2', position: Position.Bottom, x: 50, y: 50, width: 8, height: 8 },
          { id: 'b3', position: Position.Bottom, x: 75, y: 50, width: 8, height: 8 },
        ]
      }
    }
  } as any;

  const nodeB: Node = {
    id: 'B',
    position: { x: 0, y: 200 },
    positionAbsolute: { x: 0, y: 200 },
    width: 100,
    height: 50,
    data: {},
  };

  const nodeC: Node = {
    id: 'C',
    position: { x: 0, y: -200 },
    positionAbsolute: { x: 0, y: -200 },
    width: 100,
    height: 50,
    data: {},
  };

  const allNodes = [nodeA, nodeB, nodeC];

  it('should use center handle when only one edge is connected to a node', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' }
    ];
    
    const params = getEdgeParams(nodeA, nodeB, edges, 'e1', allNodes);
    
    expect(params.sourcePos).toBe(Position.Bottom);
    expect(params.sx).toBe(50 + 4); // Center handle
  });

  it('should use center handle for both edges if they are on different sides', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' }, // Bottom
      { id: 'e2', source: 'A', target: 'C' }  // Top
    ];
    
    const params1 = getEdgeParams(nodeA, nodeB, edges, 'e1', allNodes);
    const params2 = getEdgeParams(nodeA, nodeC, edges, 'e2', allNodes);
    
    expect(params1.sourcePos).toBe(Position.Bottom);
    expect(params1.sx).toBe(50 + 4); // Should be center handle (54)
    
    expect(params2.sourcePos).toBe(Position.Top);
    expect(params2.sx).toBe(50 + 4); // Should be center handle (54)
  });

  it('should distribute edges across handles when multiple edges are on the same side', () => {
    // Two edges on the bottom side
    const nodeD: Node = {
        id: 'D',
        position: { x: 50, y: 200 },
        positionAbsolute: { x: 50, y: 200 },
        width: 100,
        height: 50,
        data: {},
    };
    
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' }, // Bottom
      { id: 'e2', source: 'A', target: 'D' }  // Bottom
    ];
    
    const params1 = getEdgeParams(nodeA, nodeB, edges, 'e1', [...allNodes, nodeD]);
    const params2 = getEdgeParams(nodeA, nodeD, edges, 'e2', [...allNodes, nodeD]);
    
    expect(params1.sourcePos).toBe(Position.Bottom);
    expect(params2.sourcePos).toBe(Position.Bottom);
    
    // For 2 edges, we expect them to use index 0 and 2 (left and right handles)
    // index 0: x=25+4=29
    // index 2: x=75+4=79
    const xPositions = [params1.sx, params2.sx].sort();
    expect(xPositions).toEqual([29, 79]);
  });

  it('should pick Bottom for a wide node even if horizontal diff is slightly larger than vertical diff', () => {
    // Wide node at (0,0)
    const wideNode: Node = {
      id: 'WIDE',
      position: { x: 0, y: 0 },
      positionAbsolute: { x: 0, y: 0 },
      width: 300,
      height: 50,
      data: {},
    };
    
    // Target node below but offset horizontally
    const targetNode: Node = {
      id: 'TARGET',
      position: { x: -100, y: 80 },
      positionAbsolute: { x: -100, y: 80 },
      width: 100,
      height: 50,
      data: {},
    };

    // Center WIDE: (150, 25)
    // Center TARGET: (-50, 105)
    // dx = -200, dy = 80
    // Previous logic: Math.abs(dx) > Math.abs(dy) (200 > 80) -> Left
    // Improved logic should account for aspect ratio.

    const edges: Edge[] = [{ id: 'e1', source: 'WIDE', target: 'TARGET' }];
    const params = getEdgeParams(wideNode, targetNode, edges, 'e1', [wideNode, targetNode]);
    
    expect(params.sourcePos).toBe(Position.Bottom);
  });
});
