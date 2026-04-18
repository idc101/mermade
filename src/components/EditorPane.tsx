import { useRef, useLayoutEffect } from 'react';
import { Toolbar } from './Toolbar';

interface EditorPaneProps {
  text: string;
  onTextChange: (text: string) => void;
  onAddNode: () => void;
  onAddSubgraph: () => void;
  onAutoLayout: () => Promise<void>;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Restore selection after text update
  useLayoutEffect(() => {
    if (textareaRef.current && selectionRef.current) {
      const { start, end } = selectionRef.current;
      // Ensure we don't try to set a selection beyond the new text length
      const newStart = Math.min(start, text.length);
      const newEnd = Math.min(end, text.length);
      textareaRef.current.setSelectionRange(newStart, newEnd);
    }
  }, [text]);

  const handleSelection = () => {
    if (textareaRef.current) {
      selectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

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
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          onTextChange(e.target.value);
          handleSelection();
        }}
        onSelect={handleSelection}
        onKeyUp={handleSelection}
        onClick={handleSelection}
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
