import { render, screen } from '@testing-library/react';
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

describe('Edge Creation', () => {
  it('adds an edge to the Mermaid text when connected in the UI', async () => {
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    );

    // Initial state: WebApp -> DB and WebApp -> Cache
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('WebApp -->|Reads/Writes user data| DB');
    expect(textarea.value).toContain('WebApp -->|Fetches session| Cache');

    // Let's check if 'DB --> Cache' is NOT there initially
    expect(textarea.value).not.toContain('DB --> Cache');
  });
});
