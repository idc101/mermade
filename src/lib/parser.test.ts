import { describe, it, expect } from 'vitest';
import { parseMermaid } from './parser';

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

  it('should parse nested subgraphs', () => {
    const mermaid = `
flowchart TD
  subgraph SG1
    subgraph SG2
      A
    end
  end
`;
    const result = parseMermaid(mermaid);
    
    expect(result.success).toBe(true);
    // Nodes: A, SG1, SG2
    expect(result.nodes).toHaveLength(3);
    
    const sg1 = result.nodes.find(n => n.id === 'SG1');
    const sg2 = result.nodes.find(n => n.id === 'SG2');
    const nodeA = result.nodes.find(n => n.id === 'A');
    
    expect(sg1).toBeDefined();
    expect(sg2).toBeDefined();
    expect(nodeA).toBeDefined();
    
    expect(sg2?.parentNode).toBe('SG1');
    expect(nodeA?.parentNode).toBe('SG2');
  });

  it('should parse visual config in YAML frontmatter', () => {
    const mermaid = `---
mermade:
  nodes:
    A:
      x: 300
      y: 400
      color: blue
---
graph TD
  A --> B
`;
    const result = parseMermaid(mermaid);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.position).toEqual({ x: 300, y: 400 });
    expect(nodeA?.data.color).toBe('blue');
    expect(result.mermaidText).toBe('graph TD\n  A --> B');
  });

  it('should parse visual config in YAML frontmatter under config key', () => {
    const mermaid = `---
config:
  mermade:
    nodes:
      A:
        x: 500
        y: 600
---
graph TD
  A --> B
`;
    const result = parseMermaid(mermaid);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.position).toEqual({ x: 500, y: 600 });
  });

  it('should strip icon syntax from labels', () => {
    const mermaid = `
graph TD
  A[Node A fa:user]
  B[Node B icon:server]
`;
    const result = parseMermaid(mermaid);
    
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA?.data.label).toBe('Node A');
    expect(nodeA?.data.icon).toBe('fa:user');

    const nodeB = result.nodes.find(n => n.id === 'B');
    expect(nodeB?.data.label).toBe('Node B');
    expect(nodeB?.data.icon).toBe('server');
  });

  it('should handle invalid mermaid text gracefully', () => {
    const mermaid = `invalid mermaid text`;
    const result = parseMermaid(mermaid);
    
    expect(result.success).toBe(false);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
