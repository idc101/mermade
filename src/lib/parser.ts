import { parse } from 'mermaid-ast';
import type { Node, Edge } from 'reactflow';
import type { 
  MermaidAST, 
  CustomNodeData, 
  SubgraphNodeData,
  VisualConfig,
  DiagramData 
} from '../types';

export { type VisualConfig, type DiagramData };

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

  const nodes: Node<CustomNodeData | SubgraphNodeData>[] = [];
  const edges: Edge[] = [];

  // Pre-process mermaidText to handle <icon /> tags
  const iconRegex = /<icon\s+icon=["']([^"']+)["']\s*\/>/g;
  const strippedMermaidText = mermaidText.replace(iconRegex, '');

  try {
    const ast = parse(strippedMermaidText) as unknown as MermaidAST;
    const astNodes = ast.nodes;
    const astSubgraphs = ast.subgraphs;

    if (astSubgraphs) {
      astSubgraphs.forEach((sg) => {
        const sgId = sg.id;
        const visual = config.nodes[sgId] || {};
        
        const subgraphNode: Node<SubgraphNodeData> = {
          id: sgId,
          type: 'subgraphNode',
          data: { 
            label: sg.title?.text || sgId,
            color: visual.color
          },
          position: { x: visual.x ?? 0, y: visual.y ?? 0 },
          style: { 
            width: visual.width ?? 200, 
            height: visual.height ?? 150 
          }
        };
        nodes.push(subgraphNode);
      });
    }

    if (astNodes) {
        astNodes.forEach((astNode, id) => {
          const visual = config.nodes[id] || {};
          let label = astNode.text?.text || id;
          let icon = visual.icon;

          if (!icon) {
            const nodeLineRegex = new RegExp(`${id}\\[.*?<icon\\s+icon=["']([^"']+)["']\\s*\\/>`);
            const match = mermaidText.match(nodeLineRegex);
            if (match) {
              icon = match[1];
            }
          }

          const node: Node<CustomNodeData> = {
            id,
            type: 'customNode',
            data: { 
                label: label.trim(), 
                icon, 
                color: visual.color,
                shape: astNode.shape
            },
            position: { x: visual.x ?? 0, y: visual.y ?? 0 },
            style: visual.width ? { width: visual.width, height: visual.height } : undefined
          };
          
          if (astSubgraphs) {
            const parentSg = astSubgraphs.find(sg => sg.nodes?.includes(id));
            if (parentSg) {
              node.parentNode = parentSg.id;
              node.extent = 'parent';
            }
          }

          nodes.push(node);
        });
    }

    const astLinks = ast.links;
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
    console.error('Failed to parse mermaid text:', e);
  }

  return { nodes, edges, mermaidText, config };
}

export function serializeMermaid(nodes: Node<CustomNodeData | SubgraphNodeData>[], edges: Edge[], originalMermaidText: string): string {
  const config: VisualConfig = {
    nodes: {},
    edges: {},
  };

  nodes.forEach((node) => {
    config.nodes[node.id] = {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      width: node.style?.width ? Number(node.style.width) : undefined,
      height: node.style?.height ? Number(node.style.height) : undefined,
      color: node.data.color,
      icon: 'icon' in node.data ? node.data.icon : undefined,
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
