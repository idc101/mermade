import { Toolbar } from './Toolbar';

interface EditorPaneProps {
  text: string;
  onTextChange: (text: string) => void;
  onAddNode: () => void;
  onAddSubgraph: () => void;
  onAutoLayout: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
}

export function EditorPane({
  text,
  onTextChange,
  onAddNode,
  onAddSubgraph,
  onAutoLayout,
  onExportPng,
  onExportSvg,
}: EditorPaneProps) {
  return (
    <div style={{ width: '400px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Mermaid Editor</span>
        <Toolbar 
          onAddNode={onAddNode}
          onAddSubgraph={onAddSubgraph}
          onAutoLayout={onAutoLayout}
          onExportPng={onExportPng}
          onExportSvg={onExportSvg}
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        style={{
          flex: 1,
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: 'black',
        }}
      />
    </div>
  );
}
