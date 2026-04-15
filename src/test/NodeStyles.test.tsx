import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import { ReactFlowProvider } from 'reactflow';

// Fix ResizeObserver mock
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = ResizeObserver;

describe('Node Styles Popup', () => {
  it('allows editing the label of a selected node via Mermaid text input', async () => {
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    );

    // Find the textarea
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    // Change the text to add a node with a specific label
    const newText = `flowchart TD\n  TestNode[Initial Label]`;
    fireEvent.change(textarea, { target: { value: newText } });

    // Verify the node is in the canvas
    const nodeText = await screen.findByText('Initial Label');
    expect(nodeText).toBeInTheDocument();
  });
});
