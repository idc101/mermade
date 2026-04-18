interface ToolbarProps {
  onAddNode: () => void;
  onAddSubgraph: () => void;
  onAutoLayout: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
}

export function Toolbar({
  onAddNode,
  onAddSubgraph,
  onAutoLayout,
  onExportPng,
  onExportSvg,
}: ToolbarProps) {
  const buttonStyle: React.CSSProperties = { 
    padding: '4px 8px', 
    cursor: 'pointer', 
    fontSize: '12px' 
  };
  
  const secondaryButtonStyle: React.CSSProperties = { 
    ...buttonStyle, 
    backgroundColor: '#e2e8f0', 
    border: '1px solid #cbd5e1', 
    borderRadius: '4px' 
  };

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      <button onClick={onAddNode} style={buttonStyle}>
        + Node
      </button>
      <button onClick={onAddSubgraph} style={buttonStyle}>
        + Subgraph
      </button>
      <button onClick={onAutoLayout} style={secondaryButtonStyle}>
        Auto Layout
      </button>
      <button onClick={onExportPng} style={secondaryButtonStyle}>
        PNG
      </button>
      <button onClick={onExportSvg} style={secondaryButtonStyle}>
        SVG
      </button>
    </div>
  );
}
