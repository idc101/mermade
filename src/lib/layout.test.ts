import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from './layout';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

describe('getLayoutedElements', () => {
  it('should layout basic nodes vertically by default', async () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'A' } },
      { id: 'B', position: { x: 0, y: 0 }, data: { label: 'B' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
    ];
    
    const { nodes: layoutedNodes } = await getLayoutedElements(nodes, edges);
    
    const nodeA = layoutedNodes.find(n => n.id === 'A')!;
    const nodeB = layoutedNodes.find(n => n.id === 'B')!;
    
    expect(nodeA.sourcePosition).toBe(Position.Bottom);
    expect(nodeB.targetPosition).toBe(Position.Top);
    
    // In vertical layout, B should be below A
    expect(nodeB.position.y).toBeGreaterThan(nodeA.position.y);
  });

  it('should layout nodes horizontally when requested', async () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'A' } },
      { id: 'B', position: { x: 0, y: 0 }, data: { label: 'B' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
    ];
    
    const { nodes: layoutedNodes } = await getLayoutedElements(nodes, edges, 'RIGHT');
    
    const nodeA = layoutedNodes.find(n => n.id === 'A')!;
    const nodeB = layoutedNodes.find(n => n.id === 'B')!;
    
    expect(nodeA.sourcePosition).toBe(Position.Right);
    expect(nodeB.targetPosition).toBe(Position.Left);
    
    // In horizontal layout, B should be to the right of A
    expect(nodeB.position.x).toBeGreaterThan(nodeA.position.x);
  });

  it('should handle subgraph relative positioning', async () => {
    const nodes: Node[] = [
      { id: 'SG1', type: 'subgraphNode', position: { x: 0, y: 0 }, data: { label: 'SG' } },
      { id: 'A', parentNode: 'SG1', position: { x: 0, y: 0 }, data: { label: 'A' } },
    ];
    
    const { nodes: layoutedNodes } = await getLayoutedElements(nodes, []);
    
    const sgNode = layoutedNodes.find(n => n.id === 'SG1')!;
    const nodeA = layoutedNodes.find(n => n.id === 'A')!;
    
    // Child position should be relative to parent
    // The current layout logic uses a padding (40, 60)
    expect(nodeA.position.x).toBeGreaterThanOrEqual(0);
    expect(nodeA.position.y).toBeGreaterThanOrEqual(0);
    
    // The subgraph should be sized to fit its children
    expect(Number(sgNode.style?.width)).toBeGreaterThan(0);
    expect(Number(sgNode.style?.height)).toBeGreaterThan(0);
  });
});
