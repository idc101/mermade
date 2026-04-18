export interface MermaidASTText {
  text: string;
}

export interface MermaidASTNode {
  id: string;
  text?: MermaidASTText;
  shape?: string;
}

export interface MermaidASTSubgraph {
  id: string;
  title?: MermaidASTText;
  nodes?: string[];
}

export interface MermaidASTLink {
  source: string;
  target: string;
  text?: MermaidASTText;
}

export interface MermaidAST {
  nodes: Map<string, MermaidASTNode>;
  subgraphs: MermaidASTSubgraph[];
  links: MermaidASTLink[];
}

export interface CustomNodeData {
  label: string;
  icon?: string;
  color?: string;
  shape?: string;
}

export interface SubgraphNodeData {
  label: string;
  color?: string;
}

export interface VisualConfig {
  nodes: Record<string, { x: number; y: number; width?: number; height?: number; color?: string; icon?: string }>;
  edges: Record<string, { stroke?: string; animated?: boolean }>;
}

import type { Node, Edge } from 'reactflow';

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  mermaidText: string;
  config: VisualConfig;
}
