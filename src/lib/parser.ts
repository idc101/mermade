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

  // Pre-process mermaidText to handle <icon /> tags which might break mermaid-ast
  const iconRegex = /<icon\s+icon=["']([^"']+)["']\s*\/>/g;
  
  const strippedMermaidText = mermaidText.replace(iconRegex, '');

  try {
    const ast = parse(strippedMermaidText) as any;
    
    // Extract nodes from Map
    const astNodes = ast.nodes as Map<string, any>;
    const nodeMap: Record<string, Node> = {};

    // Extract subgraphs first so they are rendered behind
    const astSubgraphs = ast.subgraphs as any[];
    if (astSubgraphs) {
      astSubgraphs.forEach((sg) => {
        const sgId = sg.id;
        const visual = config.nodes[sgId] || {};
        
        const subgraphNode: Node = {
          id: sgId,
          type: 'subgraphNode',
          data: { 
            label: sg.title?.text || sgId,
            color: visual.color || 'rgba(240, 240, 240, 0.5)'
          },
          position: { x: visual.x ?? 0, y: visual.y ?? 0 },
          style: { width: 200, height: 200 }
        };
        nodes.push(subgraphNode);
      });
    }

    if (astNodes) {
        astNodes.forEach((astNode, id) => {
          const visual = config.nodes[id] || {};
          let label = astNode.text?.text || id;
          let icon = visual.icon;

          // If icon not in config, try to find it in the original text for this node
          if (!icon) {
            const nodeLineRegex = new RegExp(`${id}\\[.*?<icon\\s+icon=["']([^"']+)["']\\s*\\/>`);
            const match = mermaidText.match(nodeLineRegex);
            if (match) {
              icon = match[1];
            }
          }

          const node: Node = {
            id,
            type: 'customNode',
            data: { 
                label: label.trim(), 
                icon, 
                color: visual.color,
                shape: astNode.shape
            },
            position: { x: visual.x ?? 0, y: visual.y ?? 0 },
          };
          
          // Find if node belongs to a subgraph
          if (astSubgraphs) {
            const parentSg = astSubgraphs.find(sg => sg.nodes?.includes(id));
            if (parentSg) {
              node.parentNode = parentSg.id;
              node.extent = 'parent';
            }
          }

          nodes.push(node);
          nodeMap[id] = node;
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

export function clearConfig(text: string): string {
  return text.split(CONFIG_DELIMITER)[0].trim();
}
