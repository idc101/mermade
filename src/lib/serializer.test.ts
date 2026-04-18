import { describe, it, expect } from 'vitest';
import { buildMermaidText } from './serializer';
import { CONFIG_DELIMITER } from '../constants';
import type { Node, Edge } from 'reactflow';
import type { CustomNodeData, SubgraphNodeData } from '../types';

describe('buildMermaidText', () => {
  it('should serialize basic nodes and edges', () => {
    const nodes: Node<CustomNodeData>[] = [
      { id: 'A', position: { x: 10, y: 20 }, data: { label: 'Node A' }, type: 'customNode' },
      { id: 'B', position: { x: 100, y: 200 }, data: { label: 'Node B' }, type: 'customNode' },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B', label: 'to' },
    ];
    const oldText = 'graph TD';
    
    const result = buildMermaidText(nodes, edges, oldText);
    
    expect(result).toContain('graph TD');
    expect(result).toContain('A[Node A]');
    expect(result).toContain('B[Node B]');
    expect(result).toContain('A -->|to| B');
    expect(result).toContain(CONFIG_DELIMITER);
    
    const configPart = result.split(CONFIG_DELIMITER)[1].trim();
    const config = JSON.parse(configPart);
    expect(config.nodes.A).toEqual(expect.objectContaining({ x: 10, y: 20 }));
    expect(config.nodes.B).toEqual(expect.objectContaining({ x: 100, y: 200 }));
  });

  it('should serialize nodes with icons', () => {
    const nodes: Node<CustomNodeData>[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'User', icon: 'mdi:user' }, type: 'customNode' },
    ];
    const result = buildMermaidText(nodes, [], '');
    
    expect(result).toContain('A[<icon icon="mdi:user" /> User]');
  });

  it('should serialize different node shapes', () => {
    const nodes: Node<CustomNodeData>[] = [
      { id: 'D1', position: { x: 0, y: 0 }, data: { label: 'DB', shape: 'database' }, type: 'customNode' },
      { id: 'DI1', position: { x: 0, y: 0 }, data: { label: 'Decision', shape: 'diamond' }, type: 'customNode' },
    ];
    const result = buildMermaidText(nodes, [], '');
    
    expect(result).toContain('D1[(DB)]');
    expect(result).toContain('DI1{Decision}');
  });

  it('should serialize subgraphs', () => {
    const nodes: (Node<CustomNodeData> | Node<SubgraphNodeData>)[] = [
      { id: 'SG1', position: { x: 0, y: 0 }, data: { label: 'Group' }, type: 'subgraphNode' },
      { id: 'A', position: { x: 10, y: 10 }, data: { label: 'Inside' }, type: 'customNode', parentNode: 'SG1' },
    ];
    const result = buildMermaidText(nodes as any, [], '');
    
    expect(result).toContain('subgraph SG1 ["Group"]');
    expect(result).toContain('A[Inside]');
    expect(result).toContain('end');
  });

  it('should include visual properties in config', () => {
    const nodes: Node<CustomNodeData>[] = [
      { 
        id: 'A', 
        position: { x: 10.5, y: 20.7 }, 
        data: { label: 'A', color: 'blue' }, 
        type: 'customNode',
        style: { width: 150, height: 80 }
      },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B', animated: true, style: { stroke: 'red' } }
    ];
    
    const result = buildMermaidText(nodes, edges, '');
    const config = JSON.parse(result.split(CONFIG_DELIMITER)[1].trim());
    
    expect(config.nodes.A.x).toBe(11); // Rounded
    expect(config.nodes.A.y).toBe(21); // Rounded
    expect(config.nodes.A.color).toBe('blue');
    expect(config.nodes.A.width).toBe(150);
    
    // The serializer generates a specific ID format for edges if not provided correctly
    const edgeKey = Object.keys(config.edges)[0];
    expect(config.edges[edgeKey].animated).toBe(true);
    expect(config.edges[edgeKey].stroke).toBe('red');
  });
});
