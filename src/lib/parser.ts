import { parse } from 'mermaid-ast';
import type { Node, Edge } from 'reactflow';

export interface VisualConfig {
  nodes: Record<string, { x: number; y: number; color?: string; icon?: string }>;
  edges: Record<string, { stroke?: string; animated?: boolean }>;
}

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  mermaidText: string;
  config: VisualConfig;
}

const CONFIG_DELIMITER = '%% --- arrows-config --- %%';

export function parseMermaid(text: string): DiagramData {
  const parts = text.split(CONFIG_DELIMITER);
  const mermaidText = parts[0].trim();
  let config: VisualConfig = { nodes: {}, edges: {} };

  if (parts.length > 1) {
    try {
      config = JSON.parse(parts[1].trim());
    } catch (e) {
      console.error('Failed to parse config:', e);
    }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  try {
    const ast = parse(mermaidText) as any;
    
    // Extract nodes from Map
    const astNodes = ast.nodes as Map<string, any>;
    if (astNodes) {
        astNodes.forEach((astNode, id) => {
          const visual = config.nodes[id] || {};
          nodes.push({
            id,
            type: 'customNode',
            data: { 
                label: astNode.text?.text || id, 
                icon: visual.icon, 
                color: visual.color,
                shape: astNode.shape
            },
            position: { x: visual.x ?? 0, y: visual.y ?? 0 },
          });
        });
    }

    // Extract edges (links)
    const astLinks = ast.links as any[];
    if (astLinks) {
        astLinks.forEach((link) => {
          const edgeId = `${link.source}-${link.target}`;
          const visual = config.edges[edgeId] || {};
          
          edges.push({
            id: edgeId,
            source: link.source,
            target: link.target,
            label: link.text?.text || '',
            animated: visual.animated ?? false,
            style: visual.stroke ? { stroke: visual.stroke } : undefined,
          });
        });
    }

  } catch (e) {
    console.error('Failed to parse mermaid text with mermaid-ast:', e);
  }

  return { nodes, edges, mermaidText, config };
}

export function serializeMermaid(nodes: Node[], edges: Edge[], originalMermaidText: string): string {
  const config: VisualConfig = {
    nodes: {},
    edges: {},
  };

  nodes.forEach((node) => {
    config.nodes[node.id] = {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      color: node.data.color,
      icon: node.data.icon,
    };
  });

  edges.forEach((edge) => {
    config.edges[edge.id] = {
      stroke: edge.style?.stroke as string,
      animated: edge.animated,
    };
  });

  return `${originalMermaidText.trim()}\n\n${CONFIG_DELIMITER}\n${JSON.stringify(config, null, 2)}`;
}
