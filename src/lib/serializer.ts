import type { Node, Edge } from 'reactflow';
import type { CustomNodeData, SubgraphNodeData, VisualConfig } from '../types';
import { CONFIG_DELIMITER } from '../constants';

function getNodeDef(n: Node<CustomNodeData | SubgraphNodeData>) {
  const iconTag = 'icon' in n.data && n.data.icon ? `<icon icon="${n.data.icon}" /> ` : '';
  const label = n.data.label || n.id;
  const fullLabel = `${iconTag}${label}`.trim();
  
  let leftBracket = '[';
  let rightBracket = ']';
  
  if ('shape' in n.data) {
    if (n.data.shape === 'database') {
      leftBracket = '[(';
      rightBracket = ')]';
    } else if (n.data.shape === 'diamond') {
      leftBracket = '{';
      rightBracket = '}';
    }
  }
  
  return `${n.id}${leftBracket}${fullLabel}${rightBracket}`;
}

export function buildMermaidText(
  nodes: Node<CustomNodeData | SubgraphNodeData>[],
  edges: Edge[],
  oldText: string
): string {
  const parts = oldText.split(CONFIG_DELIMITER);
  const semanticPart = parts[0];
  const mermaidLines = semanticPart.trim().split('\n');
  
  // Extract header (e.g. graph TD or flowchart TD)
  const header = (mermaidLines[0]?.trim().startsWith('graph') || mermaidLines[0]?.trim().startsWith('flowchart'))
    ? mermaidLines[0].trim()
    : 'flowchart TD';

  const subgraphs = nodes.filter(n => n.type === 'subgraphNode');
  const rootNodes = nodes.filter(n => !n.parentNode && n.type !== 'subgraphNode');

  const subgraphDefs = subgraphs.map(sg => {
    const children = nodes.filter(n => n.parentNode === sg.id);
    const childDefs = children.map(n => `    ${getNodeDef(n).trim()}`).join('\n');
    return `  subgraph ${sg.id} ["${sg.data.label}"]\n${childDefs}\n  end`;
  }).join('\n');
  
  const rootNodeDefs = rootNodes.map(n => `  ${getNodeDef(n)}`).join('\n');
  const edgeDefs = edges.map(e => `  ${e.source} -->${e.label ? `|${e.label}|` : ''} ${e.target}`).join('\n');
  
  const sections = [header];
  if (subgraphDefs) sections.push(subgraphDefs);
  if (rootNodeDefs) sections.push(rootNodeDefs);
  if (edgeDefs) sections.push(edgeDefs);

  const semanticText = sections.join('\n\n');

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

  return `${semanticText.trim()}\n\n${CONFIG_DELIMITER}\n${JSON.stringify(config, null, 2)}`;
}
