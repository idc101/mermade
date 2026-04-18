import { parse } from 'mermaid-ast';
import type { Node, Edge } from 'reactflow';
import type { 
  MermaidAST, 
  CustomNodeData, 
  SubgraphNodeData,
  VisualConfig,
  DiagramData 
} from '../types';
import { CONFIG_DELIMITER } from '../constants';

export { type VisualConfig, type DiagramData };

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
  let success = false;

  // Pre-process mermaidText to handle <icon /> tags
  const iconRegex = /<icon\s+icon=["']([^"']+)["']\s*\/>/g;
  const strippedMermaidText = mermaidText.replace(iconRegex, '');

  try {
    const ast = parse(strippedMermaidText) as unknown as MermaidAST;
    const astNodes = ast.nodes;
    const astSubgraphs = ast.subgraphs;
    
    // If we have nodes or subgraphs, consider it a success
    if ((astNodes && astNodes.size > 0) || (astSubgraphs && astSubgraphs.length > 0)) {
      success = true;
    }

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
          },
          zIndex: 1,
        };
        nodes.push(subgraphNode);
      });
    }

    if (astNodes) {
        astNodes.forEach((astNode, id) => {
          const visual = config.nodes[id] || {};
          const label = astNode.text?.text || id;
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
            style: visual.width ? { width: visual.width, height: visual.height } : undefined,
            zIndex: 10,
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
        astLinks.forEach((link, index) => {
          const edgeId = `${link.source}-${link.target}-${index}`;
          const visual = config.edges[edgeId] || config.edges[`${link.source}-${link.target}`] || {};
          
          edges.push({
            id: edgeId,
            source: link.source,
            target: link.target,
            label: link.text?.text || '',
            animated: visual.animated ?? false,
            style: visual.stroke ? { stroke: visual.stroke } : undefined,
            zIndex: 1000,
          });
        });
    }

  } catch (e) {
    console.error('Failed to parse mermaid text:', e);
  }

  return { nodes, edges, mermaidText, config, success };
}

export function clearConfig(text: string): string {
  return text.split(CONFIG_DELIMITER)[0].trim();
}
