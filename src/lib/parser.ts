import { parse } from 'mermaid-ast';
import yaml from 'js-yaml';
import type { Node, Edge } from 'reactflow';
import type { 
  MermaidAST, 
  CustomNodeData, 
  SubgraphNodeData,
  VisualConfig,
  DiagramData 
} from '../types';

export { type VisualConfig, type DiagramData };

export function parseMermaid(text: string): DiagramData {
  let config: VisualConfig = { nodes: {}, edges: {} };
  let mermaidText = text.trim();
  let success = false;

  // 1. Try YAML frontmatter
  const frontmatterMatch = mermaidText.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (frontmatterMatch) {
    try {
      const frontmatter = yaml.load(frontmatterMatch[1]) as any;
      if (frontmatter && frontmatter.mermade) {
        config = frontmatter.mermade;
      } else if (frontmatter && frontmatter.config && frontmatter.config.mermade) {
        config = frontmatter.config.mermade;
      }
      mermaidText = frontmatterMatch[2].trim();
    } catch (e) {
      console.error('Failed to parse YAML frontmatter:', e);
    }
  }

  const nodes: Node<CustomNodeData | SubgraphNodeData>[] = [];
  const edges: Edge[] = [];

  // Pre-process mermaidText to handle icons (fa:xyz or icon:ssss)
  // We strip them so mermaid-ast doesn't choke on them if they are in labels
  const iconRegex = /\b(fa|icon):[a-zA-Z0-9_-]+/g;
  const strippedMermaidText = mermaidText.replace(iconRegex, '');

  try {
    const ast = parse(strippedMermaidText) as unknown as MermaidAST;
    const astNodes = ast.nodes;
    const astSubgraphs = ast.subgraphs;
    
    // If we have nodes or subgraphs, consider it a success
    if ((astNodes && astNodes.size > 0) || (astSubgraphs && astSubgraphs.length > 0)) {
      success = true;
    }

    const parentMap = new Map<string, string>();

    // 1. Build the parent map first
    if (astSubgraphs) {
      astSubgraphs.forEach((sg) => {
        if (sg.nodes) {
          sg.nodes.forEach(childId => {
            parentMap.set(childId, sg.id);
          });
        }
      });
    }

    // 2. Create subgraph nodes
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

        const parentId = parentMap.get(sgId);
        if (parentId) {
          subgraphNode.parentNode = parentId;
          subgraphNode.extent = 'parent';
        }

        nodes.push(subgraphNode);
      });
    }

    // 3. Create custom nodes
    if (astNodes) {
        astNodes.forEach((astNode, id) => {
          const visual = config.nodes[id] || {};
          let label = astNode.text?.text || id;
          let icon = visual.icon;

          if (!icon) {
            // Look for icon in the original mermaid text for this node
            const nodeLineRegex = new RegExp(`${id}\\[.*?\\b(fa|icon):([a-zA-Z0-9_-]+)`);
            const match = mermaidText.match(nodeLineRegex);
            if (match) {
              icon = match[1] === 'fa' ? `fa:${match[2]}` : match[2];
            }
          }

          // Clean up the label if the icon syntax was part of it
          label = label.replace(/\b(fa|icon):[a-zA-Z0-9_-]+/g, '').trim();

          const node: Node<CustomNodeData> = {
            id,
            type: 'customNode',
            data: { 
                label: label, 
                icon, 
                color: visual.color,
                shape: astNode.shape
            },
            position: { x: visual.x ?? 0, y: visual.y ?? 0 },
            style: visual.width ? { width: visual.width, height: visual.height } : undefined,
            zIndex: 10,
          };
          
          const parentId = parentMap.get(id);
          if (parentId) {
            node.parentNode = parentId;
            node.extent = 'parent';
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
            data: {
              labelOffset: visual.labelOffset,
              controlPoint: visual.controlPoint
            },
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
  let mermaidText = text.trim();
  const frontmatterMatch = mermaidText.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (frontmatterMatch) {
    mermaidText = frontmatterMatch[2].trim();
  }
  return mermaidText;
}
