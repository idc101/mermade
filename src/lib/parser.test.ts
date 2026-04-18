import { describe, it, expect } from 'vitest';
import { parseMermaid } from './parser';
import { CONFIG_DELIMITER } from '../constants';

describe('parseMermaid', () => {
  it('should parse basic nodes and edges', () => {
    const mermaid = `
graph TD
  A --> B
`;
    const result = parseMermaid(mermaid);
    
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    
    const nodeIds = result.nodes.map(n => n.id);
    expect(nodeIds).toContain('A');
    expect(nodeIds).toContain('B');
    
    expect(result.edges[0].source).toBe('A');
    expect(result.edges[0].target).toBe('B');
  });

  it('should parse nodes with labels and shapes', () => {
    const mermaid = `
graph TD
  A[Node A]
  B(Node B)
  C{Node C}
`;
    const result = parseMermaid(mermaid);
    
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(3);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.data.label).toBe('Node A');
    
    const nodeB = result.nodes.find(n => n.id === 'B');
    expect(nodeB?.data.label).toBe('Node B');
    
    const nodeC = result.nodes.find(n => n.id === 'C');
    expect(nodeC?.data.label).toBe('Node C');
  });

  it('should parse edges with labels', () => {
    const mermaid = `
graph TD
  A -- label --> B
`;
    const result = parseMermaid(mermaid);
    
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].label).toBe('label');
  });

  it('should parse subgraphs', () => {
    const mermaid = `
graph TD
  subgraph SG1
    A
  end
`;
    const result = parseMermaid(mermaid);
    
    // Nodes: A and SG1 (as a subgraph node)
    expect(result.success).toBe(true);
    expect(result.nodes).toHaveLength(2);
    
    const sgNode = result.nodes.find(n => n.type === 'subgraphNode');
    expect(sgNode).toBeDefined();
    expect(sgNode?.id).toBe('SG1');
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.parentNode).toBe('SG1');
  });

  it('should parse visual config after delimiter', () => {
    const mermaid = `
graph TD
  A --> B
${CONFIG_DELIMITER}
{
  "nodes": {
    "A": { "x": 100, "y": 200, "color": "red" }
  }
}
`;
    const result = parseMermaid(mermaid);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.position).toEqual({ x: 100, y: 200 });
    expect(nodeA?.data.color).toBe('red');
  });

  it('should strip <icon /> tags from labels', () => {
    const mermaid = `
graph TD
  A[Node A <icon icon="mdi:user" />]
`;
    const result = parseMermaid(mermaid);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.data.label).toBe('Node A');
    // The parser extracts icons from the full mermaidText if not in config
    expect(nodeA?.data.icon).toBe('mdi:user');
  });

  it('should handle invalid mermaid text gracefully', () => {
    const mermaid = `invalid mermaid text`;
    const result = parseMermaid(mermaid);
    
    expect(result.success).toBe(false);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
