import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditorPane } from './EditorPane';

describe('EditorPane', () => {
  const defaultProps = {
    text: 'graph TD\n  A',
    onTextChange: vi.fn(),
    onAddNode: vi.fn(),
    onAddSubgraph: vi.fn(),
    onAutoLayout: vi.fn(async () => {}),
    onExportPng: vi.fn(),
    onExportSvg: vi.fn(),
  };

  it('should render the text in the textarea', () => {
    render(<EditorPane {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('graph TD\n  A');
  });

  it('should call onTextChange when typing', () => {
    render(<EditorPane {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'graph TD\n  A --> B' } });
    expect(defaultProps.onTextChange).toHaveBeenCalledWith('graph TD\n  A --> B');
  });

  it('should call toolbar actions when buttons are clicked', () => {
    render(<EditorPane {...defaultProps} />);
    
    fireEvent.click(screen.getByText('+ Node'));
    expect(defaultProps.onAddNode).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('+ Subgraph'));
    expect(defaultProps.onAddSubgraph).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('Auto Layout'));
    expect(defaultProps.onAutoLayout).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('PNG'));
    expect(defaultProps.onExportPng).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText('SVG'));
    expect(defaultProps.onExportSvg).toHaveBeenCalled();
  });
});
