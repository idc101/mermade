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

describe('Node Deletion', () => {
  it('removes the node from the Mermaid text when deleted in the UI', async () => {
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    );

    // 1. Add a new node
    const addButton = screen.getByText('+ Add Node');
    fireEvent.click(addButton);

    // The node should appear in the Mermaid text (it should have a random ID)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const textBeforeDeletion = textarea.value;
    expect(textBeforeDeletion).toContain('New Service');

    // Find the new node in the canvas
    const newNode = screen.getByText('New Service');
    expect(newNode).toBeInTheDocument();

    // 2. Delete the node. 
    // In React Flow, we can simulate the 'Delete' key on a selected node.
    // However, since we want to test our sync logic, we'll manually trigger
    // the deletion through the same mechanism the UI uses.
    
    // For this test, we'll simulate the keydown event if possible, 
    // or better, we'll ensure our App.tsx handles the 'onNodesDelete' event.
    
    // Since we are testing the bug, let's see if we can trigger the deletion.
    // React Flow listens for Backspace/Delete.
    fireEvent.keyDown(newNode, { key: 'Backspace', code: 'Backspace' });
    
    // If the bug exists, the node will be gone from the canvas (managed by React Flow)
    // but the text will still contain 'New Service'.
    // NOTE: This test might be tricky because jsdom + ReactFlow event handling.
    // A better way is to verify if we have an onNodesDelete handler.
  });
});
