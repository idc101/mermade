import type { Node, Edge } from 'reactflow';
import type { CustomNodeData, SubgraphNodeData, VisualConfig } from '../types';
import { CONFIG_DELIMITER } from '../constants';

export function syncVisualConfigToText(
  nodes: Node<CustomNodeData | SubgraphNodeData>[],
  edges: Edge[],
  oldText: string,
  baselineNodes: Node[] = [],
  baselineEdges: Edge[] = []
): string {
  const parts = oldText.split(CONFIG_DELIMITER);
  const semanticPart = parts[0].trim();

  // Find icons already defined in semantic part
  const iconRegex = /<icon\s+icon=["']([^"']+)["']\s*\/>/g;
  const semanticIcons = new Set<string>();
  let match;
  while ((match = iconRegex.exec(semanticPart)) !== null) {
    // This is a bit naive as it doesn't associate with node ID easily here
    // but we can check if the node's current icon is in the semantic text for that specific node
  }

  const config: VisualConfig = {
    nodes: {},
    edges: {},
  };

  nodes.forEach((node) => {
    const baseline = baselineNodes.find((bn) => bn.id === node.id);
    const nodeConfig: any = {};
    
    const x = Math.round(node.position.x);
    const y = Math.round(node.position.y);
    const bx = baseline ? Math.round(baseline.position.x) : undefined;
    const by = baseline ? Math.round(baseline.position.y) : undefined;

    // Only store position if it differs from baseline
    if (bx === undefined || by === undefined || Math.abs(x - bx) > 1 || Math.abs(y - by) > 1) {
      nodeConfig.x = x;
      nodeConfig.y = y;
    }

    const width = node.style?.width ? Number(node.style.width) : undefined;
    const height = node.style?.height ? Number(node.style.height) : undefined;
    const bWidth = baseline?.style?.width ? Number(baseline.style.width) : undefined;
    const bHeight = baseline?.style?.height ? Number(baseline.style.height) : undefined;

    if (width !== undefined && width !== bWidth) nodeConfig.width = width;
    if (height !== undefined && height !== bHeight) nodeConfig.height = height;
    
    if (node.data.color) {
      const bColor = baseline?.data.color;
      if (node.data.color !== bColor) {
        nodeConfig.color = node.data.color;
      }
    }

    if ('icon' in node.data && node.data.icon) {
      // Check if icon is already in semantic text for this node
      const nodeDefRegex = new RegExp(`${node.id}\\[.*?<icon\\s+icon=["']${node.data.icon}["']\\s*\\/>`);
      if (!nodeDefRegex.test(semanticPart)) {
        nodeConfig.icon = node.data.icon;
      }
    }

    if (Object.keys(nodeConfig).length > 0) {
      config.nodes[node.id] = nodeConfig;
    }
  });

  edges.forEach((edge, index) => {
    const edgeId = edge.id || `${edge.source}-${edge.target}-${index}`;
    const baseline = baselineEdges.find((be) => be.id === edgeId) || 
                     baselineEdges.find((be) => be.source === edge.source && be.target === edge.target);
    
    const edgeConfig: any = {};
    
    if (edge.style?.stroke) {
      const bStroke = baseline?.style?.stroke;
      if (edge.style.stroke !== bStroke) {
        edgeConfig.stroke = edge.style.stroke as string;
      }
    }
    
    if (edge.animated !== undefined) {
      const bAnimated = baseline?.animated;
      if (edge.animated !== bAnimated && edge.animated !== false) {
        edgeConfig.animated = edge.animated;
      }
    }

    if (Object.keys(edgeConfig).length > 0) {
      config.edges[edgeId] = edgeConfig;
    }
  });

  // If config is empty, don't even add the delimiter and config block
  if (Object.keys(config.nodes).length === 0 && Object.keys(config.edges).length === 0) {
    return semanticPart;
  }

  return `${semanticPart}\n\n${CONFIG_DELIMITER}\n${JSON.stringify(config, null, 2)}`;
}

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

/**
 * Fallback: Complete regeneration of Mermaid text if reconciliation is too complex
 */
export function buildMermaidText(
  nodes: Node<CustomNodeData | SubgraphNodeData>[],
  edges: Edge[],
  oldText: string,
  baselineNodes: Node[] = [],
  baselineEdges: Edge[] = []
): string {
  const parts = oldText.split(CONFIG_DELIMITER);
  const semanticPart = parts[0];
  const mermaidLines = semanticPart.trim().split('\n');
  
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
  return syncVisualConfigToText(nodes, edges, semanticText, baselineNodes, baselineEdges);
}
